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
        phone?: string;
        country_code?: string;
        date_of_birth?: number;
        address_line_1?: string;
        address_line_2?: string;
        address_city?: string;
        address_state?: string;
        address_postcode?: string;
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

export type TPersonalDetails = {
    fullname?: string;
    email?: string;
    phone?: string;
    country?: string;
    date_of_birth?: string;
    address_line_1?: string;
    address_line_2?: string;
    address_city?: string;
    address_state?: string;
    address_postcode?: string;
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

/**
 * Fetches the full set of `get_settings` fields the Profile page's "Personal
 * details" panel shows in-app, replacing the old hand-off to Deriv's account
 * pages. Same call and socket as {@link fetchUserProfile}; kept separate since
 * this one is on-demand (fired when the user opens the panel) rather than
 * merged into the shared auth stream.
 *
 * @returns the details, or `null` when the call fails or returns nothing usable.
 */
export const fetchPersonalDetails = async (api: TSettingsApi | null): Promise<TPersonalDetails | null> => {
    if (!api?.send) return null;

    try {
        const response = await api.send({ get_settings: 1 });
        const settings = response?.get_settings;

        if (response?.error || !settings) return null;

        const from_parts = [settings.first_name, settings.last_name].filter(Boolean).join(' ').trim();
        const fullname = from_parts || settings.fullname?.trim() || '';

        return {
            fullname: fullname || undefined,
            email: settings.email || undefined,
            phone: settings.phone || undefined,
            country: settings.country_code?.toUpperCase() || undefined,
            date_of_birth: settings.date_of_birth
                ? new Date(settings.date_of_birth * 1000).toISOString().slice(0, 10)
                : undefined,
            address_line_1: settings.address_line_1 || undefined,
            address_line_2: settings.address_line_2 || undefined,
            address_city: settings.address_city || undefined,
            address_state: settings.address_state || undefined,
            address_postcode: settings.address_postcode || undefined,
        };
    } catch (error) {
        console.warn('[UserProfile] Could not fetch personal details:', error);
        return null;
    }
};
