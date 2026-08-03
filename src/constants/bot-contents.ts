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

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TUTORIAL: 3,
});

// URL hash per tab, indexed by DBOT_TABS — main.tsx reads it on mount to decide
// which tab to open, and rewrites it whenever the active tab changes.
export const TAB_HASHES = ['dashboard', 'bot_builder', 'chart', 'tutorial'];

export const MAX_STRATEGIES = 10;

export const TAB_IDS = ['id-dbot-dashboard', 'id-bot-builder', 'id-charts', 'id-tutorials'];

export const DEBOUNCE_INTERVAL_TIME = 500;
