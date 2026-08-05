import { useEffect, useMemo, useRef, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { getPipDecimals, subscribeToStream } from '@/utils/api-subscription';
import { useApiBase } from './useApiBase';

type TTick = {
    quote: number;
    epoch: number;
    symbol: string;
};

export type TSpot = {
    quote: number | null;
    /** `quote` formatted to the symbol's pip size, ready to render. */
    display: string;
    /** Change from the first quote seen this subscription — a session reference, not a prior close. */
    change: number | null;
    change_percentage: number | null;
    /** Direction of the last move, for colouring the price. */
    direction: 'up' | 'down' | 'none';
    decimals: number;
    is_loading: boolean;
};

/**
 * Live spot price for one symbol, on the authorized socket.
 *
 * The chart runs its own tick subscription on the separate `chart_api` socket;
 * this one exists so the header price keeps updating regardless of what the
 * chart is doing (a different granularity, a reload, a modal on top of it).
 */
export const useTickStream = (symbol: string): TSpot => {
    const { connectionStatus } = useApiBase();
    const [quote, setQuote] = useState<number | null>(null);
    const [change, setChange] = useState<{ amount: number; percentage: number } | null>(null);
    const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
    const previous_quote = useRef<number | null>(null);
    const reference_quote = useRef<number | null>(null);

    const decimals = useMemo(() => {
        const active_symbol = (api_base?.active_symbols ?? []).find(
            (item: any) => (item.underlying_symbol || item.symbol) === symbol
        );

        return getPipDecimals(active_symbol?.pip);
    }, [symbol]);

    useEffect(() => {
        if (!symbol || connectionStatus !== CONNECTION_STATUS.OPENED) return;

        setQuote(null);
        setChange(null);
        previous_quote.current = null;
        reference_quote.current = null;
        setDirection('none');

        return subscribeToStream<TTick>({
            request: { ticks: symbol },
            msg_type: 'tick',
            onData: tick => {
                if (typeof tick?.quote !== 'number') return;

                if (reference_quote.current === null) reference_quote.current = tick.quote;

                setDirection(() => {
                    const previous = previous_quote.current;
                    previous_quote.current = tick.quote;

                    if (previous === null || previous === tick.quote) return 'none';

                    return tick.quote > previous ? 'up' : 'down';
                });
                setQuote(tick.quote);

                const reference = reference_quote.current;
                setChange(
                    reference
                        ? { amount: tick.quote - reference, percentage: ((tick.quote - reference) / reference) * 100 }
                        : null
                );
            },
            onError: () => {
                setQuote(null);
                setChange(null);
            },
        });
    }, [symbol, connectionStatus]);

    return {
        quote,
        display: quote === null ? '' : quote.toFixed(decimals),
        change: change?.amount ?? null,
        change_percentage: change?.percentage ?? null,
        direction,
        decimals,
        is_loading: quote === null,
    };
};

export default useTickStream;
