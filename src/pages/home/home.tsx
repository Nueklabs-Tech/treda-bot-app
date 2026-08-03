import { useCallback, useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
    ActionGrid,
    ActionTile,
    Card,
    EmptyState,
    PageButton,
    PageShell,
    Pill,
    Section,
    StatGrid,
    StatTile,
} from '@/components/page-shell';
import { Icon } from '@/components/page-shell/icons';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { standalone_routes } from '@/components/shared/utils/routes/routes';
import { DBOT_TABS } from '@/constants/bot-contents';
import { APP_ROUTES } from '@/constants/routes';
import { transaction_elements } from '@/constants/transactions';
import { getSavedWorkspaces, timeSince } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { TStrategy } from '@/types';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './home.scss';

type TContract = {
    contract_type?: string;
    display_name?: string;
    underlying?: string;
    buy_price?: number;
    profit?: number;
    currency?: string;
    is_completed?: boolean;
    date_start?: number;
    transaction_ids?: { buy?: number };
};

/** `1234.5` → `1,234.50` in the account's currency precision. */
const formatAmount = (amount: number, currency?: string) =>
    addComma(Number(amount || 0).toFixed(getDecimalPlaces(currency || 'USD')));

const Home = observer(() => {
    const navigate = useNavigate();
    const { authData, activeLoginid, connectionStatus } = useApiBase();
    const { client, transactions, run_panel, load_modal, quick_strategy, dashboard } = useStore();

    const { data: active_account } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });

    const { dashboard_strategies, setDashboardStrategies, setSelectedStrategyId, loadFileFromRecent } = load_modal;
    const { is_running, is_drawer_open, toggleDrawer } = run_panel;
    const { setActiveTab } = dashboard;

    const statistics = transactions.statistics;
    const currency = active_account?.currency || authData?.currency || 'USD';

    // The bot list is also what the Bots screen renders; loading it here means the
    // home screen can show a preview without waiting for a visit to that screen.
    useEffect(() => {
        let is_current = true;

        getSavedWorkspaces().then((workspaces: TStrategy[]) => {
            if (is_current) setDashboardStrategies(workspaces);
        });

        return () => {
            is_current = false;
        };
    }, [setDashboardStrategies]);

    const openBuilder = useCallback(() => navigate(APP_ROUTES.BUILDER), [navigate]);

    const openQuickStrategy = useCallback(() => {
        navigate(APP_ROUTES.BUILDER);
        quick_strategy.setFormVisibility(true);
    }, [navigate, quick_strategy]);

    const openStrategy = useCallback(
        async (strategy_id: string) => {
            setSelectedStrategyId(strategy_id);
            await loadFileFromRecent();
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        },
        [loadFileFromRecent, setActiveTab, setSelectedStrategyId]
    );

    const recent_contracts = useMemo(() => {
        return (transactions.transactions ?? [])
            .filter(
                (transaction: { type: string; data?: unknown }) =>
                    transaction.type === transaction_elements.CONTRACT && typeof transaction.data === 'object'
            )
            .slice(0, 5)
            .map(transaction => transaction.data as TContract);
    }, [transactions.transactions]);

    const recent_strategies = useMemo(() => (dashboard_strategies ?? []).slice(0, 3), [dashboard_strategies]);

    const win_rate = statistics.number_of_runs
        ? Math.round((statistics.won_contracts / statistics.number_of_runs) * 100)
        : 0;

    const is_connected = connectionStatus === CONNECTION_STATUS.OPENED;
    const display_name = authData?.fullname?.trim()?.split(' ')?.[0] || localize('trader');

    return (
        <PageShell
            title={<Localize i18n_default_text='Home' />}
            subtitle={
                <Localize
                    i18n_default_text='Welcome back, {{name}}. Here is how your automation is doing.'
                    values={{ name: display_name }}
                />
            }
            meta={
                <>
                    <Pill tone={is_connected ? 'success' : 'danger'} has_dot>
                        {is_connected ? (
                            <Localize i18n_default_text='Connected' />
                        ) : (
                            <Localize i18n_default_text='Reconnecting' />
                        )}
                    </Pill>
                    <Pill tone={active_account?.isVirtual ? 'info' : 'neutral'}>
                        {active_account?.isVirtual ? (
                            <Localize i18n_default_text='Demo account' />
                        ) : (
                            <Localize i18n_default_text='Real account' />
                        )}
                    </Pill>
                    {activeLoginid && <Pill>{activeLoginid}</Pill>}
                </>
            }
            actions={
                <>
                    <PageButton onClick={() => navigate(APP_ROUTES.WALLET)} icon={<Icon name='wallet' size={18} />}>
                        <Localize i18n_default_text='Wallet' />
                    </PageButton>
                    <PageButton variant='primary' onClick={openBuilder} icon={<Icon name='puzzle' size={18} />}>
                        <Localize i18n_default_text='Open bot builder' />
                    </PageButton>
                </>
            }
        >
            <div className='home__top'>
                <Card className='home__balance'>
                    <span className='home__balance-label'>
                        <Localize i18n_default_text='Available balance' />
                    </span>
                    <p className='home__balance-value'>
                        {active_account?.balance ?? formatAmount(0, currency)}
                        <span className='home__balance-currency'>{getCurrencyDisplayCode(currency)}</span>
                    </p>
                    <div className='home__balance-actions'>
                        <PageButton
                            variant='primary'
                            onClick={() =>
                                window.open(standalone_routes.cashier_deposit, '_blank', 'noopener,noreferrer')
                            }
                        >
                            <Localize i18n_default_text='Deposit' />
                        </PageButton>
                        <PageButton onClick={() => navigate(APP_ROUTES.WALLET)}>
                            <Localize i18n_default_text='Manage accounts' />
                        </PageButton>
                    </div>
                </Card>

                <Card className='home__status'>
                    <div className='home__status-head'>
                        <span className='home__status-label'>
                            <Localize i18n_default_text='Bot status' />
                        </span>
                        <Pill tone={is_running ? 'success' : 'neutral'} has_dot>
                            {is_running ? (
                                <Localize i18n_default_text='Running' />
                            ) : (
                                <Localize i18n_default_text='Idle' />
                            )}
                        </Pill>
                    </div>
                    <p className='home__status-strategy'>
                        {load_modal.selected_strategy?.name || localize('No strategy loaded')}
                    </p>
                    <p className='home__status-hint'>
                        {is_running ? (
                            <Localize i18n_default_text='Your strategy is trading. Open the run panel to follow every contract as it settles.' />
                        ) : (
                            <Localize i18n_default_text='Load a bot in the builder, then start it from the run panel.' />
                        )}
                    </p>
                    <div className='home__status-actions'>
                        <PageButton
                            onClick={() => toggleDrawer(!is_drawer_open)}
                            icon={<Icon name='gauge' size={18} />}
                        >
                            {is_drawer_open ? (
                                <Localize i18n_default_text='Hide run panel' />
                            ) : (
                                <Localize i18n_default_text='Show run panel' />
                            )}
                        </PageButton>
                        <PageButton onClick={() => navigate(APP_ROUTES.BOTS)} icon={<Icon name='bot' size={18} />}>
                            <Localize i18n_default_text='My bots' />
                        </PageButton>
                    </div>
                </Card>
            </div>

            <Section
                title={<Localize i18n_default_text='This session' />}
                description={
                    <Localize i18n_default_text='Totals for the contracts this browser session has run. They reset when you clear the run panel.' />
                }
            >
                <StatGrid columns={4}>
                    <StatTile
                        label={<Localize i18n_default_text='Total runs' />}
                        value={statistics.number_of_runs}
                        hint={
                            <Localize
                                i18n_default_text='{{won}} won · {{lost}} lost'
                                values={{ won: statistics.won_contracts, lost: statistics.lost_contracts }}
                            />
                        }
                    />
                    <StatTile
                        label={<Localize i18n_default_text='Win rate' />}
                        value={`${win_rate}%`}
                        tone={win_rate >= 50 ? 'success' : 'neutral'}
                        hint={<Localize i18n_default_text='Of settled contracts' />}
                    />
                    <StatTile
                        label={<Localize i18n_default_text='Total stake' />}
                        value={`${formatAmount(statistics.total_stake, currency)} ${getCurrencyDisplayCode(currency)}`}
                        hint={<Localize i18n_default_text='Amount bought' />}
                    />
                    <StatTile
                        label={<Localize i18n_default_text='Profit / loss' />}
                        value={`${statistics.total_profit >= 0 ? '' : '-'}${formatAmount(
                            Math.abs(statistics.total_profit),
                            currency
                        )} ${getCurrencyDisplayCode(currency)}`}
                        tone={
                            statistics.total_profit > 0 ? 'success' : statistics.total_profit < 0 ? 'danger' : 'neutral'
                        }
                        hint={
                            <Localize
                                i18n_default_text='Payout {{payout}}'
                                values={{ payout: formatAmount(statistics.total_payout, currency) }}
                            />
                        }
                    />
                </StatGrid>
            </Section>

            <Section
                title={<Localize i18n_default_text='Quick actions' />}
                description={<Localize i18n_default_text='The things you are most likely to want next.' />}
            >
                <ActionGrid>
                    <ActionTile
                        icon={<Icon name='puzzle' />}
                        title={<Localize i18n_default_text='Build a bot' />}
                        description={<Localize i18n_default_text='Drag blocks into a strategy' />}
                        onClick={openBuilder}
                    />
                    <ActionTile
                        icon={<Icon name='bolt' />}
                        title={<Localize i18n_default_text='Quick strategy' />}
                        description={<Localize i18n_default_text='Start from a proven template' />}
                        onClick={openQuickStrategy}
                    />
                    <ActionTile
                        icon={<Icon name='candles' />}
                        title={<Localize i18n_default_text='Charts' />}
                        description={<Localize i18n_default_text='Study a market before you trade' />}
                        onClick={() => navigate(APP_ROUTES.CHART)}
                    />
                    <ActionTile
                        icon={<Icon name='book' />}
                        title={<Localize i18n_default_text='Tutorials' />}
                        description={<Localize i18n_default_text='Guides, FAQ and walkthroughs' />}
                        onClick={() => navigate(APP_ROUTES.TUTORIALS)}
                    />
                </ActionGrid>
            </Section>

            <Section
                title={<Localize i18n_default_text='Your bots' />}
                description={<Localize i18n_default_text='Recently saved strategies on this device.' />}
                action={
                    <PageButton variant='ghost' onClick={() => navigate(APP_ROUTES.BOTS)}>
                        <Localize i18n_default_text='View all' />
                    </PageButton>
                }
            >
                {recent_strategies.length ? (
                    <ul className='home__bots'>
                        {recent_strategies.map((strategy: TStrategy) => (
                            <li key={strategy.id}>
                                <button
                                    type='button'
                                    className='home__bot'
                                    onClick={() => openStrategy(strategy.id)}
                                    disabled={is_running}
                                >
                                    <span className='home__bot-icon' aria-hidden='true'>
                                        <Icon name='bot' size={20} />
                                    </span>
                                    <span className='home__bot-text'>
                                        <span className='home__bot-name'>{strategy.name}</span>
                                        <span className='home__bot-time'>
                                            {strategy.timestamp ? timeSince(strategy.timestamp) : ''}
                                        </span>
                                    </span>
                                    <Icon name='chevron' size={18} className='home__bot-chevron' />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={<Icon name='bot' size={32} />}
                        title={<Localize i18n_default_text='No bots saved yet' />}
                        description={
                            <Localize i18n_default_text='Build one from blocks or start with a quick strategy — it will show up here once you save it.' />
                        }
                        action={
                            <PageButton variant='primary' onClick={openBuilder}>
                                <Localize i18n_default_text='Build your first bot' />
                            </PageButton>
                        }
                    />
                )}
            </Section>

            <Section
                title={<Localize i18n_default_text='Recent contracts' />}
                description={<Localize i18n_default_text='The last trades your bot placed in this session.' />}
            >
                {recent_contracts.length ? (
                    <div className='home__contracts'>
                        {recent_contracts.map((contract: TContract, index: number) => {
                            const profit = Number(contract.profit) || 0;
                            const is_win = profit >= 0;

                            return (
                                <div className='home__contract' key={contract.transaction_ids?.buy ?? index}>
                                    <span
                                        className={`home__contract-icon home__contract-icon--${is_win ? 'win' : 'loss'}`}
                                        aria-hidden='true'
                                    >
                                        <Icon name={is_win ? 'trend_up' : 'trend_down'} size={18} />
                                    </span>
                                    <span className='home__contract-text'>
                                        <span className='home__contract-name'>
                                            {contract.display_name || contract.underlying || contract.contract_type}
                                        </span>
                                        <span className='home__contract-meta'>
                                            {contract.contract_type}
                                            {contract.buy_price !== undefined && (
                                                <>
                                                    {' · '}
                                                    <Localize
                                                        i18n_default_text='Stake {{stake}}'
                                                        values={{
                                                            stake: formatAmount(
                                                                Number(contract.buy_price),
                                                                contract.currency || currency
                                                            ),
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </span>
                                    </span>
                                    <span
                                        className={`home__contract-profit home__contract-profit--${
                                            is_win ? 'win' : 'loss'
                                        }`}
                                    >
                                        {is_win ? '+' : '-'}
                                        {formatAmount(Math.abs(profit), contract.currency || currency)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon={<Icon name='activity' size={32} />}
                        title={<Localize i18n_default_text='No contracts yet' />}
                        description={
                            <Localize i18n_default_text='Once a bot runs, every contract it buys shows up here and in the run panel journal.' />
                        }
                    />
                )}
            </Section>
        </PageShell>
    );
});

export default Home;
