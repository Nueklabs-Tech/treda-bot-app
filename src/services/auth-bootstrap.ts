import { combineLatest, filter, firstValueFrom, take, timeout } from 'rxjs';
import {
    authData$,
    isAuthorizing$,
    setIsAuthorizing,
} from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import {
    cleanupUrl,
    clearAllAuthData,
    getStoredAuthInfo,
    handleOAuthCallback,
    refreshAccessToken,
} from '@/external/deriv-core';
import { isDemoAccount } from '@/utils/account-helpers';
import { getOAuthRedirectUri } from '@/utils/oauth-redirect';

/**
 * Single entry point for resolving the user's session.
 *
 * The whole login flow — OAuth code exchange, accounts fetch, WebSocket
 * creation and `authorize` — is run here *once*, before the app UI renders, so
 * that by the time components mount `activeLoginid` is already known (either a
 * loginid, or definitively empty). That is what lets the UI render a single
 * full-page <AppLoading /> instead of per-component spinners.
 *
 * Idempotent: every caller awaits the same promise.
 */

/** How long to wait for `authorize` to come back before falling back to the logged-out UI. */
const AUTH_SETTLE_TIMEOUT_MS = 20_000;

/** Treat a token expiring within this window as already expired. */
const TOKEN_EXPIRY_SKEW_S = 60;

let bootstrap_promise: Promise<void> | null = null;
let is_bootstrapped = false;
let did_return_from_oauth = false;

/** True once the bootstrap has finished — used to skip the loader on remounts. */
export const isAuthBootstrapped = () => is_bootstrapped;

/** True when an account is (or is about to be) available to authorize with. */
export const hasStoredSession = () => {
    // `account_id` is consumed by api_base once the socket opens, so it counts
    // as a session even before it reaches localStorage.
    if (new URLSearchParams(window.location.search).get('account_id')) return true;

    const active_loginid = localStorage.getItem('active_loginid');
    return Boolean(active_loginid && active_loginid !== 'null');
};

/**
 * A return trip from the provider, successful or not.
 *
 * `error` counts: a cancelled or denied consent comes back with no `code`, and
 * it still has to be surfaced, cleaned out of the URL, and routed off the
 * callback path — otherwise the user is stranded there with the error sitting in
 * the address bar for the rest of the session.
 */
const isOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') || params.has('error');
};

/**
 * True once for the navigation that came back from the provider, so the router
 * can replace its location with the app root.
 *
 * The URL is rewritten underneath the router — by `cleanupUrl` here and inside
 * `handleOAuthCallback` — and `history.replaceState` is invisible to
 * react-router, which would otherwise keep resolving links against the callback
 * path. Routing the return trip has to happen inside the router, not here.
 */
export const consumeOAuthReturn = () => {
    const did_return = did_return_from_oauth;
    did_return_from_oauth = false;
    return did_return;
};

/**
 * Exchanges the OAuth code for tokens and stores the returned accounts.
 * @returns true when a session was established.
 */
const completeOAuthCallback = async () => {
    try {
        // `redirectUri` must be the exact value that was sent to /authorize
        // (RFC 6749 §4.1.3) — hence the shared helper rather than
        // `window.location.origin`, which silently diverged from the configured
        // NEXT_PUBLIC_DERIV_REDIRECT_URI and made every exchange fail with
        // invalid_grant.
        const auth_info = await handleOAuthCallback(window.location.href, {
            clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
            redirectUri: getOAuthRedirectUri(),
            scopes: 'trade',
        });

        const { DerivWSAccountsService } = await import('@/services/derivws-accounts.service');
        const accounts = await DerivWSAccountsService.fetchAccountsList(auth_info.access_token);

        if (!accounts?.length) {
            // The exchange already persisted `auth_info`. Leaving it there would
            // hand `getSocketURL()` a usable token for a session the UI presents
            // as logged out, so drop the whole thing.
            console.error('No accounts returned after authentication');
            clearAllAuthData();
            return false;
        }

        DerivWSAccountsService.storeAccounts(accounts);
        const [first_account] = accounts;
        localStorage.setItem('active_loginid', first_account.account_id);
        localStorage.setItem('account_type', isDemoAccount(first_account.account_id) ? 'demo' : 'real');

        return true;
    } catch (error) {
        console.error('OAuth callback error:', error);
        return false;
    } finally {
        // `handleOAuthCallback` cleans the URL on its own success and validation
        // paths, but not when the token request itself fails — repeat it here so
        // a spent `code` can never survive into a reload.
        cleanupUrl(getOAuthRedirectUri());
        did_return_from_oauth = true;
    }
};

/**
 * Refreshes the stored access token when it is expired or about to be, and drops
 * the session when it cannot be renewed.
 *
 * `getSocketURL()` reads the token to resolve an authenticated endpoint and
 * quietly falls back to the public one when it is missing or stale. Without this
 * the app would keep `active_loginid` — and so keep presenting a logged-in
 * account — while trading over an unauthenticated socket.
 */
const ensureValidAccessToken = async () => {
    const auth_info = getStoredAuthInfo();
    if (!auth_info?.access_token) return;

    const expires_at = auth_info.expires_at ?? 0;
    if (expires_at - TOKEN_EXPIRY_SKEW_S > Math.floor(Date.now() / 1000)) return;

    if (auth_info.refresh_token) {
        try {
            await refreshAccessToken(auth_info.refresh_token, process.env.NEXT_PUBLIC_DERIV_APP_ID || '');
            return;
        } catch (error) {
            console.error('Access token refresh failed:', error);
        }
    }

    clearAllAuthData();
};

/**
 * Resolves once authorization has either produced an account or given up.
 * `api_base` authorizes on socket open, so this waits on its observables
 * rather than on the `init()` promise.
 */
const waitForAuthToSettle = async () => {
    const settled$ = combineLatest([authData$, isAuthorizing$]).pipe(
        filter(([auth_data, is_authorizing]) => Boolean(auth_data?.loginid) || !is_authorizing),
        take(1),
        timeout({ first: AUTH_SETTLE_TIMEOUT_MS })
    );

    try {
        await firstValueFrom(settled$);
    } catch {
        // Authorization never came back (socket down, backend unreachable):
        // settle into the logged-out UI rather than holding the loader forever.
        setIsAuthorizing(false);
    }
};

const runBootstrap = async () => {
    const is_fresh_login = isOAuthCallback() ? await completeOAuthCallback() : false;

    // A token minted seconds ago is trivially fresh; this is for the returning
    // visitor whose stored one has aged out. Must run before the socket opens.
    if (!is_fresh_login) await ensureValidAccessToken();

    const { api_base } = await import('@/external/bot-skeleton');

    try {
        // A fresh login needs a brand new socket — any existing one was opened
        // for a different account, or for none at all.
        await api_base.init(is_fresh_login);
    } catch (error) {
        console.error('API initialization failed:', error);
    }

    if (!hasStoredSession()) {
        // Nothing to authorize. The stream starts in the "authorizing" state so
        // the app can show a loader on first paint; clear it now.
        setIsAuthorizing(false);
        return;
    }

    await waitForAuthToSettle();
};

/** Runs the login flow once per page load and resolves when the session is settled. */
export const bootstrapAuth = () => {
    if (!bootstrap_promise) {
        bootstrap_promise = runBootstrap().finally(() => {
            is_bootstrapped = true;
        });
    }

    return bootstrap_promise;
};
