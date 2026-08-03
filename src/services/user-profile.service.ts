/**
 * Fetches the signed-in user's real name from Deriv.
 *
 * `api_base` never issues a classic `authorize` on this connection — the socket URL
 * is already minted for one account by the OTP exchange, so the auth payload it
 * publishes is assembled from the `balance` response and carries no personal
 * details. That left the UI greeting everyone as "Trader". `get_settings` is the
 * account-details call on that same authenticated socket, so it needs no extra
 * token, endpoint, or scope.
 */

type TGetSettingsResponse = {
    get_settings?: {
        email?: string;
        first_name?: string;
        last_name?: string;
        fullname?: string;
    };
    error?: { code?: string; message?: string };
};

type TSettingsApi = {
    send: (request: Record<string, unknown>) => Promise<TGetSettingsResponse>;
};

export type TUserProfile = {
    fullname?: string;
    email?: string;
};

/**
 * @returns the profile, or `null` when it is unavailable — a demo account with no
 * name on file, a backend that rejects the call, or a dropped socket. Callers keep
 * their existing fallback in that case; this is display polish, never a blocker.
 */
export const fetchUserProfile = async (api: TSettingsApi | null): Promise<TUserProfile | null> => {
    if (!api?.send) return null;

    try {
        const response = await api.send({ get_settings: 1 });
        const settings = response?.get_settings;

        if (response?.error || !settings) return null;

        // Deriv returns the parts separately; `fullname` is only populated for some
        // account types, so prefer the parts and fall back to it.
        const from_parts = [settings.first_name, settings.last_name].filter(Boolean).join(' ').trim();
        const fullname = from_parts || settings.fullname?.trim() || '';

        if (!fullname && !settings.email) return null;

        return {
            fullname: fullname || undefined,
            email: settings.email || undefined,
        };
    } catch (error) {
        // Demo accounts and older backends can reject `get_settings` outright. Log
        // once for diagnosis, then let the caller fall back.
        console.warn('[UserProfile] Could not fetch account settings:', error);
        return null;
    }
};
