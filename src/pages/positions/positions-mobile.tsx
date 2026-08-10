import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { formatDate } from '@/components/shared';
import Money from '@/components/shared_ui/money';
import ContractDetails from '@/components/positions/contract-details';
import FilterDropdown, { TFilterOption } from '@/components/positions/filter-dropdown';
import PositionCard from '@/components/positions/position-card';
import { usePositions } from '@/hooks/usePositions';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './positions-mobile.scss';

type TTab = 'open' | 'closed';

const ALL_TRADE_TYPES = 'all';
const TIME_RANGES: TFilterOption[] = [
    { value: 'all', label: localize('All time') },
    { value: 'today', label: localize('Today') },
    { value: '7d', label: localize('Last 7 days') },
    { value: '30d', label: localize('Last 30 days') },
];

const DAY_MS = 24 * 60 * 60 * 1000;

const isWithinRange = (epoch_seconds: number | undefined, range: string): boolean => {
    if (range === 'all' || !epoch_seconds) return true;

    const age_ms = Date.now() - epoch_seconds * 1000;

    if (range === 'today') return age_ms <= DAY_MS;
    if (range === '7d') return age_ms <= 7 * DAY_MS;
    if (range === '30d') return age_ms <= 30 * DAY_MS;

    return true;
};

/**
 * The mobile Positions screen — matches the handset app's Open/Closed layout
 * rather than the desktop run-panel view this route otherwise renders. Backed
 * by usePositions, which draws on the account's real contracts (manual trades
 * and bot runs alike) rather than any bot-only transaction log.
 */
const PositionsMobile = () => {
    const { client } = useStore();
    const { open_positions, closed_positions, is_loading } = usePositions(client?.currency || 'USD');

    const [tab, setTab] = useState<TTab>('open');
    const [trade_type_filter, setTradeTypeFilter] = useState(ALL_TRADE_TYPES);
    const [trade_mode_filter, setTradeModeFilter] = useState(ALL_TRADE_TYPES);
    const [time_filter, setTimeFilter] = useState('all');
    const [selected_contract_id, setSelectedContractId] = useState<number | null>(null);

    const trade_type_options = useMemo<TFilterOption[]>(() => {
        const labels = [...new Set(open_positions.map(position => position.side_label).filter(Boolean))];

        return [{ value: ALL_TRADE_TYPES, label: localize('All trade types') }, ...labels.map(label => ({ value: label, label }))];
    }, [open_positions]);

    const trade_mode_options = useMemo<TFilterOption[]>(() => {
        const labels = [...new Set(closed_positions.map(position => position.side_label).filter(Boolean))];

        return [{ value: ALL_TRADE_TYPES, label: localize('All trade modes') }, ...labels.map(label => ({ value: label, label }))];
    }, [closed_positions]);

    const filtered_open = useMemo(
        () =>
            trade_type_filter === ALL_TRADE_TYPES
                ? open_positions
                : open_positions.filter(position => position.side_label === trade_type_filter),
        [open_positions, trade_type_filter]
    );

    const filtered_closed = useMemo(
        () =>
            closed_positions.filter(position => {
                if (trade_mode_filter !== ALL_TRADE_TYPES && position.side_label !== trade_mode_filter) return false;

                return isWithinRange(position.sell_time ?? position.date_start, time_filter);
            }),
        [closed_positions, trade_mode_filter, time_filter]
    );

    const total_open_profit = filtered_open.reduce((sum, position) => sum + position.profit, 0);

    const closed_groups = useMemo(() => {
        const groups = new Map<string, typeof filtered_closed>();

        filtered_closed.forEach(position => {
            const key = formatDate(position.sell_time ?? position.date_start, 'DD MMM YYYY');
            groups.set(key, [...(groups.get(key) ?? []), position]);
        });

        return [...groups.entries()];
    }, [filtered_closed]);

    if (selected_contract_id !== null) {
        return <ContractDetails contract_id={selected_contract_id} onBack={() => setSelectedContractId(null)} />;
    }

    return (
        <div className='positions-mobile'>
            <div className='positions-mobile__tabs' role='tablist'>
                <button
                    type='button'
                    role='tab'
                    aria-selected={tab === 'open'}
                    className={clsx('positions-mobile__tab', { 'positions-mobile__tab--active': tab === 'open' })}
                    onClick={() => setTab('open')}
                >
                    <Localize i18n_default_text='Open' />
                </button>
                <button
                    type='button'
                    role='tab'
                    aria-selected={tab === 'closed'}
                    className={clsx('positions-mobile__tab', { 'positions-mobile__tab--active': tab === 'closed' })}
                    onClick={() => setTab('closed')}
                >
                    <Localize i18n_default_text='Closed' />
                </button>
            </div>

            {tab === 'open' ? (
                <>
                    <div className='positions-mobile__filters'>
                        <FilterDropdown
                            label={localize('Trade types')}
                            options={trade_type_options}
                            value={trade_type_filter}
                            onChange={setTradeTypeFilter}
                        />
                    </div>

                    <div className='positions-mobile__total'>
                        <span className='positions-mobile__total-label'>
                            <Localize i18n_default_text='Total profit/loss:' />
                        </span>
                        <span
                            className={clsx(
                                'positions-mobile__total-value',
                                total_open_profit >= 0
                                    ? 'positions-mobile__total-value--win'
                                    : 'positions-mobile__total-value--loss'
                            )}
                        >
                            <Money amount={total_open_profit} currency={client?.currency || 'USD'} has_sign show_currency />
                        </span>
                    </div>

                    <div className='positions-mobile__list'>
                        {!is_loading && filtered_open.length === 0 && (
                            <p className='positions-mobile__empty'>
                                <Localize i18n_default_text='No open positions.' />
                            </p>
                        )}
                        {filtered_open.map(position => (
                            <PositionCard
                                key={position.contract_id}
                                position={position}
                                variant='open'
                                onClick={() => setSelectedContractId(position.contract_id)}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className='positions-mobile__filters'>
                        <FilterDropdown
                            label={localize('All time')}
                            options={TIME_RANGES}
                            value={time_filter}
                            onChange={setTimeFilter}
                        />
                        <FilterDropdown
                            label={localize('Trade modes')}
                            options={trade_mode_options}
                            value={trade_mode_filter}
                            onChange={setTradeModeFilter}
                        />
                    </div>

                    <div className='positions-mobile__list'>
                        {!is_loading && closed_groups.length === 0 && (
                            <p className='positions-mobile__empty'>
                                <Localize i18n_default_text='No closed positions yet.' />
                            </p>
                        )}
                        {closed_groups.map(([date, positions]) => (
                            <div className='positions-mobile__group' key={date}>
                                <h3 className='positions-mobile__group-title'>{date}</h3>
                                {positions.map(position => (
                                    <PositionCard
                                        key={position.contract_id}
                                        position={position}
                                        variant='closed'
                                        onClick={() => setSelectedContractId(position.contract_id)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PositionsMobile;
