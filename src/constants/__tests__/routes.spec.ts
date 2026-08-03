import { DBOT_TABS } from '../bot-contents';
import { APP_ROUTES, getPathForTab, getRouteForLegacyHash, getTabForPath, isRouteActive } from '../routes';

describe('routes', () => {
    describe('getTabForPath', () => {
        it('maps every primary destination to its tab', () => {
            expect(getTabForPath(APP_ROUTES.HOME)).toBe(DBOT_TABS.DASHBOARD);
            expect(getTabForPath(APP_ROUTES.BOTS)).toBe(DBOT_TABS.BOTS);
            expect(getTabForPath(APP_ROUTES.BUILDER)).toBe(DBOT_TABS.BOT_BUILDER);
            expect(getTabForPath(APP_ROUTES.CHART)).toBe(DBOT_TABS.CHART);
            expect(getTabForPath(APP_ROUTES.TUTORIALS)).toBe(DBOT_TABS.TUTORIAL);
        });

        it('ignores trailing slashes and the preview basename', () => {
            expect(getTabForPath('/chart/')).toBe(DBOT_TABS.CHART);
            expect(getTabForPath('/bot/preview/bots')).toBe(DBOT_TABS.BOTS);
        });

        it('opens the builder in the App Builder preview', () => {
            expect(getTabForPath('/preview')).toBe(DBOT_TABS.BOT_BUILDER);
        });

        it('falls back to the dashboard for unknown paths', () => {
            expect(getTabForPath('/nope')).toBe(DBOT_TABS.DASHBOARD);
        });
    });

    describe('getPathForTab', () => {
        it('round-trips with getTabForPath', () => {
            [APP_ROUTES.HOME, APP_ROUTES.BOTS, APP_ROUTES.BUILDER, APP_ROUTES.CHART, APP_ROUTES.TUTORIALS].forEach(
                route => {
                    expect(getPathForTab(getTabForPath(route))).toBe(route);
                }
            );
        });

        it('sends an unmapped tab home', () => {
            expect(getPathForTab(99)).toBe(APP_ROUTES.HOME);
        });
    });

    describe('isRouteActive', () => {
        it('treats home as an exact match only', () => {
            expect(isRouteActive('/', APP_ROUTES.HOME)).toBe(true);
            expect(isRouteActive('/chart', APP_ROUTES.HOME)).toBe(false);
        });

        it('keeps the parent destination active on a nested route', () => {
            expect(isRouteActive(APP_ROUTES.BUILDER, APP_ROUTES.BOTS)).toBe(true);
            expect(isRouteActive(APP_ROUTES.CHART, APP_ROUTES.BOTS)).toBe(false);
        });
    });

    describe('getRouteForLegacyHash', () => {
        it('translates the pre-router tab hashes', () => {
            expect(getRouteForLegacyHash('#bot_builder')).toBe(APP_ROUTES.BUILDER);
            expect(getRouteForLegacyHash('chart')).toBe(APP_ROUTES.CHART);
        });

        it('returns null when there is nothing to translate', () => {
            expect(getRouteForLegacyHash('')).toBeNull();
            expect(getRouteForLegacyHash('#something-else')).toBeNull();
        });
    });
});
