/** The subset of an `active_symbols` entry this screen reads. */
export type TActiveSymbol = {
    symbol?: string;
    /** Newer API responses carry the symbol here; older ones use `symbol`. */
    underlying_symbol?: string;
    display_name?: string;
    market?: string;
    market_display_name?: string;
    submarket_display_name?: string;
    exchange_is_open?: 0 | 1;
    is_trading_suspended?: 0 | 1;
    pip?: number;
};

export const getSymbolCode = (active_symbol?: TActiveSymbol): string =>
    active_symbol?.underlying_symbol || active_symbol?.symbol || '';
