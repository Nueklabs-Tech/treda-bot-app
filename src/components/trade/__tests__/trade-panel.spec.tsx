import { fireEvent, render, screen } from '@testing-library/react';
import { getTradeTypeConfig } from '@/constants/trade';
import TradePanel from '../trade-panel';

const config = getTradeTypeConfig('rise_fall');

const proposal = {
    id: 'proposal-id',
    ask_price: 2,
    payout: 3.85,
    display_value: '2.00',
};

const buildProps = (overrides = {}) => ({
    config,
    contract_type: 'CALL',
    onContractTypeChange: jest.fn(),
    duration: { value: 5, unit: 't' as const },
    onDurationChange: jest.fn(),
    stake: '2',
    onStakeChange: jest.fn(),
    barrier: '',
    onBarrierChange: jest.fn(),
    currency: 'USD',
    proposal_state: { proposal, error: null, is_loading: false },
    is_pricing_enabled: true,
    is_authorized: true,
    is_market_open: true,
    is_buying: false,
    buy_error: null,
    is_expanded: true,
    onToggleExpanded: jest.fn(),
    onBuy: jest.fn(),
    onLogin: jest.fn(),
    ...overrides,
});

describe('TradePanel', () => {
    it('quotes the payout on the buy button', () => {
        render(<TradePanel {...buildProps()} />);

        expect(screen.getByText('Payout 3.85 USD')).toBeInTheDocument();
        expect(screen.getByText('5 ticks')).toBeInTheDocument();
        expect(screen.getByText('2 USD')).toBeInTheDocument();
    });

    it('buys the priced contract', () => {
        const onBuy = jest.fn();
        render(<TradePanel {...buildProps({ onBuy })} />);

        fireEvent.click(screen.getByRole('button', { name: /Payout 3.85 USD/ }));

        expect(onBuy).toHaveBeenCalled();
    });

    it('switches the contract direction', () => {
        const onContractTypeChange = jest.fn();
        render(<TradePanel {...buildProps({ onContractTypeChange })} />);

        fireEvent.click(screen.getByRole('button', { name: 'Fall' }));

        expect(onContractTypeChange).toHaveBeenCalledWith('PUT');
    });

    it('will not buy while there is no price', () => {
        render(<TradePanel {...buildProps({ proposal_state: { proposal: null, error: null, is_loading: true } })} />);

        expect(screen.getByText('Getting price…').closest('button')).toBeDisabled();
    });

    it('surfaces the reason a proposal was rejected', () => {
        render(
            <TradePanel
                {...buildProps({
                    proposal_state: {
                        proposal: null,
                        error: { message: 'Minimum stake is 0.35 USD.' },
                        is_loading: false,
                    },
                })}
            />
        );

        expect(screen.getByText('Minimum stake is 0.35 USD.')).toBeInTheDocument();
    });

    it('asks a signed-out visitor to log in instead of buying', () => {
        const onLogin = jest.fn();
        render(<TradePanel {...buildProps({ is_authorized: false, onLogin })} />);

        fireEvent.click(screen.getByRole('button', { name: 'Log in to trade' }));

        expect(onLogin).toHaveBeenCalled();
    });
});
