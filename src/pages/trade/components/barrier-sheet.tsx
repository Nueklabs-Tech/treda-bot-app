import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { Localize, localize } from '@deriv-com/translations';

type TBarrierSheetProps = {
    is_open: boolean;
    onClose: () => void;
    /** `digit` picks a last digit, `offset` picks a distance from the spot. */
    kind: 'digit' | 'offset';
    barrier: string;
    onChange: (barrier: string) => void;
};

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** `+0.10` / `-0.10` — the API takes the sign as part of the barrier string. */
const parseOffset = (barrier: string) => {
    const sign = barrier.trim().startsWith('-') ? '-' : '+';
    const magnitude = Math.abs(Number(barrier.replace(/[+-]/, ''))) || 0;

    return { sign, magnitude };
};

const formatOffset = (sign: string, magnitude: number) => `${sign}${magnitude.toFixed(2)}`;

/**
 * Barrier picker, in the two shapes the supported contracts need: the last-digit
 * grid for digit trades, and a signed offset from the current spot for
 * higher/lower.
 */
const BarrierSheet = ({ is_open, onClose, kind, barrier, onChange }: TBarrierSheetProps) => {
    const { sign, magnitude } = parseOffset(barrier);

    return (
        <BottomSheet
            is_open={is_open}
            onClose={onClose}
            title={kind === 'digit' ? localize('Last digit') : localize('Barrier')}
            className='param-sheet'
        >
            {kind === 'digit' ? (
                <>
                    <div className='param-sheet__digits'>
                        {DIGITS.map(digit => (
                            <button
                                key={digit}
                                type='button'
                                className={clsx('param-sheet__digit', {
                                    'param-sheet__digit--active': digit === barrier,
                                })}
                                onClick={() => onChange(digit)}
                            >
                                {digit}
                            </button>
                        ))}
                    </div>
                    <p className='param-sheet__hint'>
                        <Localize i18n_default_text='The contract settles on the last digit of the exit spot.' />
                    </p>
                </>
            ) : (
                <>
                    <div className='param-sheet__units'>
                        <button
                            type='button'
                            className={clsx('param-sheet__unit', { 'param-sheet__unit--active': sign === '+' })}
                            onClick={() => onChange(formatOffset('+', magnitude))}
                        >
                            <Localize i18n_default_text='Above spot' />
                        </button>
                        <button
                            type='button'
                            className={clsx('param-sheet__unit', { 'param-sheet__unit--active': sign === '-' })}
                            onClick={() => onChange(formatOffset('-', magnitude))}
                        >
                            <Localize i18n_default_text='Below spot' />
                        </button>
                    </div>

                    <div className='param-sheet__stepper'>
                        <button
                            type='button'
                            className='param-sheet__step'
                            onClick={() => onChange(formatOffset(sign, Math.max(0.01, magnitude - 0.05)))}
                            aria-label={localize('Decrease barrier')}
                        >
                            −
                        </button>
                        <input
                            type='text'
                            className='param-sheet__input'
                            inputMode='decimal'
                            value={magnitude.toFixed(2)}
                            aria-label={localize('Barrier offset')}
                            onChange={event => {
                                const next = Number(event.target.value.replace(',', '.'));

                                if (Number.isNaN(next)) return;

                                onChange(formatOffset(sign, Math.abs(next)));
                            }}
                        />
                        <button
                            type='button'
                            className='param-sheet__step'
                            onClick={() => onChange(formatOffset(sign, magnitude + 0.05))}
                            aria-label={localize('Increase barrier')}
                        >
                            +
                        </button>
                    </div>

                    <p className='param-sheet__hint'>
                        <Localize i18n_default_text='Distance from the current spot price at the start of the contract.' />
                    </p>
                </>
            )}
        </BottomSheet>
    );
};

export default BarrierSheet;
