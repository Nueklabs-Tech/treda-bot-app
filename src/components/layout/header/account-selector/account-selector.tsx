import { useCallback, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { isDemoAccount } from '@/utils/account-helpers';
import { Localize } from '@deriv-com/translations';
import AccountSheet, { TSheetAccount } from './account-sheet';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './account-selector.scss';

const ChevronIcon = () => (
    <svg width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true'>
        <path d='M2 4L6 8L10 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

/**
 * Header account chip: shows which account is live and its balance, and opens the
 * bottom sheet to switch between the real and demo accounts.
 *
 * Sits where the app name used to, next to the logo.
 */
const AccountSelector = observer(() => {
    const { accountList, activeLoginid } = useApiBase();
    const { client, run_panel } = useStore() ?? {};
    const [is_open, setIsOpen] = useState(false);

    // Switching mid-run would leave the open contracts behind on the previous
    // account, so the sheet stays read-only until the bot stops.
    const is_locked = Boolean(run_panel?.is_running || api_base.is_running);

    // The authorize payload's balance is a snapshot; `all_accounts_balance` is the
    // live subscription, so prefer it and fall back to what the account list has.
    const balances = client?.all_accounts_balance?.accounts;

    const accounts = useMemo<TSheetAccount[]>(() => {
        if (!accountList) return [];

        return accountList.map(account => {
            const live = balances?.[account.loginid];
            const currency = live?.currency || account.currency || '';
            const amount = live?.balance ?? Number(account.balance ?? 0);

            return {
                loginid: account.loginid,
                currency: currency ? getCurrencyDisplayCode(currency) : '',
                balance: addComma(Number(amount).toFixed(getDecimalPlaces(currency))),
                is_virtual: isDemoAccount(account.loginid),
                is_active: account.loginid === activeLoginid,
            };
        });
    }, [accountList, activeLoginid, balances]);

    const active_account = accounts.find(account => account.is_active);

    const handleSelect = useCallback(
        (loginid: string) => {
            setIsOpen(false);
            if (loginid === activeLoginid) return;

            // Same handoff the previous switcher used: the socket URL is minted per
            // account, so the connection has to be rebuilt rather than re-authorized.
            localStorage.setItem('active_loginid', loginid);
            client?.checkAndRegenerateWebSocket();
        },
        [activeLoginid, client]
    );

    const closeSheet = useCallback(() => setIsOpen(false), []);

    if (!active_account) return null;

    return (
        <div className='account-selector'>
            <button
                type='button'
                className='account-selector__trigger'
                onClick={() => setIsOpen(true)}
                aria-haspopup='dialog'
                aria-expanded={is_open}
            >
                <span className='account-selector__type'>
                    {active_account.is_virtual ? (
                        <Localize i18n_default_text='Demo account' />
                    ) : (
                        <Localize i18n_default_text='Real account' />
                    )}
                    <ChevronIcon />
                </span>
                <span className='account-selector__balance'>
                    {active_account.currency ? (
                        `${active_account.balance} ${active_account.currency}`
                    ) : (
                        <Localize i18n_default_text='No currency assigned' />
                    )}
                </span>
            </button>

            <AccountSheet
                is_open={is_open}
                onClose={closeSheet}
                onSelect={handleSelect}
                accounts={accounts}
                is_locked={is_locked}
            />
        </div>
    );
});

export default AccountSelector;
