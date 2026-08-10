import { fireEvent, render, screen, within } from '@testing-library/react';
import PositionsMobile from '../positions-mobile';

const mockUsePositions = jest.fn();

jest.mock('@/hooks/usePositions', () => ({
    usePositions: (...args: unknown[]) => mockUsePositions(...args),
}));

jest.mock('@/hooks/useStore', () => ({
    useStore: () => ({ client: { currency: 'USD' } }),
}));

jest.mock('@/components/market/market-icon', () => ({
    MarketIcon: () => <span data-testid='market-icon' />,
}));

jest.mock('@/components/positions/contract-details', () => ({
    __esModule: true,
    default: ({ contract_id, onBack }: { contract_id: number; onBack: () => void }) => (
        <div>
            <p>{`Contract details for ${contract_id}`}</p>
            <button type='button' onClick={onBack}>
                Back
            </button>
        </div>
    ),
}));

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text, values }: { i18n_default_text: string; values?: Record<string, unknown> }) => (
        <span>
            {Object.entries(values ?? {}).reduce(
                (text, [key, value]) => text.replace(`{{${key}}}`, String(value)),
                i18n_default_text
            )}
        </span>
    ),
    localize: (text: string) => text,
}));

const open_positions = [
    {
        contract_id: 1,
        symbol: '1HZ10V',
        display_name: 'Volatility 10 (1s) Index',
        contract_type: 'CALL',
        side_label: 'Rise',
        buy_price: 10,
        payout: 19.19,
        profit: -2.52,
        currency: 'USD',
        date_start: 1000,
        date_expiry: undefined,
        sell_time: null,
        is_sold: false,
    },
    {
        contract_id: 2,
        symbol: '1HZ100V',
        display_name: 'Volatility 100 (1s) Index',
        contract_type: 'PUT',
        side_label: 'Fall',
        buy_price: 2,
        payout: 3.85,
        profit: -1.94,
        currency: 'USD',
        date_start: 900,
        date_expiry: undefined,
        sell_time: null,
        is_sold: false,
    },
];

const closed_positions = [
    {
        contract_id: 99,
        symbol: '1HZ10V',
        display_name: 'Volatility 10 (1s) Index',
        contract_type: 'CALL',
        side_label: 'Rise',
        buy_price: 10,
        payout: 0,
        profit: -10,
        currency: 'USD',
        date_start: 500,
        sell_time: 600,
        is_sold: true,
    },
];

describe('PositionsMobile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUsePositions.mockReturnValue({ open_positions, closed_positions, is_loading: false });
    });

    it('shows the open positions and their combined total profit/loss by default', () => {
        render(<PositionsMobile />);

        expect(screen.getByText('Volatility 10 (1s) Index')).toBeInTheDocument();
        expect(screen.getByText('Volatility 100 (1s) Index')).toBeInTheDocument();
        expect(screen.getByText('Total profit/loss:')).toBeInTheDocument();
        // -2.52 + -1.94 = -4.46
        expect(screen.getByText(/4\.46/)).toBeInTheDocument();
    });

    it('switches to the Closed tab and groups positions by settlement date', () => {
        render(<PositionsMobile />);

        fireEvent.click(screen.getByRole('tab', { name: 'Closed' }));

        expect(screen.queryByText('Total profit/loss:')).not.toBeInTheDocument();
        expect(screen.getAllByText('Closed').length).toBeGreaterThan(0);
    });

    it('shows an empty state when there are no open positions', () => {
        mockUsePositions.mockReturnValue({ open_positions: [], closed_positions: [], is_loading: false });

        render(<PositionsMobile />);

        expect(screen.getByText('No open positions.')).toBeInTheDocument();
    });

    it('filters the open list by trade type', () => {
        render(<PositionsMobile />);

        fireEvent.click(screen.getByRole('button', { name: 'All trade types' }));
        const sheet = screen.getByRole('dialog');
        fireEvent.click(within(sheet).getByText('Fall'));

        expect(screen.queryByText('Volatility 10 (1s) Index')).not.toBeInTheDocument();
        expect(screen.getByText('Volatility 100 (1s) Index')).toBeInTheDocument();
    });

    it('opens contract details when a position card is tapped, and returns to the list on back', () => {
        render(<PositionsMobile />);

        fireEvent.click(screen.getByRole('button', { name: 'Volatility 10 (1s) Index' }));

        expect(screen.getByText('Contract details for 1')).toBeInTheDocument();
        expect(screen.queryByText('Total profit/loss:')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));

        expect(screen.getByText('Total profit/loss:')).toBeInTheDocument();
    });
});
