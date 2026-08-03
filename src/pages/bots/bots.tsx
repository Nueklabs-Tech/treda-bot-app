import { useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
    ActionGrid,
    ActionTile,
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
import { DBOT_TABS } from '@/constants/bot-contents';
import { APP_ROUTES } from '@/constants/routes';
import { getSavedWorkspaces, timeSince } from '@/external/bot-skeleton';
import useActiveAccount from '@/hooks/api/account/useActiveAccount';
import { useStore } from '@/hooks/useStore';
import { TStrategy } from '@/types';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import DeleteDialog from '../dashboard/bot-list/delete-dialog';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './bots.scss';

/**
 * The templates worth putting in front of someone straight away. The full set
 * (accumulators variants included) lives behind "All templates", which opens the
 * quick strategy sheet on its own picker.
 */
const FEATURED_TEMPLATES: { key: string; title: string; description: string }[] = [
    {
        key: 'MARTINGALE',
        title: localize('Martingale'),
        description: localize('Doubles the stake after a loss to recover it on the next win.'),
    },
    {
        key: 'D_ALEMBERT',
        title: localize("D'Alembert"),
        description: localize('Raises the stake by one unit after a loss, lowers it after a win.'),
    },
    {
        key: 'OSCARS_GRIND',
        title: localize("Oscar's Grind"),
        description: localize('Aims for one unit of profit per cycle, keeping the stake conservative.'),
    },
    {
        key: 'REVERSE_MARTINGALE',
        title: localize('Reverse Martingale'),
        description: localize('Increases the stake on a win to ride a streak, resets on a loss.'),
    },
];

const formatAmount = (amount: number, currency?: string) =>
    addComma(Number(amount || 0).toFixed(getDecimalPlaces(currency || 'USD')));

const Bots = observer(() => {
    const navigate = useNavigate();
    const { isDesktop } = useDevice();
    const { load_modal, save_modal, dashboard, quick_strategy, run_panel, transactions, google_drive, client } =
        useStore();

    const {
        dashboard_strategies,
        setDashboardStrategies,
        setSelectedStrategyId,
        loadFileFromRecent,
        onToggleDeleteDialog,
        toggleLoadModal,
        setActiveTabIndex,
    } = load_modal;
    const { setActiveTab } = dashboard;
    const { is_running } = run_panel;
    const { is_google_drive_configured } = google_drive;

    const [is_loading, setIsLoading] = useState(true);

    const { data: active_account } = useActiveAccount({
        allBalanceData: client?.all_accounts_balance,
        directBalance: client?.balance,
    });
    const currency = active_account?.currency || 'USD';
    const statistics = transactions.statistics;

    // Saved strategies live in localForage, not in the store, so the list is
    // re-read whenever this screen opens — a bot saved from the builder in this
    // session shows up without a reload.
    useEffect(() => {
        let is_current = true;

        getSavedWorkspaces()
            .then((workspaces: TStrategy[]) => {
                if (is_current) setDashboardStrategies(workspaces);
            })
            .finally(() => {
                if (is_current) setIsLoading(false);
            });

        return () => {
            is_current = false;
        };
    }, [setDashboardStrategies, dashboard.strategy_save_type]);

    const openBuilder = useCallback(() => navigate(APP_ROUTES.BUILDER), [navigate]);

    const openQuickStrategy = useCallback(
        (template_key?: string) => {
            if (template_key) quick_strategy.setSelectedStrategy(template_key);
            navigate(APP_ROUTES.BUILDER);
            quick_strategy.setFormVisibility(true);
        },
        [navigate, quick_strategy]
    );

    // Both import paths open the builder's load modal on the matching tab — the
    // same flow the old dashboard tiles used.
    const openImport = useCallback(
        (source: 'local' | 'google_drive') => {
            const google_drive_tab_index = isDesktop ? 2 : 1;

            toggleLoadModal();
            setActiveTabIndex(source === 'google_drive' ? google_drive_tab_index : isDesktop ? 1 : 0);
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        },
        [isDesktop, setActiveTab, setActiveTabIndex, toggleLoadModal]
    );

    const handleOpen = useCallback(
        async (strategy_id: string) => {
            setSelectedStrategyId(strategy_id);
            await loadFileFromRecent();
            setActiveTab(DBOT_TABS.BOT_BUILDER);
        },
        [loadFileFromRecent, setActiveTab, setSelectedStrategyId]
    );

    const handleSave = useCallback(
        (strategy: TStrategy) => {
            setSelectedStrategyId(strategy.id);
            save_modal.updateBotName(strategy.name);
            save_modal.toggleSaveModal();
        },
        [save_modal, setSelectedStrategyId]
    );

    const handleDelete = useCallback(
        (strategy_id: string) => {
            setSelectedStrategyId(strategy_id);
            onToggleDeleteDialog(true);
        },
        [onToggleDeleteDialog, setSelectedStrategyId]
    );

    const strategies: TStrategy[] = useMemo(() => dashboard_strategies ?? [], [dashboard_strategies]);

    return (
        <PageShell
            className='bots'
            title={<Localize i18n_default_text='Bots' />}
            subtitle={
                <Localize i18n_default_text='Everything you have built, plus the fastest ways to start something new.' />
            }
            meta={
                <>
                    <Pill tone={is_running ? 'success' : 'neutral'} has_dot>
                        {is_running ? (
                            <Localize i18n_default_text='Bot running' />
                        ) : (
                            <Localize i18n_default_text='No bot running' />
                        )}
                    </Pill>
                    <Pill>
                        <Localize i18n_default_text='{{count}} saved' values={{ count: strategies.length }} />
                    </Pill>
                </>
            }
            actions={
                <>
                    <PageButton onClick={() => openQuickStrategy()} icon={<Icon name='bolt' size={18} />}>
                        <Localize i18n_default_text='Quick strategy' />
                    </PageButton>
                    <PageButton variant='primary' onClick={openBuilder} icon={<Icon name='plus' size={18} />}>
                        <Localize i18n_default_text='New bot' />
                    </PageButton>
                </>
            }
        >
            <StatGrid columns={4}>
                <StatTile
                    label={<Localize i18n_default_text='Saved bots' />}
                    value={strategies.length}
                    hint={<Localize i18n_default_text='Stored on this device' />}
                />
                <StatTile
                    label={<Localize i18n_default_text='Loaded strategy' />}
                    value={load_modal.selected_strategy?.name || localize('None')}
                    hint={<Localize i18n_default_text='Currently in the builder' />}
                />
                <StatTile
                    label={<Localize i18n_default_text='Runs this session' />}
                    value={statistics.number_of_runs}
                    hint={
                        <Localize
                            i18n_default_text='{{won}} won · {{lost}} lost'
                            values={{ won: statistics.won_contracts, lost: statistics.lost_contracts }}
                        />
                    }
                />
                <StatTile
                    label={<Localize i18n_default_text='Session P/L' />}
                    value={`${statistics.total_profit >= 0 ? '' : '-'}${formatAmount(
                        Math.abs(statistics.total_profit),
                        currency
                    )} ${getCurrencyDisplayCode(currency)}`}
                    tone={statistics.total_profit > 0 ? 'success' : statistics.total_profit < 0 ? 'danger' : 'neutral'}
                />
            </StatGrid>

            <Section
                title={<Localize i18n_default_text='Your bots' />}
                description={
                    <Localize i18n_default_text='Open one in the builder to edit or run it. Bots are saved in this browser unless you export them.' />
                }
                action={
                    strategies.length ? (
                        <PageButton variant='ghost' onClick={() => openImport('local')}>
                            <Localize i18n_default_text='Import' />
                        </PageButton>
                    ) : null
                }
            >
                {strategies.length ? (
                    <ul className='bots__list'>
                        {strategies.map(strategy => (
                            <li className='bots__item' key={strategy.id}>
                                <span className='bots__item-icon' aria-hidden='true'>
                                    <Icon name='bot' size={20} />
                                </span>
                                <div className='bots__item-text'>
                                    <p className='bots__item-name'>{strategy.name}</p>
                                    <p className='bots__item-meta'>
                                        {strategy.timestamp && (
                                            <span>
                                                <Localize
                                                    i18n_default_text='Modified {{time}}'
                                                    values={{ time: timeSince(strategy.timestamp) }}
                                                />
                                            </span>
                                        )}
                                        {strategy.save_type && (
                                            <span className='bots__item-source'>
                                                {load_modal.getSaveType(strategy.save_type)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className='bots__item-actions'>
                                    <PageButton
                                        variant='primary'
                                        onClick={() => handleOpen(strategy.id)}
                                        is_disabled={is_running}
                                    >
                                        <Localize i18n_default_text='Open' />
                                    </PageButton>
                                    <PageButton onClick={() => handleSave(strategy)}>
                                        <Localize i18n_default_text='Save' />
                                    </PageButton>
                                    <PageButton variant='ghost' onClick={() => handleDelete(strategy.id)}>
                                        <Localize i18n_default_text='Delete' />
                                    </PageButton>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        icon={<Icon name='bot' size={32} />}
                        title={
                            is_loading ? (
                                <Localize i18n_default_text='Looking for your bots…' />
                            ) : (
                                <Localize i18n_default_text='No bots yet' />
                            )
                        }
                        description={
                            <Localize i18n_default_text='Build one block by block, start from a template, or import a strategy you already have.' />
                        }
                        action={
                            <PageButton variant='primary' onClick={openBuilder}>
                                <Localize i18n_default_text='Open bot builder' />
                            </PageButton>
                        }
                    />
                )}
            </Section>

            <Section
                title={<Localize i18n_default_text='Start from a template' />}
                description={
                    <Localize i18n_default_text='Quick strategies come pre-wired: pick an asset, a stake and your limits, and the blocks are generated for you.' />
                }
                action={
                    <PageButton variant='ghost' onClick={() => openQuickStrategy()}>
                        <Localize i18n_default_text='All templates' />
                    </PageButton>
                }
            >
                <div className='bots__templates'>
                    {FEATURED_TEMPLATES.map(template => (
                        <button
                            type='button'
                            className='bots__template'
                            key={template.key}
                            onClick={() => openQuickStrategy(template.key)}
                        >
                            <span className='bots__template-icon' aria-hidden='true'>
                                <Icon name='bolt' size={20} />
                            </span>
                            <span className='bots__template-title'>{template.title}</span>
                            <span className='bots__template-description'>{template.description}</span>
                            <span className='bots__template-cta'>
                                <Localize i18n_default_text='Use template' />
                                <Icon name='chevron' size={16} />
                            </span>
                        </button>
                    ))}
                </div>
            </Section>

            <Section
                title={<Localize i18n_default_text='Import and manage' />}
                description={<Localize i18n_default_text='Bring in an XML strategy or keep working on one you have.' />}
            >
                <ActionGrid>
                    <ActionTile
                        icon={<Icon name='download' />}
                        title={<Localize i18n_default_text='From your computer' />}
                        description={<Localize i18n_default_text='Load a saved .xml strategy file' />}
                        onClick={() => openImport('local')}
                    />
                    {is_google_drive_configured && (
                        <ActionTile
                            icon={<Icon name='layers' />}
                            title={<Localize i18n_default_text='From Google Drive' />}
                            description={<Localize i18n_default_text='Open a strategy stored in Drive' />}
                            onClick={() => openImport('google_drive')}
                        />
                    )}
                    <ActionTile
                        icon={<Icon name='puzzle' />}
                        title={<Localize i18n_default_text='Bot builder' />}
                        description={<Localize i18n_default_text='Edit blocks on the canvas' />}
                        onClick={openBuilder}
                    />
                    <ActionTile
                        icon={<Icon name='book' />}
                        title={<Localize i18n_default_text='Learn the blocks' />}
                        description={<Localize i18n_default_text='Tutorials, guides and FAQ' />}
                        onClick={() => navigate(APP_ROUTES.TUTORIALS)}
                    />
                </ActionGrid>
            </Section>

            <div className='bots__note'>
                <Icon name='shield' size={18} />
                <p>
                    <Localize i18n_default_text='Bots are stored in this browser. Export a copy before clearing site data, and always test on a demo account first.' />
                </p>
            </div>

            {/* Confirmation for the delete action above; self-contained, driven by
                load_modal.is_delete_modal_open. */}
            <DeleteDialog />
        </PageShell>
    );
});

export default Bots;
