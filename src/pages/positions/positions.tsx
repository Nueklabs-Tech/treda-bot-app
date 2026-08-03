import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { PageButton, PageShell, Pill, Section, StatGrid, StatTile } from '@/components/page-shell';
import { Icon } from '@/components/page-shell/icons';
import RunPanelTabs from '@/components/run-panel/run-panel-tabs';
import Money from '@/components/shared_ui/money';
import { APP_ROUTES } from '@/constants/routes';
import { useStore } from '@/hooks/useStore';
import { Localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './positions.scss';

const Positions = observer(() => {
    const navigate = useNavigate();
    const { client, run_panel, transactions } = useStore();
    const { currency } = client;
    const { active_index, is_clear_stat_disabled, is_running, onClearStatClick, onMount, onUnmount, setActiveTabIndex } =
        run_panel;
    const { statistics, transactions: transaction_list } = transactions;
    const { total_payout, total_profit, total_stake, won_contracts, lost_contracts, number_of_runs } = statistics;

    // The run panel is what normally keeps the journal listeners registered, and
    // it is not mounted on this route — so this page takes over that job while it
    // is on screen, exactly as <RunPanel /> does.
    useEffect(() => {
        onMount();

        return () => onUnmount();
    }, [onMount, onUnmount]);

    const has_transactions = Boolean(transaction_list?.length);

    return (
        <PageShell
            className='positions-page'
            title={<Localize i18n_default_text='Positions' />}
            subtitle={
                <Localize i18n_default_text='Every contract your bot has taken on this device — the running summary, the transaction list and the journal behind them.' />
            }
            meta={
                <>
                    <Pill tone={is_running ? 'success' : 'neutral'} has_dot={is_running}>
                        {is_running ? (
                            <Localize i18n_default_text='Bot running' />
                        ) : (
                            <Localize i18n_default_text='Bot idle' />
                        )}
                    </Pill>
                    <Pill tone={total_profit >= 0 ? 'success' : 'danger'}>
                        {total_profit >= 0 ? (
                            <Localize i18n_default_text='In profit' />
                        ) : (
                            <Localize i18n_default_text='Down on the session' />
                        )}
                    </Pill>
                    {has_transactions && (
                        <Pill tone='info'>
                            <Localize
                                i18n_default_text='{{count}} contracts'
                                values={{ count: won_contracts + lost_contracts }}
                            />
                        </Pill>
                    )}
                </>
            }
            actions={
                <>
                    <PageButton
                        onClick={onClearStatClick}
                        is_disabled={is_clear_stat_disabled}
                        icon={<Icon name='refresh' size={18} />}
                    >
                        <Localize i18n_default_text='Reset stats' />
                    </PageButton>
                    <PageButton
                        variant='primary'
                        onClick={() => navigate(APP_ROUTES.BUILDER)}
                        icon={<Icon name='puzzle' size={18} />}
                    >
                        <Localize i18n_default_text='Open builder' />
                    </PageButton>
                </>
            }
        >
            <StatGrid columns={3}>
                <StatTile
                    label={<Localize i18n_default_text='Total stake' />}
                    value={<Money amount={total_stake} currency={currency} show_currency />}
                    hint={<Localize i18n_default_text='Since your stats were last reset' />}
                />
                <StatTile
                    label={<Localize i18n_default_text='Total payout' />}
                    value={<Money amount={total_payout} currency={currency} show_currency />}
                />
                <StatTile
                    label={<Localize i18n_default_text='Total profit/loss' />}
                    value={<Money amount={total_profit} currency={currency} has_sign show_currency />}
                    tone={total_profit > 0 ? 'success' : total_profit < 0 ? 'danger' : 'neutral'}
                />
                <StatTile label={<Localize i18n_default_text='No. of runs' />} value={number_of_runs} />
                <StatTile
                    label={<Localize i18n_default_text='Contracts won' />}
                    value={won_contracts}
                    tone={won_contracts ? 'success' : 'neutral'}
                />
                <StatTile
                    label={<Localize i18n_default_text='Contracts lost' />}
                    value={lost_contracts}
                    tone={lost_contracts ? 'danger' : 'neutral'}
                />
            </StatGrid>

            <Section
                title={<Localize i18n_default_text='Run details' />}
                description={
                    <Localize i18n_default_text='The same summary, transactions and journal the run panel shows, with room to read them.' />
                }
            >
                <div className='positions-page__panel'>
                    <RunPanelTabs active_index={active_index} setActiveTabIndex={setActiveTabIndex} />
                </div>
            </Section>
        </PageShell>
    );
});

export default Positions;
