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
    allow_equals: false,
    onAllowEqualsChange: jest.fn(),
    currency: 'USD',
    proposal_state: { proposal, error: null, is_loading: false },
    is_pricing_enabled: true,
    is_authorized: true,
    is_market_open: true,
    is_buying: false,
    buy_error: null,
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

    it('toggles allow equals for a trade type that supports it', () => {
        const onAllowEqualsChange = jest.fn();
        render(<TradePanel {...buildProps({ onAllowEqualsChange })} />);

        fireEvent.click(screen.getByRole('button', { name: /Allow equals/ }));
        fireEvent.click(screen.getByLabelText('toggle_switch'));

        expect(onAllowEqualsChange).toHaveBeenCalledWith(true);
    });

    it('hides allow equals for a trade type without an equals variant', () => {
        render(<TradePanel {...buildProps({ config: getTradeTypeConfig('even_odd') })} />);

        expect(screen.queryByText('Allow equals')).not.toBeInTheDocument();
    });

    it('shows each parameter as a card in one row', () => {
        render(<TradePanel {...buildProps()} />);

        expect(screen.getByRole('button', { name: /Duration/ })).toHaveTextContent('5 ticks');
        expect(screen.getByRole('button', { name: /Stake/ })).toHaveTextContent('2 USD');
        expect(screen.getByRole('button', { name: /Allow equals/ })).toHaveTextContent('-');
    });

    it('quotes a signed-out visitor and sends the buy press to the login', () => {
        const onBuy = jest.fn();
        const onLogin = jest.fn();
        render(<TradePanel {...buildProps({ is_authorized: false, onBuy, onLogin })} />);

        fireEvent.click(screen.getByRole('button', { name: /Payout 3.85 USD/ }));

        expect(onLogin).toHaveBeenCalled();
        expect(onBuy).not.toHaveBeenCalled();
    });

    it('lets a signed-out visitor log in even before there is a price', () => {
        const onLogin = jest.fn();
        render(
            <TradePanel
                {...buildProps({
                    is_authorized: false,
                    onLogin,
                    proposal_state: { proposal: null, error: null, is_loading: true },
                })}
            />
        );

        const button = screen.getByText('Getting price…').closest('button') as HTMLButtonElement;
        expect(button).toBeEnabled();
        fireEvent.click(button);

        expect(onLogin).toHaveBeenCalled();
    });
});
