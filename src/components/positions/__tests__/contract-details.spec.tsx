import { render, screen } from '@testing-library/react';
import ContractDetails from '../contract-details';

const mockUseOpenContract = jest.fn();
const mockOnBack = jest.fn();

jest.mock('@/hooks/useOpenContract', () => ({
    useOpenContract: (...args: unknown[]) => mockUseOpenContract(...args),
}));

jest.mock('@/components/market/market-icon', () => ({
    MarketIcon: () => <span data-testid='market-icon' />,
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
    localize: (text: string, values?: Record<string, unknown>) =>
        Object.entries(values ?? {}).reduce((result, [key, value]) => result.replace(`{{${key}}}`, String(value)), text),
}));

const settled_contract = {
    contract_id: 1,
    contract_type: 'CALL',
    display_name: 'Volatility 10 (1s) Index',
    underlying: '1HZ10V',
    buy_price: 10,
    payout: 19.19,
    profit: -10,
    currency: 'USD',
    is_sold: 1,
    barrier: '9475.30',
    // 2026-08-09 23:56:40 UTC onward, so the formatted dates/times below are stable.
    date_start: 1786319800,
    date_expiry: 1786319805,
    sell_time: 1786319806,
    tick_count: 5,
    entry_spot: 9475.19,
    entry_spot_display_value: '9,475.19',
    entry_tick_time: 1786319801,
    exit_tick: 9474.95,
    exit_tick_display_value: '9,474.95',
    exit_tick_time: 1786319805,
    transaction_ids: { buy: 16630461099, sell: 16630472979 },
    audit_details: {
        all_ticks: [
            { epoch: 1786319799, tick: 9475.4 },
            { epoch: 1786319800, tick: 9475.3 },
            { epoch: 1786319801, tick: 9475.19 },
            { epoch: 1786319803, tick: 9475.0 },
            { epoch: 1786319805, tick: 9474.95 },
        ],
    },
};

describe('ContractDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows a skeleton loader while the contract has not arrived yet', () => {
        mockUseOpenContract.mockReturnValue({ contract: null });

        render(<ContractDetails contract_id={1} onBack={mockOnBack} />);

        expect(screen.getByText('Contract details')).toBeInTheDocument();
        expect(screen.getByRole('status', { busy: true })).toBeInTheDocument();
        expect(screen.getByText('Loading contract…')).toBeInTheDocument();
    });

    it('renders the summary, order details and entry/exit details for a settled contract', () => {
        mockUseOpenContract.mockReturnValue({ contract: settled_contract });

        render(<ContractDetails contract_id={1} onBack={mockOnBack} />);

        expect(screen.getByText('Volatility 10 (1s) Index')).toBeInTheDocument();
        expect(screen.getByText(/16630461099 \(Buy\)/)).toBeInTheDocument();
        expect(screen.getByText(/16630472979 \(Sell\)/)).toBeInTheDocument();
        expect(screen.getByText('5 Ticks')).toBeInTheDocument();
        expect(screen.getByText('9475.30')).toBeInTheDocument();

        // Entry & exit details: Start time, Entry spot, Exit time, Exit spot, each
        // with the value/date on top and the GMT time as the muted line beneath it.
        expect(screen.getByText('Start time')).toBeInTheDocument();
        expect(screen.getByText('Exit time')).toBeInTheDocument();
        expect(screen.getAllByText('09 Aug 2026')).toHaveLength(4); // start time, entry spot's date, exit time, exit spot's date
        expect(screen.getByText('9,475.19')).toBeInTheDocument();
        expect(screen.getByText('9,474.95')).toBeInTheDocument();
        expect(screen.getByText('23:56:40 GMT')).toBeInTheDocument(); // date_start
        expect(screen.getByText('23:56:41 GMT')).toBeInTheDocument(); // entry_tick_time
        expect(screen.getAllByText('23:56:45 GMT')).toHaveLength(2); // exit_tick_time: exit time row + exit spot meta
    });

    it('calls onBack when the back button is pressed', () => {
        mockUseOpenContract.mockReturnValue({ contract: settled_contract });

        render(<ContractDetails contract_id={1} onBack={mockOnBack} />);

        screen.getByRole('button', { name: 'Back' }).click();

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
});
