type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

// Indices 0-3 are load-bearing: vendored bot code compares `active_tab` against
// them (and in a few places against the literal 1). Only ever append.
export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
    BOTS: 4,
});

// Legacy URL hash per tab, indexed by DBOT_TABS. The app is route-driven now
// (see @/constants/routes); this is kept so `/#bot_builder` style links still
// resolve — main.tsx redirects them to the equivalent path on load.
export const TAB_HASHES = ['dashboard', 'bot_builder', 'chart', 'tutorial', 'bots'];

export const MAX_STRATEGIES = 10;

export const TAB_IDS = ['id-dbot-dashboard', 'id-bot-builder', 'id-charts', 'id-tutorials', 'id-bots'];

export const DEBOUNCE_INTERVAL_TIME = 500;
