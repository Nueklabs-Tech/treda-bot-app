import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { MarketIcon } from '@/components/market/market-icon';
import { APP_ROUTES } from '@/constants/routes';
import { TSpot } from '@/hooks/useTickStream';
import { localize } from '@deriv-com/translations';

type TSymbolHeaderProps = {
    symbol: string;
    display_name: string;
    submarket_name?: string;
    is_market_open: boolean;
    spot: TSpot;
    onOpenSymbolPicker: () => void;
};

/**
 * The asset line above the chart: which market is on screen, what it costs right
 * now, and the two ways out of here — the symbol picker and the positions list.
 *
 * The price is the same tick stream the contract is priced against, so a user
 * comparing the header to the payout is comparing like with like.
 */
const SymbolHeader = ({
    symbol,
    display_name,
    submarket_name,
    is_market_open,
    spot,
    onOpenSymbolPicker,
}: TSymbolHeaderProps) => {
    const navigate = useNavigate();

    return (
        <div className='symbol-header'>
            <button
                type='button'
                className='symbol-header__asset'
                onClick={onOpenSymbolPicker}
                aria-label={localize('Change asset')}
            >
                <span className='symbol-header__icon' aria-hidden='true'>
                    <MarketIcon type={symbol} size='sm' />
                </span>
                <span className='symbol-header__text'>
                    <span className='symbol-header__name'>
                        {display_name || symbol}
                        <svg
                            className='symbol-header__chevron'
                            width='16'
                            height='16'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            aria-hidden='true'
                        >
                            <path d='m6 9 6 6 6-6' />
                        </svg>
                    </span>
                    <span
                        className={clsx('symbol-header__price', `symbol-header__price--${spot.direction}`, {
                            'symbol-header__price--closed': !is_market_open,
                        })}
                    >
                        {is_market_open ? spot.display || '—' : localize('Market closed')}
                        {submarket_name && <span className='symbol-header__submarket'>{submarket_name}</span>}
                    </span>
                </span>
            </button>

            <button
                type='button'
                className='symbol-header__positions'
                onClick={() => navigate(APP_ROUTES.POSITIONS)}
                aria-label={localize('Open positions')}
            >
                <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.6'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'
                >
                    <path d='M5.5 4.5h11a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z' />
                    <path d='M8 9h6M8 13h6M8 17h3' />
                </svg>
            </button>
        </div>
    );
};

export default SymbolHeader;
