import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { TradeTypeIcon } from '@/components/trade-type/trade-type-icon';
import { TRADE_TYPES } from '@/constants/trade';
import { localize } from '@deriv-com/translations';

type TTradeTypeTabsProps = {
    value: string;
    onSelect: (trade_type: string) => void;
};

/**
 * The row of contract chips along the top of the screen. It scrolls horizontally
 * rather than wrapping, so the strip keeps its height no matter how many trade
 * types the app grows — and the selected one is scrolled into view on arrival,
 * which matters when a shared link opens on a chip that starts off-screen.
 */
const TradeTypeTabs = ({ value, onSelect }: TTradeTypeTabsProps) => {
    const active_ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        active_ref.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }, [value]);

    return (
        <div className='trade-types' role='tablist' aria-label={localize('Trade type')}>
            {TRADE_TYPES.map(trade_type => {
                const is_active = trade_type.value === value;

                return (
                    <button
                        key={trade_type.value}
                        ref={is_active ? active_ref : undefined}
                        type='button'
                        role='tab'
                        aria-selected={is_active}
                        className={clsx('trade-types__chip', { 'trade-types__chip--active': is_active })}
                        onClick={() => onSelect(trade_type.value)}
                    >
                        <TradeTypeIcon type={trade_type.sides[0].value} size='xs' />
                        <span>{trade_type.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default TradeTypeTabs;
