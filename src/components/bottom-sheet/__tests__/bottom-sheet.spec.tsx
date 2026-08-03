import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import BottomSheet from '../bottom-sheet';

jest.mock('@deriv-com/translations', () => ({
    localize: (text: string) => text,
}));

const renderSheet = (props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) =>
    render(
        <BottomSheet is_open onClose={jest.fn()} title='Select account' {...props}>
            <p>sheet body</p>
        </BottomSheet>
    );

describe('BottomSheet', () => {
    afterEach(() => {
        document.body.style.overflow = '';
    });

    it('renders the title and body into a portal on the document body', () => {
        renderSheet();

        const dialog = screen.getByRole('dialog', { name: 'Select account' });
        expect(dialog).toBeInTheDocument();
        expect(dialog.closest('body')).toBe(document.body);
        expect(screen.getByText('sheet body')).toBeInTheDocument();
    });

    it('marks the sheet open only while is_open is set', () => {
        const { baseElement, rerender } = renderSheet({ is_open: false });

        expect(baseElement.querySelector('.bottom-sheet--open')).toBeNull();

        rerender(
            <BottomSheet is_open onClose={jest.fn()} title='Select account'>
                <p>sheet body</p>
            </BottomSheet>
        );

        expect(baseElement.querySelector('.bottom-sheet--open')).not.toBeNull();
    });

    it('closes on the backdrop, the close button and Escape', () => {
        const onClose = jest.fn();
        const { baseElement } = renderSheet({ onClose });

        fireEvent.click(baseElement.querySelector('.bottom-sheet__backdrop') as Element);
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('does not close on Escape while shut', () => {
        const onClose = jest.fn();
        renderSheet({ is_open: false, onClose });

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('locks page scroll while open and restores it on close', () => {
        const { unmount } = renderSheet();

        expect(document.body.style.overflow).toBe('hidden');

        unmount();

        expect(document.body.style.overflow).toBe('');
    });

    it('keeps the scroll lock until the last of two stacked sheets closes', () => {
        const { unmount: unmountFirst } = renderSheet();
        const { unmount: unmountSecond } = renderSheet({ title: 'Second' });

        unmountFirst();
        expect(document.body.style.overflow).toBe('hidden');

        unmountSecond();
        expect(document.body.style.overflow).toBe('');
    });

    it('returns focus to the trigger when it closes', () => {
        const Harness = () => {
            const [is_open, setIsOpen] = useState(false);
            return (
                <>
                    <button type='button' onClick={() => setIsOpen(true)}>
                        open
                    </button>
                    <BottomSheet is_open={is_open} onClose={() => setIsOpen(false)} title='Select account'>
                        <p>sheet body</p>
                    </BottomSheet>
                </>
            );
        };

        render(<Harness />);
        const trigger = screen.getByRole('button', { name: 'open' });

        trigger.focus();
        fireEvent.click(trigger);
        expect(screen.getByRole('dialog')).toHaveFocus();

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(trigger).toHaveFocus();
    });

    it('renders a footer only when one is supplied', () => {
        const { baseElement, rerender } = renderSheet();

        expect(baseElement.querySelector('.bottom-sheet__footer')).toBeNull();

        rerender(
            <BottomSheet is_open onClose={jest.fn()} title='Select account' footer={<button>Confirm</button>}>
                <p>sheet body</p>
            </BottomSheet>
        );

        expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
});
