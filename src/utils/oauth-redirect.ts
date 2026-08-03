/**
 * Single source of truth for the OAuth `redirect_uri`.
 *
 * RFC 6749 §4.1.3 requires the `redirect_uri` sent to the token endpoint to be
 * byte-identical to the one sent to the authorization endpoint. Deriv enforces
 * this, so both sides must derive it here rather than each building their own.
 *
 * `NEXT_PUBLIC_DERIV_REDIRECT_URI` is baked in at build time (rsbuild
 * `source.define`) and must match a URI registered on the Deriv app. When it is
 * unset we fall back to the current origin, which is the correct value for a
 * deployment whose registered URI is just its root.
 */
/**
 * Cleans up the shapes of the configured value that the provider would reject as
 * "does not match any pre-registered redirect urls":
 *
 * - surrounding quotes, from an env var exported by a shell that does not strip
 *   them the way dotenv does;
 * - stray whitespace or a trailing newline;
 * - a trailing slash on a bare origin — `https://host/` and `https://host` are
 *   the same resource, but providers register the latter and compare literally.
 *
 * A trailing slash on a URI that has a real path (`/callback/`) is left alone:
 * there it is a meaningful part of the path and may be what was registered.
 */
const normalizeRedirectUri = (value: string): string => {
    const trimmed = value.trim().replace(/^["']|["']$/g, '');
    if (!trimmed) return '';

    try {
        const url = new URL(trimmed);
        const is_bare_origin = url.pathname === '/' && !url.search && !url.hash;
        return is_bare_origin ? url.origin : trimmed.replace(/\/+$/, '');
    } catch {
        // Not parseable as a URL — hand it through untouched rather than
        // guessing, so the provider's error names the value that was configured.
        return trimmed;
    }
};

export const getOAuthRedirectUri = (): string =>
    normalizeRedirectUri(process.env.NEXT_PUBLIC_DERIV_REDIRECT_URI ?? '') || window.location.origin;

/**
 * Path portion of the configured redirect URI (e.g. `/callback`), or `/` when
 * the redirect lands on the origin. Used to route the OAuth return trip.
 */
export const getOAuthRedirectPath = (): string => {
    try {
        return new URL(getOAuthRedirectUri()).pathname || '/';
    } catch {
        return '/';
    }
};
