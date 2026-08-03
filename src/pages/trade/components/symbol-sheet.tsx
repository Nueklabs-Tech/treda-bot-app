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

/** Groups stay in the order the API returns them — markets first, then submarkets. */
const groupByMarket = (symbols: TActiveSymbol[]) => {
    const groups = new Map<string, TActiveSymbol[]>();

    symbols.forEach(symbol => {
        const market = symbol.market_display_name || localize('Other');
        groups.set(market, [...(groups.get(market) ?? []), symbol]);
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

    const groups = useMemo(() => {
        const search = query.trim().toLowerCase();
        const matches = search
            ? symbols.filter(symbol => {
                  const code = getSymbolCode(symbol).toLowerCase();

                  return (symbol.display_name || '').toLowerCase().includes(search) || code.includes(search);
              })
            : symbols;

        return groupByMarket(matches);
    }, [symbols, query]);

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

            {groups.length === 0 && (
                <p className='symbol-sheet__empty'>
                    <Localize i18n_default_text='No assets match that search.' />
                </p>
            )}

            {groups.map(([market, market_symbols]) => (
                <section className='symbol-sheet__group' key={market}>
                    <h3 className='symbol-sheet__group-title'>{market}</h3>
                    <ul className='symbol-sheet__list'>
                        {market_symbols.map(symbol => {
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
                                            <span className='symbol-sheet__row-meta'>
                                                {symbol.submarket_display_name}
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
