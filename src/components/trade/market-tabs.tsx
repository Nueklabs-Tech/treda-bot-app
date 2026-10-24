import clsx from 'clsx';
import { MarketIcon } from '@/components/market/market-icon';
import { localize } from '@deriv-com/translations';

type TMarketTabsProps = {
    symbol: string;
    display_name: string;
    trade_type_label: string;
    is_market_open: boolean;
    onOpenSymbolPicker: () => void;
    onOpenTradeTypePicker: () => void;
};

/**
 * The tab strip above the chart: the open market + trade type, and the way to
 * change either. Only one tab exists today — the markup mirrors dtrader's own
 * market-tabs bar so a second tab can be added later without a redesign.
 *
 * As on dtrader's mobile screen, the card names the market and the trade type,
 * not the price: the chart's own spot marker already shows the live quote. The
 * name opens the market picker and the "Rise/Fall ⌄" line the trade type
 * picker — two buttons side by side, since a button cannot nest another.
 */
const MarketTabs = ({
    symbol,
    display_name,
    trade_type_label,
    is_market_open,
    onOpenSymbolPicker,
    onOpenTradeTypePicker,
}: TMarketTabsProps) => (
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
                <div className='market-tab market-tab--active' data-testid='dt_market_tab' aria-current='true'>
                    <button
                        type='button'
                        className='market-tab__icon'
                        onClick={onOpenSymbolPicker}
                        aria-label={localize('Change market')}
                    >
                        <MarketIcon type={symbol} size='md' />
                    </button>
                    <span className='market-tab__text'>
                        <button type='button' className='market-tab__name' onClick={onOpenSymbolPicker}>
                            {display_name || symbol}
                        </button>
                        <button
                            type='button'
                            className={clsx('market-tab__trade-type', {
                                'market-tab__trade-type--closed': !is_market_open,
                            })}
                            onClick={onOpenTradeTypePicker}
                            aria-label={localize('Change trade type')}
                        >
                            {is_market_open ? trade_type_label : localize('Market closed')}
                            <svg
                                className='market-tab__chevron'
                                width='16'
                                height='16'
                                viewBox='0 0 16 16'
                                fill='none'
                                aria-hidden='true'
                            >
                                <path
                                    d='m4 6 4 4 4-4'
                                    stroke='currentColor'
                                    strokeWidth='1.4'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export default MarketTabs;
