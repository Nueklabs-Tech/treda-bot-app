import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { TradeTypeIcon } from '@/components/trade-type/trade-type-icon';
import { TRADE_TYPES } from '@/constants/trade';
import { localize } from '@deriv-com/translations';

type TTradeTypeSheetProps = {
    is_open: boolean;
    onClose: () => void;
    value: string;
    onSelect: (trade_type: string) => void;
};

/**
 * Trade type picker, opened from the "Rise/Fall ⌄" line of the market card —
 * the same place dtrader's mobile screen puts it. Each row carries the one-line
 * question the contract answers, so the choice can be made without a tutorial.
 */
const TradeTypeSheet = ({ is_open, onClose, value, onSelect }: TTradeTypeSheetProps) => (
    <BottomSheet is_open={is_open} onClose={onClose} title={localize('Trade types')} className='trade-type-sheet'>
        <ul className='trade-type-sheet__list'>
            {TRADE_TYPES.map(trade_type => {
                const is_active = trade_type.value === value;

                return (
                    <li key={trade_type.value}>
                        <button
                            type='button'
                            className={clsx('trade-type-sheet__row', { 'trade-type-sheet__row--active': is_active })}
                            aria-pressed={is_active}
                            onClick={() => {
                                onSelect(trade_type.value);
                                onClose();
                            }}
                        >
                            <span className='trade-type-sheet__icon' aria-hidden='true'>
                                <TradeTypeIcon type={trade_type.sides[0].value} size='sm' />
                            </span>
                            <span className='trade-type-sheet__text'>
                                <span className='trade-type-sheet__label'>{trade_type.label}</span>
                                <span className='trade-type-sheet__description'>{trade_type.description}</span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    </BottomSheet>
);

export default TradeTypeSheet;
