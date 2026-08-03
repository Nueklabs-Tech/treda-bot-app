import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useNavigate } from 'react-router-dom';
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { standalone_routes } from '@/components/shared/utils/routes/routes';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { isVirtualAccount } from '@/utils/account-helpers';
import { navigateToTransfer } from '@/utils/transfer-utils';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './wallet.scss';

/** Same 24px / 1.6-stroke outline family as the profile screen. */
const ICON_PATHS = {
    arrow_left: <path d='M15 19 8 12l7-7' />,
    chevron: <path d='m9 5 7 7-7 7' />,
    deposit: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 8v8M8 12h8' />
        </>
    ),
    transfer: <path d='M4 8.5h13l-3.5-3.5M20 15.5H7l3.5 3.5' />,
    cashier: (
        <>
            <rect x='3' y='6' width='18' height='13' rx='2.5' />
            <path d='M3 10h18M16.5 14.5h1' />
        </>
    ),
    statement: (
        <>
            <path d='M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z' />
            <path d='M14 3v5h5M9 13h6M9 17h4' />
        </>
    ),
    positions: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 7v5.2l3.2 1.9' />
        </>
    ),
    profit: <path d='M4 17.5 9.5 12l3.5 3.5L20 8.5M15.5 8.5H20V13' />,
    history: (
        <>
            <path d='M3.5 12a8.5 8.5 0 1 0 2.6-6.1' />
            <path d='M3.5 4.5V9H8' />
        </>
    ),
    check: <path d='m5 12.5 4.5 4.5L19 7' />,
    limits: (
        <>
            <path d='M4 17a8 8 0 1 1 16 0' />
            <path d='m14.5 10.5-3 4' />
        </>
    ),
    shield: (
        <>
            <path d='M12 3.5 19 6.4v5c0 4.3-2.9 8.2-7 9.6-4.1-1.4-7-5.3-7-9.6v-5l7-2.9Z' />
            <path d='m9.2 12 2 2 3.6-3.6' />
        </>
    ),
    p2p: (
        <>
            <circle cx='8' cy='9' r='3' />
            <circle cx='16.5' cy='9' r='2.4' />
            <path d='M3 19c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2M14.5 19c0-1.8 1-3.2 2.7-3.7' />
        </>
    ),
    settings: (
        <>
            <path d='M4 8h8M17 8h3M4 16h3M12 16h8' />
            <circle cx='14.5' cy='8' r='2.2' />
            <circle cx='9.5' cy='16' r='2.2' />
        </>
    ),
} as const;

type TIconName = keyof typeof ICON_PATHS;

const Icon = ({ name, className }: { name: TIconName; className?: string }) => (
    <svg
        width='22'
        height='22'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        className={className}
    >
        {ICON_PATHS[name]}
    </svg>
);

type TReportRow = {
    key: string;
    label: string;
    icon: TIconName;
    url: string;
};

