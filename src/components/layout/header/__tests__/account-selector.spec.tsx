import { fireEvent, render, screen, within } from '@testing-library/react';
import AccountSelector from '../account-selector/account-selector';

const mockCheckAndRegenerateWebSocket = jest.fn();

const mockAccountList = [
    { loginid: 'CR123', currency: 'USD', balance: 100, is_virtual: 0 },
    { loginid: 'VRTC456', currency: 'USD', balance: 9992.15, is_virtual: 1 },
];

const mockUseApiBase = jest.fn(() => ({
    accountList: mockAccountList,
    activeLoginid: 'CR123',
}));

const mockUseStore = jest.fn(() => ({
    client: { checkAndRegenerateWebSocket: mockCheckAndRegenerateWebSocket },
    run_panel: { is_running: false },
}));

jest.mock('@/hooks/useApiBase', () => ({
    useApiBase: () => mockUseApiBase(),
}));

jest.mock('@/hooks/useStore', () => ({
    useStore: () => mockUseStore(),
}));

jest.mock('@/external/bot-skeleton/services/api/api-base', () => ({
    api_base: { is_running: false },
}));

jest.mock('@deriv-com/translations', () => ({
    Localize: ({ i18n_default_text }: { i18n_default_text: string }) => <span>{i18n_default_text}</span>,
    localize: (text: string) => text,
}));

jest.mock('@/components/shared', () => ({
    addComma: (val: string) => val,
    getCurrencyDisplayCode: (c: string) => c,
    getDecimalPlaces: () => 2,
}));

jest.mock('@/utils/account-helpers', () => ({
    isDemoAccount: (loginid: string) => loginid.startsWith('VR'),
}));

const openSheet = () => fireEvent.click(screen.getByRole('button', { name: /Real account/ }));

describe('AccountSelector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        mockUseApiBase.mockReturnValue({ accountList: mockAccountList, activeLoginid: 'CR123' });
        mockUseStore.mockReturnValue({
            client: { checkAndRegenerateWebSocket: mockCheckAndRegenerateWebSocket },
            run_panel: { is_running: false },
        });
    });

    it('shows the active account type and balance', () => {
        render(<AccountSelector />);

        // Scoped to the chip: the sheet stays mounted (it animates in), so the
        // active account's balance also appears in its row.
        const trigger = screen.getByRole('button', { name: /Real account/ });
        expect(within(trigger).getByText('100.00 USD')).toBeInTheDocument();
    });

    it('renders nothing when no account is active', () => {
        mockUseApiBase.mockReturnValue({ accountList: mockAccountList, activeLoginid: '' });

        const { container } = render(<AccountSelector />);

        expect(container).toBeEmptyDOMElement();
    });

    it('keeps the sheet closed until the chip is clicked', () => {
        const { baseElement } = render(<AccountSelector />);

        expect(baseElement.querySelector('.bottom-sheet--open')).toBeNull();

        openSheet();

        expect(baseElement.querySelector('.bottom-sheet--open')).not.toBeNull();
    });

    it('lists the real and demo accounts in the sheet', () => {
        render(<AccountSelector />);
        openSheet();

        expect(screen.getByText('CR123')).toBeInTheDocument();
        expect(screen.getByText('VRTC456')).toBeInTheDocument();
        expect(screen.getByText('9992.15 USD')).toBeInTheDocument();
    });

    it('switches to the selected account and rebuilds the connection', () => {
        render(<AccountSelector />);
        openSheet();

        fireEvent.click(screen.getByText('VRTC456'));

        expect(localStorage.getItem('active_loginid')).toBe('VRTC456');
        expect(mockCheckAndRegenerateWebSocket).toHaveBeenCalledTimes(1);
    });

    it('closes without reconnecting when the active account is picked', () => {
        render(<AccountSelector />);
        openSheet();

        fireEvent.click(screen.getByText('CR123'));

        expect(mockCheckAndRegenerateWebSocket).not.toHaveBeenCalled();
    });

    it('locks switching while the bot is running', () => {
        mockUseStore.mockReturnValue({
            client: { checkAndRegenerateWebSocket: mockCheckAndRegenerateWebSocket },
            run_panel: { is_running: true },
        });

        render(<AccountSelector />);
        openSheet();

        expect(screen.getByText('Stop the bot before switching accounts.')).toBeInTheDocument();
        // The active account stays clickable (it is a no-op); the others do not.
        expect(screen.getByText('VRTC456').closest('button')).toBeDisabled();
    });
});
