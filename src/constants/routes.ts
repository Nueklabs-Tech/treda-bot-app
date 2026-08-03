import { PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { DBOT_TABS, TAB_HASHES } from './bot-contents';

/**
 * Every screen the app owns. The four primary destinations (home, bots, chart,
 * wallet) are what the nav bars expose; the rest are reachable from inside them.
 */
export const APP_ROUTES = Object.freeze({
    HOME: '/',
    BOTS: '/bots',
    BUILDER: '/bots/builder',
    CHART: '/chart',
    TUTORIALS: '/tutorials',
    WALLET: '/wallet',
    PROFILE: '/profile',
});

/**
 * Routes that render their own full-screen chrome (dark hero + back button) and
 * therefore suppress the app header.
 */
export const STANDALONE_ROUTES: string[] = [APP_ROUTES.PROFILE, APP_ROUTES.WALLET];

/**
 * The URL is the source of truth for which screen is on show, but a large amount
 * of vendored bot code still reads (and writes) `dashboard.active_tab` — the run
 * panel, the Blockly workspace visibility, the tours. This table is the bridge:
 * main.tsx keeps the two in sync in both directions, so vendored
 * `setActiveTab(DBOT_TABS.BOT_BUILDER)` call sites keep working untouched and
 * still end up changing the URL.
 */
const TAB_BY_ROUTE: Record<string, number> = {
    [APP_ROUTES.HOME]: DBOT_TABS.DASHBOARD,
    [APP_ROUTES.BOTS]: DBOT_TABS.BOTS,
    [APP_ROUTES.BUILDER]: DBOT_TABS.BOT_BUILDER,
    [APP_ROUTES.CHART]: DBOT_TABS.CHART,
    [APP_ROUTES.TUTORIALS]: DBOT_TABS.TUTORIAL,
};

const ROUTE_BY_TAB: Record<number, string> = Object.entries(TAB_BY_ROUTE).reduce(
    (acc, [route, tab]) => ({ ...acc, [tab]: route }),
    {}
);

/** Trailing slashes and the preview basename are noise for route matching. */
const normalizePath = (pathname: string): string => {
    const path = pathname.replace(PREVIEW_BASE_PATH, '').replace(/\/+$/, '');

    return path || APP_ROUTES.HOME;
};

/**
 * The tab a pathname maps to, falling back to the dashboard so an unknown URL
 * still renders something coherent rather than a blank shell.
 */
export const getTabForPath = (pathname: string): number => {
    const path = normalizePath(pathname);

    if (path in TAB_BY_ROUTE) return TAB_BY_ROUTE[path];

    // /preview opens the builder — App Builder embeds the bot there.
    if (path.includes('/preview')) return DBOT_TABS.BOT_BUILDER;

    return DBOT_TABS.DASHBOARD;
};

export const getPathForTab = (tab: number): string => ROUTE_BY_TAB[tab] ?? APP_ROUTES.HOME;

/** True while the given nav destination is the one on screen. */
export const isRouteActive = (pathname: string, route: string): boolean => {
    const path = normalizePath(pathname);

    if (route === APP_ROUTES.HOME) return path === APP_ROUTES.HOME;

    return path === route || path.startsWith(`${route}/`);
};

/**
 * Before the app was route-driven the tab lived in the URL hash
 * (`/#bot_builder`). Old bookmarks, shared links and the tour deep-links still
 * carry those, so they are translated to the equivalent path on load.
 */
export const getRouteForLegacyHash = (hash: string): string | null => {
    const tab_hash = hash.replace(/^#/, '');
    if (!tab_hash) return null;

    const tab = TAB_HASHES.indexOf(tab_hash);

    return tab === -1 ? null : getPathForTab(tab);
};
