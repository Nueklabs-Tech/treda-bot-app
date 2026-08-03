import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { getCurrencyDisplayCode } from '@/components/shared';
import { STAKE_LIMITS } from '@/constants/trade';
import { Localize, localize } from '@deriv-com/translations';

type TStakeSheetProps = {
    is_open: boolean;
    onClose: () => void;
    stake: string;
    currency: string;
    onChange: (stake: string) => void;
};

const QUICK_STAKES = [1, 5, 10, 25, 50, 100];

/**
 * Stake picker. The value is held as a string so a half-typed amount ("2.",
 * "0.") survives editing; the panel is what converts it to a number for pricing,
 * and an unparseable value simply means no proposal is requested.
 */
const StakeSheet = ({ is_open, onClose, stake, currency, onChange }: TStakeSheetProps) => {
    const amount = Number(stake);
    const is_below_min = !Number.isNaN(amount) && stake !== '' && amount < STAKE_LIMITS.min;
    const is_above_max = amount > STAKE_LIMITS.max;

    return (
        <BottomSheet is_open={is_open} onClose={onClose} title={localize('Stake')} className='param-sheet'>
            <div className='param-sheet__amount'>
                <input
                    type='text'
                    className='param-sheet__input param-sheet__input--amount'
                    inputMode='decimal'
                    value={stake}
                    aria-label={localize('Stake')}
                    onChange={event => {
                        const next = event.target.value.replace(',', '.');

                        // Digits and at most one decimal point; anything else is a
                        // keystroke the field silently ignores.
                        if (next !== '' && !/^\d*\.?\d*$/.test(next)) return;

                        onChange(next);
                    }}
                />
                <span className='param-sheet__currency'>{getCurrencyDisplayCode(currency)}</span>
            </div>

            {(is_below_min || is_above_max) && (
                <p className='param-sheet__hint param-sheet__hint--error'>
                    <Localize
                        i18n_default_text='Stake must be between {{min}} and {{max}} {{currency}}.'
                        values={{
                            min: STAKE_LIMITS.min,
                            max: STAKE_LIMITS.max,
                            currency: getCurrencyDisplayCode(currency),
                        }}
                    />
                </p>
            )}

            <div className='param-sheet__quick'>
                {QUICK_STAKES.map(value => (
                    <button
                        key={value}
                        type='button'
                        className={clsx('param-sheet__quick-item', {
                            'param-sheet__quick-item--active': String(value) === stake,
                        })}
                        onClick={() => onChange(String(value))}
                    >
                        {value}
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
};

export default StakeSheet;
