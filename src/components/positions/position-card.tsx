import clsx from 'clsx';
import { MarketIcon } from '@/components/market/market-icon';
import { Icon } from '@/components/page-shell/icons';
import Money from '@/components/shared_ui/money';
import { TPosition } from '@/hooks/usePositions';
import { useCountdown } from '@/hooks/useCountdown';
import { Localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './position-card.scss';

type TPositionCardProps = {
    position: TPosition;
    variant: 'open' | 'closed';
    /** Tapping the card opens its contract details. Omit for a static, read-only card. */
    onClick?: () => void;
};

/**
 * One position, open or closed. Both variants share the same head (icon, name,
 * side, stake) and differ only in the footer: a live countdown for an open
 * contract, a settlement date/result badge for a closed one.
 */
const PositionCard = ({ position, variant, onClick }: TPositionCardProps) => {
    const countdown = useCountdown(variant === 'open' ? position.date_expiry : undefined);
    const is_win = position.profit >= 0;

    return (
        <div
            className='position-card'
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                onClick
                    ? event => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          onClick();
                      }
                    : undefined
            }
            aria-label={onClick ? position.display_name : undefined}
        >
            <div className='position-card__top'>
                <span className='position-card__icon' aria-hidden='true'>
                    <MarketIcon type={position.symbol} size='sm' />
                </span>

                <div className='position-card__info'>
                    <span className='position-card__name'>{position.display_name}</span>
                    <span className='position-card__side'>{position.side_label}</span>
                </div>

                <div className='position-card__top-right'>
                    <span className='position-card__chart-icon' aria-hidden='true'>
                        <Icon name='candles' size={16} />
                    </span>
                    <span className='position-card__stake'>
                        <Money amount={position.buy_price} currency={position.currency} show_currency />
                    </span>
                </div>
            </div>

            <div className='position-card__bottom'>
                {variant === 'open' ? (
                    <span className='position-card__timer'>
                        <Icon name='clock' size={14} />
                        {countdown ?? (
                            position.tick_count ? (
                                <Localize i18n_default_text='{{count}} ticks' values={{ count: position.tick_count }} />
                            ) : (
                                '—'
                            )
                        )}
                    </span>
                ) : (
                    <span
                        className={clsx(
                            'position-card__badge',
                            is_win ? 'position-card__badge--win' : 'position-card__badge--loss'
                        )}
                    >
                        <Localize i18n_default_text='Closed' />
                    </span>
                )}

                <span
                    className={clsx(
                        'position-card__profit',
                        is_win ? 'position-card__profit--win' : 'position-card__profit--loss'
                    )}
                >
                    <Money amount={position.profit} currency={position.currency} has_sign show_currency />
                </span>
            </div>
        </div>
    );
};

export default PositionCard;
