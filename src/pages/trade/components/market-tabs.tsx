import clsx from 'clsx';
import { MarketIcon } from '@/components/market/market-icon';
import { useTickStream } from '@/hooks/useTickStream';
import { localize } from '@deriv-com/translations';

type TMarketTabsProps = {
    symbol: string;
    display_name: string;
    trade_type_label: string;
    is_market_open: boolean;
    onOpenSymbolPicker: () => void;
};

/**
 * The tab strip above the chart: the open market + trade type, and the way to
 * change it. Only one tab exists today — the markup mirrors dtrader's own
 * market-tabs bar so a second tab can be added later without a redesign.
 *
 * SmartChart's own asset ticker duplicated this (see chart.tsx's topWidgets),
 * so the live price lives here instead — this is the only header the trade
 * screen shows.
 */
const MarketTabs = ({ symbol, display_name, trade_type_label, is_market_open, onOpenSymbolPicker }: TMarketTabsProps) => {
    const { display, change, change_percentage } = useTickStream(symbol);
    // Colour/arrow track the session change, not the last tick's direction, so
    // the two can't disagree (e.g. "+0.24 ▼").
    const is_up = (change ?? 0) >= 0;

    return (
        <div className='trade__market-tabs'>
            <div className='market-tabs' data-testid='dt_market_tabs'>
                <button
                    type='button'
                    className='market-tabs__add'
                    onClick={onOpenSymbolPicker}
                    aria-label={localize('Add market')}
                >
                    <svg width='32' height='32' viewBox='0 0 32 32' fill='currentColor' aria-hidden='true'>
                        <path d='M16.938 9.313v6.25h6.25a.95.95 0 0 1 .937.937c0 .547-.43.938-.937.938h-6.25v6.25c0 .546-.43.937-.938.937-.547 0-.937-.39-.937-.937v-6.25h-6.25c-.547 0-.938-.391-.938-.938 0-.508.39-.937.938-.937h6.25v-6.25c0-.508.39-.938.937-.938a.95.95 0 0 1 .938.938' />
                    </svg>
                </button>

                <div className='market-tabs__list' data-testid='dt_market_tabs_list'>
                    <button
                        type='button'
                        className='market-tab market-tab--active'
                        data-testid='dt_market_tab'
                        aria-current='true'
                        onClick={onOpenSymbolPicker}
                    >
                        <span className='market-tab__icon' aria-hidden='true'>
                            <MarketIcon type={symbol} size='md' />
                        </span>
                        <span className='market-tab__text'>
                            <span className='market-tab__name'>{display_name || symbol}</span>
                            {is_market_open && display ? (
                                <span
                                    className={clsx('market-tab__price', {
                                        'market-tab__price--up': is_up,
                                        'market-tab__price--down': !is_up,
                                    })}
                                >
                                    <span className='market-tab__quote'>{display}</span>
                                    {change !== null && change_percentage !== null && (
                                        <span className='market-tab__change'>
                                            {is_up ? '+' : ''}
                                            {change.toFixed(2)} ({change_percentage.toFixed(2)}%)
                                            <span className='market-tab__arrow' aria-hidden='true'>
                                                {is_up ? '▲' : '▼'}
                                            </span>
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span
                                    className={clsx('market-tab__subtitle', {
                                        'market-tab__subtitle--closed': !is_market_open,
                                    })}
                                >
                                    {is_market_open ? trade_type_label : localize('Market closed')}
                                </span>
                            )}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarketTabs;
