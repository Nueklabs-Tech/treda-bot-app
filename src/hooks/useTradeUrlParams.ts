import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    DEFAULT_TRADE_PARAMS,
    isValidChartType,
    isValidInterval,
    isValidTradeType,
    TRADE_PARAMS,
} from '@/constants/trade';

export type TTradeParams = {
    chart_type: string;
    interval: string;
    symbol: string;
    trade_type: string;
};

const PARAM_KEYS = Object.values(TRADE_PARAMS);

/** A param the app does not recognise is treated as absent, not as an error. */
const sanitize = (search: URLSearchParams): TTradeParams => {
    const chart_type = search.get(TRADE_PARAMS.CHART_TYPE);
    const interval = search.get(TRADE_PARAMS.INTERVAL);
    const symbol = search.get(TRADE_PARAMS.SYMBOL);
    const trade_type = search.get(TRADE_PARAMS.TRADE_TYPE);

    return {
        chart_type: isValidChartType(chart_type) ? (chart_type as string) : DEFAULT_TRADE_PARAMS.chart_type,
        interval: isValidInterval(interval) ? (interval as string) : DEFAULT_TRADE_PARAMS.interval,
        symbol: symbol || DEFAULT_TRADE_PARAMS.symbol,
        trade_type: isValidTradeType(trade_type) ? (trade_type as string) : DEFAULT_TRADE_PARAMS.trade_type,
    };
};

/**
 * The `/trade` screen's state, held in the query string.
 *
 * Arriving without a complete query (`/trade`, or a link that only carries
 * `?account=…`) rewrites the URL to the full set — chart type, interval, symbol
 * and trade type — so the address bar always describes the screen and the link
 * can be shared as-is. The rewrite replaces the history entry, so Back still
 * leaves the screen rather than bouncing between the bare and filled URLs.
 *
 * Params the app does not own (`account`, `lang`) are preserved untouched.
 */
export const useTradeUrlParams = () => {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();

    const params = useMemo(() => sanitize(new URLSearchParams(search)), [search]);

    /** Merges `next` into the current query and navigates, keeping foreign params. */
    const setParams = useCallback(
        (next: Partial<TTradeParams>, options?: { replace?: boolean }) => {
            const search_params = new URLSearchParams(window.location.search);

            // Anything already in the URL that this screen owns is re-stated, so a
            // partial update never leaves the URL half-described.
            PARAM_KEYS.forEach(key => search_params.set(key, params[key as keyof TTradeParams]));
            Object.entries(next).forEach(([key, value]) => {
                if (value !== undefined) search_params.set(key, String(value));
            });

            if (search_params.toString() === new URLSearchParams(window.location.search).toString()) return;

            navigate({ pathname, search: `?${search_params.toString()}` }, { replace: options?.replace ?? false });
        },
        [navigate, params, pathname]
    );

    // Fill in (or correct) the query on arrival. `search` is the dependency rather
    // than `params`, so an external navigation that drops a param is re-filled too.
    useEffect(() => {
        const search_params = new URLSearchParams(search);
        const is_complete = PARAM_KEYS.every(key => search_params.get(key) === params[key as keyof TTradeParams]);

        if (is_complete) return;

        PARAM_KEYS.forEach(key => search_params.set(key, params[key as keyof TTradeParams]));
        navigate({ pathname, search: `?${search_params.toString()}` }, { replace: true });
    }, [navigate, params, pathname, search]);

    return { params, setParams };
};

export default useTradeUrlParams;