const Wallet = observer(() => {
    const navigate = useNavigate();
    const { accountList, activeLoginid, authData } = useApiBase();
    const { client, run_panel, transactions } = useStore() ?? {};

    // Switching accounts drops and re-opens the socket, so it is blocked while a
    // strategy is running — same rule the header's account switcher applies.
    const is_bot_running = Boolean(run_panel?.is_running || api_base.is_running);

    const openExternal = useCallback((url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    }, []);

    const handleTransfer = useCallback(() => {
        if (!authData?.currency) return;
        navigateToTransfer(authData.currency);
    }, [authData?.currency]);

    const accounts = useMemo(
        () =>
            (accountList ?? [])
                .map(account => {
                    const balance_data = client?.all_accounts_balance?.accounts?.[account.loginid];
                    const currency = balance_data?.currency || account.currency;
                    const raw_balance = balance_data?.balance ?? Number(account.balance ?? 0);

                    return {
                        loginid: account.loginid,
                        currency,
                        is_virtual: isVirtualAccount(account.loginid),
                        is_active: account.loginid === activeLoginid,
                        balance: addComma(Number(raw_balance).toFixed(getDecimalPlaces(currency))),
                    };
                })
                .sort((a, b) => Number(b.is_active) - Number(a.is_active)),
        [accountList, activeLoginid, client?.all_accounts_balance]
    );

    const active_account = accounts.find(account => account.is_active);

    const handleAccountSelect = useCallback(
        (loginid: string) => {
            if (is_bot_running || loginid === activeLoginid) return;

            localStorage.setItem('active_loginid', loginid);
            client?.checkAndRegenerateWebSocket();
        },
        [activeLoginid, client, is_bot_running]
    );

    // Trading totals for this browser session, mirrored from the run panel so the
    // wallet answers "what has the bot done to my balance" without a trip to the
    // reports pages.
    const statistics = transactions?.statistics;
    const win_rate = statistics?.number_of_runs
        ? Math.round((statistics.won_contracts / statistics.number_of_runs) * 100)
        : 0;
    const session_profit = Number(statistics?.total_profit ?? 0);

    const payment_rows: TReportRow[] = useMemo(
        () => [
            { key: 'deposit', label: localize('Deposit'), icon: 'deposit', url: standalone_routes.cashier_deposit },
            { key: 'cashier', label: localize('Withdraw'), icon: 'cashier', url: standalone_routes.cashier },
            { key: 'p2p', label: localize('Deriv P2P'), icon: 'p2p', url: standalone_routes.cashier_p2p },
        ],
        []
    );

    const account_rows: TReportRow[] = useMemo(
        () => [
            {
                key: 'limits',
                label: localize('Account limits'),
                icon: 'limits',
                url: standalone_routes.account_limits,
            },
            {
                key: 'settings',
                label: localize('Account settings'),
                icon: 'settings',
                url: standalone_routes.account_settings,
            },
            {
                key: 'responsible',
                label: localize('Responsible trading'),
                icon: 'shield',
                url: standalone_routes.responsible,
            },
        ],
        []
    );

    const report_rows: TReportRow[] = useMemo(
        () => [
            { key: 'statement', label: localize('Statement'), icon: 'statement', url: standalone_routes.statement },
            {
                key: 'positions',
                label: localize('Open positions'),
                icon: 'positions',
                url: standalone_routes.positions,
            },
            { key: 'profit', label: localize('Profit table'), icon: 'profit', url: standalone_routes.profit },
            {
                key: 'transactions',
                label: localize('Recent transactions'),
                icon: 'history',
                url: standalone_routes.recent_transactions,
            },
        ],
        []
    );

    // Reachable only with a resolved session, like the profile screen.
    if (!activeLoginid) return <Navigate to='/' replace />;

    return (
        <div className='wallet'>
            <header className='wallet__hero'>
                <button
                    type='button'
                    className='wallet__back'
                    onClick={() => navigate('/')}
                    aria-label={localize('Back to bot')}
                >
                    <Icon name='arrow_left' />
                </button>

                <span className='wallet__hero-label'>
                    <Localize i18n_default_text='Available balance' />
                </span>
                <p className='wallet__hero-balance'>
                    {active_account?.balance ?? '0.00'}
                    <span className='wallet__hero-currency'>
                        {getCurrencyDisplayCode(active_account?.currency) || ''}
                    </span>
                </p>
                <span className='wallet__hero-account'>
                    {activeLoginid}
                    <span className='wallet__hero-dot' aria-hidden='true'>
                        ·
                    </span>
                    {active_account?.is_virtual ? (
                        <Localize i18n_default_text='Demo' />
                    ) : (
                        <Localize i18n_default_text='Real' />
                    )}
                </span>

                <div className='wallet__hero-actions'>
                    <button
                        type='button'
                        className='wallet__hero-action'
                        onClick={() => openExternal(standalone_routes.cashier_deposit)}
                    >
                        <Icon name='deposit' />
                        <Localize i18n_default_text='Deposit' />
                    </button>
                    <button
                        type='button'
                        className='wallet__hero-action'
                        onClick={handleTransfer}
                        disabled={!authData?.currency || client?.is_logging_out}
                    >
                        <Icon name='transfer' />
                        <Localize i18n_default_text='Transfer' />
                    </button>
                    <button
                        type='button'
                        className='wallet__hero-action'
                        onClick={() => openExternal(standalone_routes.cashier)}
                    >
                        <Icon name='cashier' />
                        <Localize i18n_default_text='Cashier' />
                    </button>
                </div>
            </header>

            <div className='wallet__sheet'>
                <section className='wallet__group'>
                    <h2 className='wallet__group-title'>
                        <Localize i18n_default_text='This session' />
                    </h2>
                    <div className='wallet__stats'>
                        <div className='wallet__stat'>
                            <span className='wallet__stat-label'>
                                <Localize i18n_default_text='Profit / loss' />
                            </span>
                            <span
                                className={`wallet__stat-value wallet__stat-value--${
                                    session_profit > 0 ? 'win' : session_profit < 0 ? 'loss' : 'flat'
                                }`}
                            >
                                {session_profit >= 0 ? '' : '-'}
                                {addComma(Math.abs(session_profit).toFixed(getDecimalPlaces(active_account?.currency)))}
                            </span>
                        </div>
                        <div className='wallet__stat'>
                            <span className='wallet__stat-label'>
                                <Localize i18n_default_text='Contracts' />
                            </span>
                            <span className='wallet__stat-value'>{statistics?.number_of_runs ?? 0}</span>
                        </div>
                        <div className='wallet__stat'>
                            <span className='wallet__stat-label'>
                                <Localize i18n_default_text='Win rate' />
                            </span>
                            <span className='wallet__stat-value'>{win_rate}%</span>
                        </div>
                    </div>
                </section>

                <section className='wallet__group'>
                    <h2 className='wallet__group-title'>
                        <Localize i18n_default_text='Your accounts' />
                    </h2>
                    {is_bot_running && (
                        <p className='wallet__note'>
                            <Localize i18n_default_text='Stop the bot to switch accounts.' />
                        </p>
                    )}
                    <ul className='wallet__list'>
                        {accounts.map(account => (
                            <li key={account.loginid}>
                                <button
                                    type='button'
                                    className='wallet__account'
                                    onClick={() => handleAccountSelect(account.loginid)}
                                    disabled={is_bot_running || account.is_active}
                                    aria-current={account.is_active ? 'true' : undefined}
                                >
                                    <span className='wallet__account-icon'>
                                        <CurrencyIcon
                                            currency={account.currency?.toLowerCase()}
                                            isVirtual={account.is_virtual}
                                        />
                                    </span>
                                    <span className='wallet__account-text'>
                                        <span className='wallet__account-name'>
                                            {account.is_virtual ? (
                                                <Localize i18n_default_text='Demo account' />
                                            ) : (
                                                getCurrencyDisplayCode(account.currency)
                                            )}
                                        </span>
                                        <span className='wallet__account-loginid'>{account.loginid}</span>
                                    </span>
                                    <span className='wallet__account-balance'>
                                        {account.balance} {getCurrencyDisplayCode(account.currency)}
                                    </span>
                                    {account.is_active && <Icon name='check' className='wallet__account-check' />}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className='wallet__group'>
                    <h2 className='wallet__group-title'>
                        <Localize i18n_default_text='Payments' />
                    </h2>
                    <ul className='wallet__list'>
                        {payment_rows.map(row => (
                            <li key={row.key}>
                                <button type='button' className='wallet__row' onClick={() => openExternal(row.url)}>
                                    <Icon name={row.icon} className='wallet__row-icon' />
                                    <span className='wallet__row-label'>{row.label}</span>
                                    <Icon name='chevron' className='wallet__chevron' />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className='wallet__group'>
                    <h2 className='wallet__group-title'>
                        <Localize i18n_default_text='Reports' />
                    </h2>
                    <ul className='wallet__list'>
                        {report_rows.map(row => (
                            <li key={row.key}>
                                <button type='button' className='wallet__row' onClick={() => openExternal(row.url)}>
                                    <Icon name={row.icon} className='wallet__row-icon' />
                                    <span className='wallet__row-label'>{row.label}</span>
                                    <Icon name='chevron' className='wallet__chevron' />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className='wallet__group'>
                    <h2 className='wallet__group-title'>
                        <Localize i18n_default_text='Account and safety' />
                    </h2>
                    <ul className='wallet__list'>
                        {account_rows.map(row => (
                            <li key={row.key}>
                                <button type='button' className='wallet__row' onClick={() => openExternal(row.url)}>
                                    <Icon name={row.icon} className='wallet__row-icon' />
                                    <span className='wallet__row-label'>{row.label}</span>
                                    <Icon name='chevron' className='wallet__chevron' />
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>

                <p className='wallet__disclaimer'>
                    <Localize i18n_default_text='Deposits, withdrawals and account settings are handled on Deriv and open in a new tab. Session figures cover this browser session only.' />
                </p>
            </div>
        </div>
    );
});

export default Wallet;
