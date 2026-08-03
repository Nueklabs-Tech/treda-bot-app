import { fireEvent, render, screen } from '@testing-library/react';
import Positions from '../positions';

const mockNavigate = jest.fn();
const mockOnMount = jest.fn();
const mockOnUnmount = jest.fn();
const mockOnClearStatClick = jest.fn();
const mockSetActiveTabIndex = jest.fn();

const statistics = {
    total_stake: 30,
    total_payout: 42,
    total_profit: 12,
    won_contracts: 2,
    lost_contracts: 1,
    number_of_runs: 3,
};

const buildStore = (overrides = {}) => ({
    client: { currency: 'USD' },
    run_panel: {
        active_index: 0,
        is_clear_stat_disabled: false,
        is_running: false,
        onClearStatClick: mockOnClearStatClick,
        onMount: mockOnMount,
        onUnmount: mockOnUnmount,
        setActiveTabIndex: mockSetActiveTabIndex,
        ...overrides,
    },
    transactions: {
        statistics,
        transactions: [{ type: 'contract' }, { type: 'contract' }, { type: 'contract' }],
    },
});

const mockUseStore = jest.fn(() => buildStore());

jest.mock('@/hooks/useStore', () => ({
    useStore: () => mockUseStore(),
}));

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// The tabs pull in the whole vendored run-panel tree (virtualised lists, the
// chart adapter); this page's own behaviour is what is under test.
jest.mock('@/components/run-panel/run-panel-tabs', () => ({
    __esModule: true,
    default: () => <div data-testid='run-panel-tabs' />,
}));

jest.mock('@/components/shared_ui/money', () => ({
    __esModule: true,
    default: ({ amount, currency }: { amount: number; currency: string }) => (
        <span>{`${amount} ${currency}`}</span>
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

describe('Positions page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseStore.mockReturnValue(buildStore());
    });

    it('shows the session statistics from the transactions store', () => {
        render(<Positions />);

        expect(screen.getByText('Total stake')).toBeInTheDocument();
        expect(screen.getByText('30 USD')).toBeInTheDocument();
        expect(screen.getByText('42 USD')).toBeInTheDocument();
        expect(screen.getByText('12 USD')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders the run-panel tabs in the page', () => {
        render(<Positions />);

        expect(screen.getByTestId('run-panel-tabs')).toBeInTheDocument();
    });

    it('keeps the run-panel listeners registered for as long as it is on screen', () => {
        const { unmount } = render(<Positions />);

        expect(mockOnMount).toHaveBeenCalledTimes(1);
        expect(mockOnUnmount).not.toHaveBeenCalled();

        unmount();

        expect(mockOnUnmount).toHaveBeenCalledTimes(1);
    });

    it('resets the stats through the run-panel store', () => {
        render(<Positions />);

        fireEvent.click(screen.getByRole('button', { name: /Reset stats/ }));

        expect(mockOnClearStatClick).toHaveBeenCalled();
    });

    it('disables the reset action when there is nothing to clear', () => {
        mockUseStore.mockReturnValue(buildStore({ is_clear_stat_disabled: true }));

        render(<Positions />);

        expect(screen.getByRole('button', { name: /Reset stats/ })).toBeDisabled();
    });

    it('flags a running bot', () => {
        mockUseStore.mockReturnValue(buildStore({ is_running: true }));

        render(<Positions />);

        expect(screen.getByText('Bot running')).toBeInTheDocument();
    });
});
