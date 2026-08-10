import { act, renderHook, waitFor } from '@testing-library/react';
import { usePositions } from '../usePositions';

const mockShowTradeResultToast = jest.fn();
const mockSend = jest.fn();
const mockGetActiveSymbols = jest.fn();
let capturedOnData: ((payload: unknown) => void) | null = null;
const mockUnsubscribe = jest.fn();

jest.mock('@/components/trade/trade-result-toast', () => ({
    showTradeResultToast: (...args: unknown[]) => mockShowTradeResultToast(...args),
}));

jest.mock('@/hooks/useApiBase', () => ({
    useApiBase: () => ({ isAuthorized: true }),
}));

jest.mock('@/external/bot-skeleton', () => ({
    api_base: {
        get api() {
            return { send: mockSend };
        },
        getActiveSymbols: (...args: unknown[]) => mockGetActiveSymbols(...args),
    },
}));

jest.mock('@/utils/api-subscription', () => ({
    subscribeToStream: ({ onData }: { onData: (payload: unknown) => void }) => {
        capturedOnData = onData;
        return mockUnsubscribe;
    },
}));

const openContract = {
    contract_id: 1,
    underlying: '1HZ100V',
    display_name: 'Volatility 100 (1s) Index',
    contract_type: 'CALL',
    buy_price: 2,
    payout: 3.85,
    profit: -1.94,
    currency: 'USD',
    date_start: 1000,
    date_expiry: 2000,
    is_sold: 0,
};

const profitTableRow = {
    contract_id: 99,
    underlying_symbol: '1HZ10V',
    contract_type: 'CALL',
    buy_price: 10,
    payout: 19.19,
    sell_price: 19.19,
    purchase_time: 500,
    sell_time: 600,
};

describe('usePositions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnData = null;
        mockGetActiveSymbols.mockResolvedValue([]);
        mockSend.mockImplementation((request: Record<string, unknown>) => {
            if (request.portfolio) return Promise.resolve({ portfolio: { contracts: [openContract] } });
            if (request.profit_table) return Promise.resolve({ profit_table: { transactions: [profitTableRow] } });
            return Promise.resolve({});
        });
    });

    it('seeds open positions from portfolio and closed positions from profit_table', async () => {
        const { result } = renderHook(() => usePositions('USD'));

        await waitFor(() => expect(result.current.is_loading).toBe(false));

        expect(result.current.open_positions).toHaveLength(1);
        expect(result.current.open_positions[0]).toMatchObject({ contract_id: 1, side_label: 'Rise' });

        expect(result.current.closed_positions).toHaveLength(1);
        expect(result.current.closed_positions[0]).toMatchObject({ contract_id: 99 });
        expect(result.current.closed_positions[0].profit).toBeCloseTo(9.19);
    });

    it('moves a contract from open to closed and fires the settlement toast once when it settles', async () => {
        const { result } = renderHook(() => usePositions('USD'));

        await waitFor(() => expect(result.current.is_loading).toBe(false));
        expect(result.current.open_positions).toHaveLength(1);

        act(() => {
            capturedOnData?.({ ...openContract, is_sold: 1, profit: -1.94 });
        });

        await waitFor(() => expect(result.current.open_positions).toHaveLength(0));
        expect(result.current.closed_positions.some(position => position.contract_id === 1)).toBe(true);
        expect(mockShowTradeResultToast).toHaveBeenCalledTimes(1);
        expect(mockShowTradeResultToast).toHaveBeenCalledWith(
            expect.objectContaining({ profit: -1.94, side_label: 'Rise' })
        );

        // A duplicate settlement push (the stream can repeat the final message)
        // must not fire a second toast.
        act(() => {
            capturedOnData?.({ ...openContract, is_sold: 1, profit: -1.94 });
        });

        expect(mockShowTradeResultToast).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', async () => {
        const { result, unmount } = renderHook(() => usePositions('USD'));

        await waitFor(() => expect(result.current.is_loading).toBe(false));

        unmount();

        expect(mockUnsubscribe).toHaveBeenCalled();
    });
});
