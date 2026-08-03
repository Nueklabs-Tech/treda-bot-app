import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { TDurationRange, TDurationUnit } from '@/constants/trade';
import { Localize, localize } from '@deriv-com/translations';

export type TDuration = {
    value: number;
    unit: TDurationUnit;
};

type TDurationSheetProps = {
    is_open: boolean;
    onClose: () => void;
    /** The units this trade type allows, with their bounds. */
    durations: TDurationRange[];
    duration: TDuration;
    onChange: (duration: TDuration) => void;
};

/** A handful of jump-to values inside the range, so most picks are one tap. */
const getQuickPicks = (range: TDurationRange): number[] => {
    const candidates = [range.min, range.default, Math.round(range.max / 4), Math.round(range.max / 2), range.max];

    return [...new Set(candidates)].filter(value => value >= range.min && value <= range.max).sort((a, b) => a - b);
};

/**
 * Duration picker. Changes apply as they are made rather than on a save button:
 * the payout behind the sheet re-prices immediately, which is the feedback that
 * tells the user whether the duration they picked is worth taking.
 */
const DurationSheet = ({ is_open, onClose, durations, duration, onChange }: TDurationSheetProps) => {
    const range = durations.find(item => item.unit === duration.unit) ?? durations[0];
    const clamp = (value: number) => Math.min(range.max, Math.max(range.min, value));

    return (
        <BottomSheet is_open={is_open} onClose={onClose} title={localize('Duration')} className='param-sheet'>
            {durations.length > 1 && (
                <div className='param-sheet__units'>
                    {durations.map(item => (
                        <button
                            key={item.unit}
                            type='button'
                            className={clsx('param-sheet__unit', {
                                'param-sheet__unit--active': item.unit === range.unit,
                            })}
                            onClick={() => onChange({ unit: item.unit, value: item.default })}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}

            <div className='param-sheet__stepper'>
                <button
                    type='button'
                    className='param-sheet__step'
                    onClick={() => onChange({ ...duration, value: clamp(duration.value - 1) })}
                    disabled={duration.value <= range.min}
                    aria-label={localize('Decrease duration')}
                >
                    −
                </button>
                <input
                    type='number'
                    className='param-sheet__input'
                    inputMode='numeric'
                    value={duration.value}
                    min={range.min}
                    max={range.max}
                    aria-label={localize('Duration')}
                    onChange={event => {
                        const next = Number(event.target.value);

                        if (Number.isNaN(next)) return;

                        onChange({ ...duration, value: next });
                    }}
                    onBlur={() => onChange({ ...duration, value: clamp(duration.value) })}
                />
                <button
                    type='button'
                    className='param-sheet__step'
                    onClick={() => onChange({ ...duration, value: clamp(duration.value + 1) })}
                    disabled={duration.value >= range.max}
                    aria-label={localize('Increase duration')}
                >
                    +
                </button>
            </div>

            <p className='param-sheet__hint'>
                <Localize
                    i18n_default_text='Between {{min}} and {{max}} {{unit}}.'
                    values={{ min: range.min, max: range.max, unit: range.label.toLowerCase() }}
                />
            </p>

            <div className='param-sheet__quick'>
                {getQuickPicks(range).map(value => (
                    <button
                        key={value}
                        type='button'
                        className={clsx('param-sheet__quick-item', {
                            'param-sheet__quick-item--active': value === duration.value,
                        })}
                        onClick={() => onChange({ ...duration, value })}
                    >
                        {value}
                    </button>
                ))}
            </div>
        </BottomSheet>
    );
};

export default DurationSheet;
