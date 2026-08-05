import { useMemo, useState } from 'react';
import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { MarketIcon } from '@/components/market/market-icon';
import { Localize, localize } from '@deriv-com/translations';
import { getSymbolCode, TActiveSymbol } from '../types';

type TSymbolSheetProps = {
    is_open: boolean;
    onClose: () => void;
    symbols: TActiveSymbol[];
    active_symbol: string;
    onSelect: (symbol: string) => void;
};

/** Groups stay in the order the API returns them. */
const groupBy = (symbols: TActiveSymbol[], key: 'market_display_name' | 'submarket_display_name') => {
    const groups = new Map<string, TActiveSymbol[]>();

    symbols.forEach(symbol => {
        const group = symbol[key] || localize('Other');
        groups.set(group, [...(groups.get(group) ?? []), symbol]);
    });

    return [...groups.entries()];
};

/**
 * Asset picker. Every tradable symbol the account has access to, searchable by
 * name or by code — a user who knows they want `1HZ100V` should not have to
 * scroll to "Volatility 100 (1s) Index" to find it.
 */
const SymbolSheet = ({ is_open, onClose, symbols, active_symbol, onSelect }: TSymbolSheetProps) => {
    const [query, setQuery] = useState('');
    const [active_market, setActiveMarket] = useState<string | null>(null);

    // Derived from the full symbol list, not the filtered one, so the pill row doesn't
    // reshuffle as the user types a search.
    const markets = useMemo(() => {
        const seen = new Set<string>();

        return symbols.reduce<string[]>((list, symbol) => {
            const market = symbol.market_display_name;
            if (market && !seen.has(market)) {
                seen.add(market);
                list.push(market);
            }
            return list;
        }, []);
    }, [symbols]);

    // Default to the first market pill, and fall back to it again if the account's
    // markets change (e.g. switching between real/demo) and the current pick disappears.
    const selected_market = active_market && markets.includes(active_market) ? active_market : (markets[0] ?? null);

    const groups = useMemo(() => {
        const search = query.trim().toLowerCase();

        const matches = symbols.filter(symbol => {
            if (selected_market && symbol.market_display_name !== selected_market) return false;
            if (!search) return true;

            const code = getSymbolCode(symbol).toLowerCase();
            return (symbol.display_name || '').toLowerCase().includes(search) || code.includes(search);
        });

        return groupBy(matches, 'submarket_display_name');
    }, [symbols, query, selected_market]);

    const handleSelect = (symbol: string) => {
        onSelect(symbol);
        setQuery('');
        onClose();
    };

    return (
        <BottomSheet
            is_open={is_open}
            onClose={onClose}
            title={localize('Select asset')}
            className='symbol-sheet'
            footer={null}
        >
            <input
                type='search'
                className='symbol-sheet__search'
                value={query}
                placeholder={localize('Search assets')}
                aria-label={localize('Search assets')}
                onChange={event => setQuery(event.target.value)}
            />

            {markets.length > 1 && (
                <div className='symbol-sheet__filters' role='tablist' aria-label={localize('Market')}>
                    {markets.map(market => (
                        <button
                            key={market}
                            type='button'
                            role='tab'
                            aria-selected={market === selected_market}
                            className={clsx('symbol-sheet__filter', {
                                'symbol-sheet__filter--active': market === selected_market,
                            })}
                            onClick={() => setActiveMarket(market)}
                        >
                            {market}
                        </button>
                    ))}
                </div>
            )}

            {groups.length === 0 && (
                <p className='symbol-sheet__empty'>
                    <Localize i18n_default_text='No assets match that search.' />
                </p>
            )}

            {groups.map(([submarket, submarket_symbols]) => (
                <section className='symbol-sheet__group' key={submarket}>
                    <h3 className='symbol-sheet__group-title'>{submarket}</h3>
                    <ul className='symbol-sheet__list'>
                        {submarket_symbols.map(symbol => {
                            const code = getSymbolCode(symbol);
                            const is_closed = symbol.exchange_is_open === 0;

                            return (
                                <li key={code}>
                                    <button
                                        type='button'
                                        className={clsx('symbol-sheet__row', {
                                            'symbol-sheet__row--active': code === active_symbol,
                                        })}
                                        onClick={() => handleSelect(code)}
                                    >
                                        <span className='symbol-sheet__row-icon' aria-hidden='true'>
                                            <MarketIcon type={code} size='sm' />
                                        </span>
                                        <span className='symbol-sheet__row-text'>
                                            <span className='symbol-sheet__row-name'>
                                                {symbol.display_name || code}
                                            </span>
                                        </span>
                                        {is_closed && (
                                            <span className='symbol-sheet__row-closed'>
                                                <Localize i18n_default_text='Closed' />
                                            </span>
                                        )}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </BottomSheet>
    );
};

export default SymbolSheet;
