import { fireEvent, render, screen } from '@testing-library/react';
import TradeTypeSheet from '../trade-type-sheet';

describe('TradeTypeSheet', () => {
    it('marks the current trade type and selects another', () => {
        const onSelect = jest.fn();
        const onClose = jest.fn();
        render(<TradeTypeSheet is_open onClose={onClose} value='rise_fall' onSelect={onSelect} />);

        expect(screen.getByRole('button', { name: /Rise\/Fall/ })).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(screen.getByRole('button', { name: /Even\/Odd/ }));

        expect(onSelect).toHaveBeenCalledWith('even_odd');
        expect(onClose).toHaveBeenCalled();
    });
});
