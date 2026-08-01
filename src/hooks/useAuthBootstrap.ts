import { useEffect, useState } from 'react';
import { bootstrapAuth, hasStoredSession, isAuthBootstrapped } from '@/services/auth-bootstrap';
import { useApiBase } from './useApiBase';

/** How long to keep the loader up while an account switch re-authorizes. */
const REAUTH_TIMEOUT_MS = 15_000;

/**
 * Resolves the session before the UI renders.
 *
 * @param is_enabled defer the bootstrap until the app is ready for it (the root
 * store registers itself with `api_base`, so it must exist first).
 * @returns true once `activeLoginid` is known — either a loginid or, definitively, none.
 */
export const useAuthBootstrap = (is_enabled = true) => {
    const [is_auth_ready, setIsAuthReady] = useState(isAuthBootstrapped);

    useEffect(() => {
        if (!is_enabled || is_auth_ready) return;

        let is_mounted = true;
        bootstrapAuth().then(() => {
            if (is_mounted) setIsAuthReady(true);
        });

        return () => {
            is_mounted = false;
        };
    }, [is_enabled, is_auth_ready]);

    return is_auth_ready;
};

/**
 * True while an account switch tears the socket down and authorizes again.
 *
 * During that window `authData` is cleared, so without this the header would
 * flash its logged-out state. Gives up after {@link REAUTH_TIMEOUT_MS} so a
 * failed switch can't strand the app on the loader.
 */
export const useIsReauthorizing = (is_account_regenerating = false) => {
    const { isAuthorizing, activeLoginid } = useApiBase();
    const [has_timed_out, setHasTimedOut] = useState(false);

    // `is_account_regenerating` is cleared as soon as the new socket opens,
    // which is before `authorize` responds — hence the second clause.
    const is_reauthorizing = is_account_regenerating || (isAuthorizing && !activeLoginid && hasStoredSession());

    useEffect(() => {
        if (!is_reauthorizing) {
            setHasTimedOut(false);
            return;
        }

        const timer = setTimeout(() => setHasTimedOut(true), REAUTH_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [is_reauthorizing]);

    return is_reauthorizing && !has_timed_out;
};
