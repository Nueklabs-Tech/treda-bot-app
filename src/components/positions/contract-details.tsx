import { Icon } from '@/components/page-shell/icons';
import { formatDate, formatTime } from '@/components/shared';
import Money from '@/components/shared_ui/money';
import { getSideLabel } from '@/constants/trade';
import { formatCountdown } from '@/hooks/useCountdown';
import { useOpenContract } from '@/hooks/useOpenContract';
import { TPosition } from '@/hooks/usePositions';
import { Localize, localize } from '@deriv-com/translations';
import ContractChart, { TChartTick } from './contract-chart';
import ContractDetailsSkeleton from './contract-details-skeleton';
import PositionCard from './position-card';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './contract-details.scss';

type TContractDetailsProps = {
    contract_id: number;
    onBack: () => void;
};

type TDetailRow = { label: string; value: string };
/** A row whose value is a bold primary line plus one or more muted lines underneath (e.g. a value, then its date and time). */
type TStackedDetailRow = { label: string; value: string; meta?: string[] };

/** The tick path used to draw the chart: settled contracts carry it in `audit_details`, open tick contracts in `tick_stream`. */
const getChartTicks = (contract: ReturnType<typeof useOpenContract>['contract']): TChartTick[] => {
    if (!contract) return [];

    const audit_ticks = contract.audit_details?.all_ticks
        ?.filter(point => typeof point.epoch === 'number' && typeof point.tick === 'number')
        .map(point => ({ epoch: point.epoch as number, tick: point.tick as number }));

    if (audit_ticks?.length) return audit_ticks;

    return (contract.tick_stream ?? []).map(point => ({ epoch: point.epoch, tick: point.tick }));
};

/**
 * The chart and order breakdown for a single contract — reachable by tapping a
 * card on the Positions screen. Rendered as an in-place view rather than a
 * route, so the tab bar and the list underneath stay put; "Back" just clears
 * the selection.
 */
