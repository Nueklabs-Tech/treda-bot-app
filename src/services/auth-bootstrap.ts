import { combineLatest, filter, firstValueFrom, take, timeout } from 'rxjs';
import {
    authData$,
    isAuthorizing$,
    setIsAuthorizing,
} from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { cleanupUrl, handleOAuthCallback } from '@/external/deriv-core';
import { isDemoAccount } from '@/utils/account-helpers';

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

let bootstrap_promise: Promise<void> | null = null;
let is_bootstrapped = false;

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

const isOAuthCallback = () => new URLSearchParams(window.location.search).has('code');

/**
 * Exchanges the OAuth code for tokens and stores the returned accounts.
 * @returns true when a session was established.
 */
const completeOAuthCallback = async () => {
    try {
        const auth_info = await handleOAuthCallback(window.location.href, {
            clientId: process.env.NEXT_PUBLIC_DERIV_APP_ID || '',
            redirectUri: window.location.origin,
            scopes: 'trade',
        });

        const { DerivWSAccountsService } = await import('@/services/derivws-accounts.service');
        const accounts = await DerivWSAccountsService.fetchAccountsList(auth_info.access_token);

        if (!accounts?.length) {
            console.error('No accounts returned after authentication');
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
        cleanupUrl(window.location.origin);
    }
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
