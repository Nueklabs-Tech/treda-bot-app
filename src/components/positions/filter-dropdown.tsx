import { useState } from 'react';
import clsx from 'clsx';
import BottomSheet from '@/components/bottom-sheet';
import { Icon } from '@/components/page-shell/icons';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './filter-dropdown.scss';

export type TFilterOption = {
    value: string;
    label: string;
};

type TFilterDropdownProps = {
    label: string;
    options: TFilterOption[];
    value: string;
    onChange: (value: string) => void;
};

/**
 * The pill-shaped filter trigger used above both the Open and Closed lists
 * ("Trade types", "All time", "Trade modes") — a single-select bottom sheet
 * behind a button, so the three filters share one implementation.
 */
const FilterDropdown = ({ label, options, value, onChange }: TFilterDropdownProps) => {
    const [is_open, setIsOpen] = useState(false);
    const active_option = options.find(option => option.value === value);

    return (
        <>
            <button
                type='button'
                className='positions-filter'
                onClick={() => setIsOpen(true)}
                aria-haspopup='dialog'
                aria-expanded={is_open}
            >
                <span className='positions-filter__label'>{active_option?.label ?? label}</span>
                <Icon name='chevron' size={14} className='positions-filter__chevron' />
            </button>

            <BottomSheet is_open={is_open} onClose={() => setIsOpen(false)} title={label} className='positions-filter-sheet'>
                <ul className='positions-filter-sheet__list'>
                    {options.map(option => (
                        <li key={option.value}>
                            <button
                                type='button'
                                className={clsx('positions-filter-sheet__option', {
                                    'positions-filter-sheet__option--active': option.value === value,
                                })}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                {option.label}
                                {option.value === value && <Icon name='check' size={18} />}
                            </button>
                        </li>
                    ))}
                </ul>
            </BottomSheet>
        </>
    );
};

export default FilterDropdown;