const ContractDetails = ({ contract_id, onBack }: TContractDetailsProps) => {
    const { contract } = useOpenContract(contract_id);

    if (!contract) {
        return (
            <div className='contract-details'>
                <header className='contract-details__header'>
                    <button type='button' className='contract-details__back' onClick={onBack} aria-label={localize('Back')}>
                        <Icon name='chevron' size={20} className='contract-details__back-icon' />
                    </button>
                    <h1 className='contract-details__title'>
                        <Localize i18n_default_text='Contract details' />
                    </h1>
                </header>
                <ContractDetailsSkeleton />
            </div>
        );
    }

    const is_sold = Boolean(contract.is_sold);
    const is_win = Number(contract.profit ?? 0) >= 0;

    const position: TPosition = {
        contract_id,
        symbol: contract.underlying ?? '',
        display_name: contract.display_name || contract.underlying || '',
        contract_type: contract.contract_type,
        side_label: getSideLabel(contract.contract_type),
        buy_price: Number(contract.buy_price) || 0,
        payout: Number(contract.payout) || 0,
        profit: Number(contract.profit) || 0,
        currency: contract.currency,
        date_start: contract.date_start,
        date_expiry: contract.date_expiry,
        sell_time: contract.sell_time ?? null,
        tick_count: contract.tick_count,
        is_sold,
    };

    const duration =
        contract.tick_count && contract.tick_count > 0
            ? localize('{{count}} Ticks', { count: contract.tick_count })
            : contract.date_start && contract.date_expiry
              ? formatCountdown(contract.date_expiry - contract.date_start)
              : '—';

    const order_rows: TDetailRow[] = [
        {
            label: localize('Reference ID'),
            value: [
                contract.transaction_ids?.buy ? localize('{{id}} (Buy)', { id: contract.transaction_ids.buy }) : '',
                contract.transaction_ids?.sell ? localize('{{id}} (Sell)', { id: contract.transaction_ids.sell }) : '',
            ]
                .filter(Boolean)
                .join('\n'),
        },
        { label: localize('Duration'), value: duration },
        ...(contract.barrier ? [{ label: localize('Barrier'), value: contract.barrier }] : []),
    ];

    const exit_epoch = contract.exit_tick_time ?? contract.sell_time ?? undefined;

    /** date/time pair shown as the muted line(s) under a row's primary value. */
    const dateTimeMeta = (epoch?: number | null): string[] | undefined =>
        epoch ? [formatDate(epoch, 'DD MMM YYYY'), formatTime(epoch, 'HH:mm:ss [GMT]')] : undefined;

    const entry_exit_rows: TStackedDetailRow[] = [
        ...(contract.date_start
            ? [
                  {
                      label: localize('Start time'),
                      value: formatDate(contract.date_start, 'DD MMM YYYY'),
                      meta: [formatTime(contract.date_start, 'HH:mm:ss [GMT]')],
                  },
              ]
            : []),
        {
            label: localize('Entry spot'),
            value: contract.entry_spot_display_value ?? (contract.entry_spot != null ? String(contract.entry_spot) : '—'),
            meta: dateTimeMeta(contract.entry_tick_time),
        },
        ...(is_sold && exit_epoch
            ? [
                  {
                      label: localize('Exit time'),
                      value: formatDate(exit_epoch, 'DD MMM YYYY'),
                      meta: [formatTime(exit_epoch, 'HH:mm:ss [GMT]')],
                  },
              ]
            : []),
        ...(is_sold
            ? [
                  {
                      label: localize('Exit spot'),
                      value:
                          contract.exit_tick_display_value ?? (contract.exit_tick != null ? String(contract.exit_tick) : '—'),
                      meta: dateTimeMeta(exit_epoch),
                  },
              ]
            : []),
    ];

    const ticks = getChartTicks(contract);
    const barrier = contract.barrier ? Number(contract.barrier) : undefined;

    return (
        <div className='contract-details'>
            <header className='contract-details__header'>
                <button type='button' className='contract-details__back' onClick={onBack} aria-label={localize('Back')}>
                    <Icon name='chevron' size={20} className='contract-details__back-icon' />
                </button>
                <h1 className='contract-details__title'>
                    <Localize i18n_default_text='Contract details' />
                </h1>
            </header>

            <div className='contract-details__body'>
                <PositionCard position={position} variant={is_sold ? 'closed' : 'open'} />

                {ticks.length > 1 && (
                    <ContractChart
                        ticks={ticks}
                        entry_epoch={contract.entry_tick_time ?? contract.date_start}
                        entry_spot={contract.entry_spot ?? undefined}
                        exit_epoch={is_sold ? (contract.exit_tick_time ?? contract.sell_time ?? undefined) : undefined}
                        exit_spot={is_sold ? (contract.exit_tick ?? undefined) : undefined}
                        barrier={barrier}
                        is_win={is_win}
                    />
                )}

                <section className='contract-details__section'>
                    <h2 className='contract-details__section-title'>
                        <Localize i18n_default_text='Order Details' />
                    </h2>
                    <dl className='contract-details__list'>
                        {order_rows.map(row => (
                            <div className='contract-details__row' key={row.label}>
                                <dt>{row.label}</dt>
                                <dd>{row.value}</dd>
                            </div>
                        ))}
                        <div className='contract-details__row'>
                            <dt>
                                <Localize i18n_default_text='Stake' />
                            </dt>
                            <dd>
                                <Money amount={position.buy_price} currency={position.currency} show_currency />
                            </dd>
                        </div>
                        <div className='contract-details__row'>
                            <dt>
                                <Localize i18n_default_text='Potential payout' />
                            </dt>
                            <dd>{position.payout}</dd>
                        </div>
                    </dl>
                </section>

                <section className='contract-details__section'>
                    <h2 className='contract-details__section-title'>
                        <Localize i18n_default_text='Entry & exit details' />
                    </h2>
                    <dl className='contract-details__list'>
                        {entry_exit_rows.map(row => (
                            <div className='contract-details__row' key={row.label}>
                                <dt>{row.label}</dt>
                                <dd>
                                    <span className='contract-details__row-value'>{row.value}</span>
                                    {row.meta?.map(line => (
                                        <span className='contract-details__row-meta' key={line}>
                                            {line}
                                        </span>
                                    ))}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            </div>
        </div>
    );
};

export default ContractDetails;
