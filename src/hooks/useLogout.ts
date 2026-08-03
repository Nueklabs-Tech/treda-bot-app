import { useCallback } from 'react';
import { clearAllAuthData } from '@/external/deriv-core';
import { useStore } from '@/hooks/useStore';
import { ErrorLogger } from '@/utils/error-logger';

/** Session keys written by the legacy auth path, which `clearAllAuthData` does not know about. */
const LEGACY_AUTH_KEYS = ['authToken', 'accountsList', 'clientAccounts'];

/**
 * Custom hook to handle logout functionality
 * Clears all session and local storage to reset the session
 * @returns {Function} handleLogout - Function to trigger the logout process
 */
export const useLogout = () => {
    const { client } = useStore() ?? {};

    return useCallback(async () => {
        try {
            // Call the client store logout method which clears all storage
            await client?.logout();
            // Analytics.reset() removed - Analytics package has been removed from the project
            // See migrate-docs/MONITORING_PACKAGES.md for re-enabling analytics if needed
        } catch (error) {
            ErrorLogger.error('Logout', 'Logout failed', error);
        }

        // Runs whether or not the client store logout succeeded: it owns its own
        // keys, not the ones the OAuth layer writes. `clearAllAuthData` covers
        // those — auth_info, deriv_accounts, active_loginid, account_type, and
        // the sessionStorage CSRF token and PKCE verifier — while leaving user
        // preferences (theme, language) intact. Anything left behind here reads
        // back as a live session on the next load.
        try {
            clearAllAuthData();
            LEGACY_AUTH_KEYS.forEach(key => localStorage.removeItem(key));
        } catch (storageError) {
            ErrorLogger.error('Logout', 'Failed to clear auth storage', storageError);
            // Last resort: if targeted clearing fails, clear all storage
            try {
                sessionStorage.clear();
                localStorage.clear();
            } catch (finalError) {
                ErrorLogger.error('Logout', 'Failed to clear all storage', finalError);
            }
        }
    }, [client]);
};
