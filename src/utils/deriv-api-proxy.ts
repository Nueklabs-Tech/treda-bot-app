/**
 * Same-origin proxy for the Deriv REST API.
 *
 * Every call to `api.derivws.com` carries an `Authorization` header, which makes it a
 * non-simple request: the browser sends a CORS preflight first. The API does answer
 * preflights (it reflects whatever `Origin` it is given), but when the app is served
 * from a tunnel such as ngrok those `OPTIONS` requests are intermittently rejected
 * upstream, and the response then carries no `Access-Control-Allow-Origin` at all —
 * which fails the OAuth callback's accounts fetch before the user is ever signed in.
 *
 * The dev server proxies `/deriv-api/*` to the API host (see rsbuild.config.ts), so in
 * development the request is same-origin and no preflight is sent. `NEXT_PUBLIC_DERIV_API_PROXY`
 * is baked in as the proxy prefix by the dev build and as an empty string by the
 * production build, where the browser talks to the API host directly.
 */
const PROXY_PREFIX = process.env.NEXT_PUBLIC_DERIV_API_PROXY ?? '';

/**
 * Rewrites an absolute Deriv API URL onto the dev proxy, preserving its path.
 * Returns the URL untouched when no proxy is configured (production builds) or when it
 * is already relative.
 *
 * @example
 * // dev:  'https://api.derivws.com/trading/v1/' -> '/deriv-api/trading/v1/'
 * // prod: 'https://api.derivws.com/trading/v1/' -> 'https://api.derivws.com/trading/v1/'
 */
export const toProxiedDerivApiUrl = (url: string): string => {
    if (!PROXY_PREFIX || !/^https?:\/\//i.test(url)) return url;

    try {
        const { pathname, search } = new URL(url);
        return `${PROXY_PREFIX}${pathname}${search}`;
    } catch {
        // A malformed URL is the caller's problem, not something to swallow here.
        return url;
    }
};

export const isDerivApiProxied = (): boolean => Boolean(PROXY_PREFIX);
