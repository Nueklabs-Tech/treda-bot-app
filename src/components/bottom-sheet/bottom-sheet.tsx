import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './bottom-sheet.scss';

type TBottomSheetProps = {
    is_open: boolean;
    onClose: () => void;
    /** Rendered as the sheet's heading. Also names the dialog when it is a string. */
    title?: ReactNode;
    /** Accessible name, for when `title` is markup or the sheet has no visible heading. */
    aria_label?: string;
    /** Extra class on the root, for callers that need to scope their own styles. */
    className?: string;
    /** Pinned below the scrolling body — actions that must stay reachable. */
    footer?: ReactNode;
    children: ReactNode;
};

/**
 * How many sheets currently hold the scroll lock. Sheets stay mounted while closed
 * and can be nested, so the lock is refcounted — the first one to open takes it and
 * the last one to close restores what the page had.
 */
let lock_count = 0;
let previous_overflow = '';

const lockBodyScroll = () => {
    if (lock_count === 0) {
        previous_overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
    }
    lock_count += 1;
};

const unlockBodyScroll = () => {
    lock_count = Math.max(0, lock_count - 1);
    if (lock_count === 0) document.body.style.overflow = previous_overflow;
};

/**
 * App-wide bottom sheet: a modal panel that slides up from the bottom edge, which is
 * the pattern handsets expect for short choices and quick actions. On desktop it
 * keeps the same anchoring but constrains to a panel in the corner.
 *
 * Owns the modal mechanics every caller would otherwise reimplement — portal,
 * backdrop, Escape, scroll lock, focus handling — so a caller only supplies a title
 * and the body.
 *
 * ```tsx
 * <BottomSheet is_open={is_open} onClose={close} title={localize('Select account')}>
 *     …rows…
 * </BottomSheet>
 * ```
 */
const BottomSheet = ({ is_open, onClose, title, aria_label, className, footer, children }: TBottomSheetProps) => {
    const panel_ref = useRef<HTMLDivElement>(null);
    const previously_focused = useRef<HTMLElement | null>(null);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (!is_open) return;

        // Remember where focus came from so closing can hand it back, then move
        // focus into the sheet — otherwise it stays behind on the trigger, under
        // the backdrop.
        previously_focused.current = document.activeElement as HTMLElement;
        panel_ref.current?.focus();

        document.addEventListener('keydown', handleKeyDown);
        lockBodyScroll();

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            unlockBodyScroll();
            previously_focused.current?.focus?.();
        };
    }, [is_open, handleKeyDown]);

    return createPortal(
        <div className={clsx('bottom-sheet', className, { 'bottom-sheet--open': is_open })} aria-hidden={!is_open}>
            <div className='bottom-sheet__backdrop' onClick={onClose} />
            <div
                ref={panel_ref}
                className='bottom-sheet__panel'
                role='dialog'
                aria-modal='true'
                aria-label={aria_label ?? (typeof title === 'string' ? title : undefined)}
                tabIndex={-1}
            >
                <div className='bottom-sheet__grabber' aria-hidden='true' />
                <header className='bottom-sheet__header'>
                    <h2 className='bottom-sheet__title'>{title}</h2>
                    <button
                        type='button'
                        className='bottom-sheet__close'
                        onClick={onClose}
                        aria-label={localize('Close')}
                    >
                        <svg width='18' height='18' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                            <path
                                d='M6 6l12 12M18 6 6 18'
                                stroke='currentColor'
                                strokeWidth='1.8'
                                strokeLinecap='round'
                            />
                        </svg>
                    </button>
                </header>

                <div className='bottom-sheet__body'>{children}</div>

                {footer && <div className='bottom-sheet__footer'>{footer}</div>}
            </div>
        </div>,
        document.body
    );
};

export default BottomSheet;
