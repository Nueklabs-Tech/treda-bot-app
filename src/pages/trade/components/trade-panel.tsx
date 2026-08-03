import { useState } from 'react';
import clsx from 'clsx';
import { addComma, getCurrencyDisplayCode, getDecimalPlaces } from '@/components/shared';
import { TTradeTypeConfig } from '@/constants/trade';
import { TProposalState } from '@/hooks/useProposal';
import { TApiError } from '@/utils/api-subscription';
import { Localize, localize } from '@deriv-com/translations';
import BarrierSheet from './barrier-sheet';
import DurationSheet, { TDuration } from './duration-sheet';
import StakeSheet from './stake-sheet';

type TTradePanelProps = {
    config: TTradeTypeConfig;
    contract_type: string;
    onContractTypeChange: (contract_type: string) => void;
    duration: TDuration;
    onDurationChange: (duration: TDuration) => void;
    stake: string;
    onStakeChange: (stake: string) => void;
    barrier: string;
    onBarrierChange: (barrier: string) => void;
    currency: string;
    proposal_state: TProposalState;
    /** False while the parameters cannot be priced at all (no stake, no session). */
    is_pricing_enabled: boolean;
    is_authorized: boolean;
    is_market_open: boolean;
    is_buying: boolean;
    buy_error: TApiError | null;
    is_expanded: boolean;
    onToggleExpanded: () => void;
    onBuy: () => void;
    onLogin: () => void;
};

const formatMoney = (amount: number, currency: string) =>
    addComma(Number(amount || 0).toFixed(getDecimalPlaces(currency || 'USD')));

/** Long-form unit names for the duration card, keyed by the API's unit codes. */
const DURATION_UNIT_LABELS: Record<string, string> = {
    t: localize('ticks'),
    s: localize('seconds'),
    m: localize('minutes'),
    h: localize('hours'),
    d: localize('days'),
};

/**
 * The trade ticket: which way, for how long, for how much, and what it pays.
 *
 * It collapses to just the direction toggle and the buy button, because on a
 * handset the parameters are set once and then the chart is what the user wants
 * the screen for. Every parameter opens a bottom sheet rather than an inline
 * control — a 44px tap target and a sheet beats a stepper squeezed into a card.
 */
const TradePanel = ({
    config,
    contract_type,
    onContractTypeChange,
    duration,
    onDurationChange,
    stake,
    onStakeChange,
    barrier,
    onBarrierChange,
    currency,
    proposal_state,
    is_pricing_enabled,
    is_authorized,
    is_market_open,
    is_buying,
    buy_error,
    is_expanded,
    onToggleExpanded,
    onBuy,
    onLogin,
}: TTradePanelProps) => {
    const [open_sheet, setOpenSheet] = useState<'duration' | 'stake' | 'barrier' | null>(null);
    const { proposal, error, is_loading } = proposal_state;

    const side = config.sides.find(item => item.value === contract_type) ?? config.sides[0];
    const message = buy_error?.message || error?.message;
    const can_buy = Boolean(proposal) && is_authorized && is_market_open && !is_buying;

    /**
     * The line under the buy label. A stale payout is kept on screen while the
     * next one is being fetched — the alternative is a number that blinks away
     * every time the stake changes by a digit.
     */
    const renderPayout = () => {
        if (!is_market_open) return <Localize i18n_default_text='Market closed' />;
        if (proposal) {
            return (
                <Localize
                    i18n_default_text='Payout {{payout}} {{currency}}'
                    values={{
                        payout: formatMoney(proposal.payout, currency),
                        currency: getCurrencyDisplayCode(currency),
                    }}
                />
            );
        }
        if (!is_pricing_enabled && !is_loading) return <Localize i18n_default_text='Set a stake to see the payout' />;
        if (error) return <Localize i18n_default_text='No price for these parameters' />;

        return <Localize i18n_default_text='Getting price…' />;
    };

    return (
        <section className={clsx('trade-panel', { 'trade-panel--expanded': is_expanded })}>
            <button
                type='button'
                className='trade-panel__handle'
                onClick={onToggleExpanded}
                aria-expanded={is_expanded}
                aria-label={is_expanded ? localize('Hide trade parameters') : localize('Show trade parameters')}
            >
                <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'
                >
                    <path d='m6 15 6-6 6 6' />
                </svg>
            </button>

            <div className='trade-panel__sides' role='group' aria-label={localize('Contract direction')}>
                {config.sides.map(item => (
                    <button
                        key={item.value}
                        type='button'
                        className={clsx('trade-panel__side', `trade-panel__side--${item.tone}`, {
                            'trade-panel__side--active': item.value === side.value,
                        })}
                        aria-pressed={item.value === side.value}
                        onClick={() => onContractTypeChange(item.value)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {is_expanded && (
                <div className='trade-panel__params'>
                    <button type='button' className='trade-panel__param' onClick={() => setOpenSheet('duration')}>
                        <span className='trade-panel__param-label'>
                            <Localize i18n_default_text='Duration' />
                        </span>
                        <span className='trade-panel__param-value'>
                            {duration.value} {DURATION_UNIT_LABELS[duration.unit] ?? duration.unit}
                        </span>
                    </button>

                    <button type='button' className='trade-panel__param' onClick={() => setOpenSheet('stake')}>
                        <span className='trade-panel__param-label'>
                            <Localize i18n_default_text='Stake' />
                        </span>
                        <span className='trade-panel__param-value'>
                            {stake || '—'} {getCurrencyDisplayCode(currency)}
                        </span>
                    </button>

                    {config.barrier && (
                        <button type='button' className='trade-panel__param' onClick={() => setOpenSheet('barrier')}>
                            <span className='trade-panel__param-label'>
                                {config.barrier === 'digit' ? (
                                    <Localize i18n_default_text='Last digit' />
                                ) : (
                                    <Localize i18n_default_text='Barrier' />
                                )}
                            </span>
                            <span className='trade-panel__param-value'>{barrier}</span>
                        </button>
                    )}
                </div>
            )}

            {message && <p className='trade-panel__message'>{message}</p>}

            {is_authorized ? (
                <button
                    type='button'
                    className={clsx('trade-panel__buy', `trade-panel__buy--${side.tone}`)}
                    onClick={onBuy}
                    disabled={!can_buy}
                >
                    <span className='trade-panel__buy-label'>
                        {is_buying ? <Localize i18n_default_text='Buying…' /> : side.label}
                    </span>
                    <span className='trade-panel__buy-payout'>{renderPayout()}</span>
                </button>
            ) : (
                <button type='button' className='trade-panel__buy trade-panel__buy--up' onClick={onLogin}>
                    <span className='trade-panel__buy-label'>
                        <Localize i18n_default_text='Log in to trade' />
                    </span>
                </button>
            )}

            <DurationSheet
                is_open={open_sheet === 'duration'}
                onClose={() => setOpenSheet(null)}
                durations={config.durations}
                duration={duration}
                onChange={onDurationChange}
            />
            <StakeSheet
                is_open={open_sheet === 'stake'}
                onClose={() => setOpenSheet(null)}
                stake={stake}
                currency={currency}
                onChange={onStakeChange}
            />
            {config.barrier && (
                <BarrierSheet
                    is_open={open_sheet === 'barrier'}
                    onClose={() => setOpenSheet(null)}
                    kind={config.barrier}
                    barrier={barrier}
                    onChange={onBarrierChange}
                />
            )}
        </section>
    );
};

export default TradePanel;
