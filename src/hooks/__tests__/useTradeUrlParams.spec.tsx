import { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { DEFAULT_TRADE_PARAMS } from '@/constants/trade';
import { useTradeUrlParams } from '../useTradeUrlParams';

const wrapper =
    (initial_entry: string) =>
    ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[initial_entry]}>{children}</MemoryRouter>;

/** The hook plus the URL it has produced, which is what the tests assert on. */
const renderTradeParams = (initial_entry: string) =>
    renderHook(
        () => {
            const { search } = useLocation();

            return { ...useTradeUrlParams(), search };
        },
        { wrapper: wrapper(initial_entry) }
    );

describe('useTradeUrlParams', () => {
    it('fills the URL with the default params when it arrives bare', () => {
        const { result } = renderTradeParams('/trade');

        expect(result.current.params).toEqual(DEFAULT_TRADE_PARAMS);
        expect(result.current.search).toBe('?chart_type=area&interval=1t&symbol=1HZ100V&trade_type=rise_fall');
    });

    it('keeps params it does not own while filling in the missing ones', () => {
        const { result } = renderTradeParams('/trade?account=USD');

        expect(result.current.search).toContain('account=USD');
        expect(result.current.search).toContain('symbol=1HZ100V');
    });

    it('honours the values already in the URL', () => {
        const { result } = renderTradeParams('/trade?chart_type=candle&interval=5m&symbol=R_50&trade_type=even_odd');

        expect(result.current.params).toEqual({
            chart_type: 'candle',
            interval: '5m',
            symbol: 'R_50',
            trade_type: 'even_odd',
        });
    });

    it('replaces values it does not recognise with the defaults', () => {
        const { result } = renderTradeParams('/trade?chart_type=heikin&interval=7y&trade_type=lottery');

        expect(result.current.params.chart_type).toBe(DEFAULT_TRADE_PARAMS.chart_type);
        expect(result.current.params.interval).toBe(DEFAULT_TRADE_PARAMS.interval);
        expect(result.current.params.trade_type).toBe(DEFAULT_TRADE_PARAMS.trade_type);
    });

    it('updates one param without dropping the rest', () => {
        const { result } = renderTradeParams('/trade');

        act(() => result.current.setParams({ symbol: 'R_100' }));

        expect(result.current.params).toEqual({ ...DEFAULT_TRADE_PARAMS, symbol: 'R_100' });
        expect(result.current.search).toBe('?chart_type=area&interval=1t&symbol=R_100&trade_type=rise_fall');
    });
});
