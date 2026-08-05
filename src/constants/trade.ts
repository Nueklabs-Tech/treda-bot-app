import { localize } from '@deriv-com/translations';

export const TRADE_PARAMS = {
    CHART_TYPE: 'chart_type',
    INTERVAL: 'interval',
    SYMBOL: 'symbol',
    TRADE_TYPE: 'trade_type',
} as const;

export const DEFAULT_TRADE_PARAMS = Object.freeze({
    chart_type: 'area',
    interval: '1t',
    symbol: '1HZ100V',
    trade_type: 'rise_fall',
});

export const CHART_TYPES: Record<string, string> = {
    area: 'line',
    candle: 'candles',
    hollow: 'hollow',
    ohlc: 'ohlc',
};

const CHART_TYPE_BY_SMARTCHART_ID: Record<string, string> = Object.entries(CHART_TYPES).reduce(
    (acc, [chart_type, id]) => ({ ...acc, [id]: chart_type }),
    {}
);

export const INTERVALS: Record<string, number> = {
    '1t': 0,
    '1m': 60,
    '2m': 120,
    '3m': 180,
    '5m': 300,
    '10m': 600,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '8h': 28800,
    '1d': 86400,
};

const INTERVAL_BY_GRANULARITY: Record<number, string> = Object.entries(INTERVALS).reduce(
    (acc, [interval, granularity]) => ({ ...acc, [granularity]: interval }),
    {}
);

export type TDurationUnit = 't' | 's' | 'm' | 'h' | 'd';

export type TContractSide = {
    value: string;
    label: string;
    tone: 'up' | 'down';
};

export type TDurationRange = {
    unit: TDurationUnit;
    label: string;
    min: number;
    max: number;
    default: number;
};

export type TTradeTypeConfig = {
    value: string;
    label: string;
    sides: [TContractSide, TContractSide];
    durations: TDurationRange[];
    barrier?: 'digit' | 'offset';
    default_barrier?: string;
    description: string;
};

const TICKS: TDurationRange = { unit: 't', label: localize('Ticks'), min: 1, max: 10, default: 5 };
const MINUTES: TDurationRange = { unit: 'm', label: localize('Minutes'), min: 1, max: 60, default: 5 };
const HOURS: TDurationRange = { unit: 'h', label: localize('Hours'), min: 1, max: 24, default: 1 };

/**
 * The contracts this screen can price and buy. Everything about a trade type
 * lives here, so adding one is a table entry rather than a new branch in the
 * panel — the panel reads `sides`, `durations` and `barrier` and renders itself.
 *
 * Accumulators, multipliers, turbos and vanillas are deliberately absent: their
 * parameters (growth rate, take profit/stop loss, payout per point) do not fit
 * this stake/duration/barrier model and each needs its own panel.
 */
export const TRADE_TYPES: TTradeTypeConfig[] = [
    {
        value: 'rise_fall',
        label: localize('Rise/Fall'),
        description: localize('Will the exit spot be higher or lower than the entry spot?'),
        sides: [
            { value: 'CALL', label: localize('Rise'), tone: 'up' },
            { value: 'PUT', label: localize('Fall'), tone: 'down' },
        ],
        durations: [TICKS, MINUTES, HOURS],
    },
    {
        value: 'higher_lower',
        label: localize('Higher/Lower'),
        description: localize('Will the exit spot be above or below a barrier you choose?'),
        sides: [
            { value: 'CALL', label: localize('Higher'), tone: 'up' },
            { value: 'PUT', label: localize('Lower'), tone: 'down' },
        ],
        durations: [MINUTES, HOURS],
        barrier: 'offset',
        default_barrier: '+0.10',
    },
    {
        value: 'matches_differs',
        label: localize('Matches/Differs'),
        description: localize('Will the last digit match the one you pick?'),
        sides: [
            { value: 'DIGITMATCH', label: localize('Matches'), tone: 'up' },
            { value: 'DIGITDIFF', label: localize('Differs'), tone: 'down' },
        ],
        durations: [TICKS],
        barrier: 'digit',
        default_barrier: '5',
    },
    {
        value: 'over_under',
        label: localize('Over/Under'),
        description: localize('Will the last digit be over or under the one you pick?'),
        sides: [
            { value: 'DIGITOVER', label: localize('Over'), tone: 'up' },
            { value: 'DIGITUNDER', label: localize('Under'), tone: 'down' },
        ],
        durations: [TICKS],
        barrier: 'digit',
        default_barrier: '5',
    },
    {
        value: 'even_odd',
        label: localize('Even/Odd'),
        description: localize('Will the last digit be even or odd?'),
        sides: [
            { value: 'DIGITEVEN', label: localize('Even'), tone: 'up' },
            { value: 'DIGITODD', label: localize('Odd'), tone: 'down' },
        ],
        durations: [TICKS],
    },
];

export const getTradeTypeConfig = (trade_type: string): TTradeTypeConfig =>
    TRADE_TYPES.find(config => config.value === trade_type) ??
    (TRADE_TYPES.find(config => config.value === DEFAULT_TRADE_PARAMS.trade_type) as TTradeTypeConfig);

export const isValidChartType = (chart_type?: string | null): boolean =>
    Boolean(chart_type && chart_type in CHART_TYPES);

export const isValidInterval = (interval?: string | null): boolean => Boolean(interval && interval in INTERVALS);

export const isValidTradeType = (trade_type?: string | null): boolean =>
    TRADE_TYPES.some(config => config.value === trade_type);

export const getGranularity = (interval: string): number => INTERVALS[interval] ?? 0;

export const getInterval = (granularity?: number): string => INTERVAL_BY_GRANULARITY[granularity ?? 0] ?? '1t';

export const getSmartChartType = (chart_type: string): string =>
    CHART_TYPES[chart_type] ?? CHART_TYPES[DEFAULT_TRADE_PARAMS.chart_type];

export const getChartType = (smartchart_type?: string): string =>
    CHART_TYPE_BY_SMARTCHART_ID[smartchart_type ?? ''] ?? DEFAULT_TRADE_PARAMS.chart_type;

/** Stake bounds the panel enforces before it bothers the API with a proposal. */
export const STAKE_LIMITS = Object.freeze({ min: 0.35, max: 50000, default: 10 });
