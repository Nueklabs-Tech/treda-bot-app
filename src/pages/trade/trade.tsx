import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import AppLoading from '@/components/loader/app-loading';
import { generateOAuthURL } from '@/components/shared';
import {
    getChartType,
    getGranularity,
    getInterval,
    getSmartChartType,
    getTradeTypeConfig,
    STAKE_LIMITS,
} from '@/constants/trade';
import { api_base } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useOpenContract } from '@/hooks/useOpenContract';
import { useProposal } from '@/hooks/useProposal';
import { useStore } from '@/hooks/useStore';
import { useTickStream } from '@/hooks/useTickStream';
import { useTradeUrlParams } from '@/hooks/useTradeUrlParams';
import { TApiError } from '@/utils/api-subscription';
import { localize } from '@deriv-com/translations';
import ActiveContract from './components/active-contract';
import { TDuration } from './components/duration-sheet';
import SymbolHeader from './components/symbol-header';
import SymbolSheet from './components/symbol-sheet';
import TradePanel from './components/trade-panel';
import TradeTypeTabs from './components/trade-type-tabs';
import { getSymbolCode, TActiveSymbol } from './types';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './trade.scss';

const ChartWrapper = lazy(() => import('../chart/chart-wrapper'));

/**
 * The trade screen — the app's manual counterpart to the bot: a market, a chart
 * and a ticket, on one handset-sized screen.
 *
 * Its whole state lives in the query string (see useTradeUrlParams), and the
 * chart is the same SmartCharts instance the rest of the app uses, driven
 * through `chart_store`. The two are kept in step in both directions: the URL
 * wins on arrival, and a change made with the chart's own toolbar (interval,
 * chart type) is written back to the URL so the link still describes the screen.
 */
const Trade = observer(() => {
    const { params, setParams } = useTradeUrlParams();
    const { chart_store, client, run_panel } = useStore();
    const { connectionStatus, isAuthorized } = useApiBase();

    const config = useMemo(() => getTradeTypeConfig(params.trade_type), [params.trade_type]);

    const [contract_type, setContractType] = useState(config.sides[0].value);
    const [duration, setDuration] = useState<TDuration>({
        value: config.durations[0].default,
        unit: config.durations[0].unit,
    });
    const [stake, setStake] = useState(String(STAKE_LIMITS.default));
    const [barrier, setBarrier] = useState(config.default_barrier ?? '');
    const [is_panel_expanded, setIsPanelExpanded] = useState(true);
    const [is_symbol_sheet_open, setIsSymbolSheetOpen] = useState(false);

    const [active_symbols, setActiveSymbols] = useState<TActiveSymbol[]>(
        () => (api_base?.active_symbols as TActiveSymbol[]) ?? []
    );
    const [is_buying, setIsBuying] = useState(false);
    const [buy_error, setBuyError] = useState<TApiError | null>(null);
    /** The contract being followed, or null once the user dismisses its card. */
    const [contract_id, setContractId] = useState<number | null>(null);

    const currency = client.currency || 'USD';
    const is_connected = connectionStatus === CONNECTION_STATUS.OPENED;

    // A trade type change can invalidate the parameters carried over from the
    // previous one (a digit contract has no minutes; rise/fall has no barrier),
    // so they are reset to what this contract actually accepts.
    useEffect(() => {
        setContractType(config.sides[0].value);
        setDuration({ value: config.durations[0].default, unit: config.durations[0].unit });
        setBarrier(config.default_barrier ?? '');
    }, [config]);

    useEffect(() => {
        if (active_symbols.length || !is_connected) return;

        let is_current = true;

        api_base
            .getActiveSymbols()
            .then((symbols: TActiveSymbol[]) => {
                if (is_current && Array.isArray(symbols)) setActiveSymbols(symbols);
            })
            .catch(() => {
                /* the header falls back to the raw symbol code */
            });

        return () => {
            is_current = false;
        };
    }, [active_symbols.length, is_connected]);

    // URL -> chart. The URL is the source of truth on arrival and on every
    // subsequent navigation, including Back.
    useEffect(() => {
        const granularity = getGranularity(params.interval);
        const smartchart_type = getSmartChartType(params.chart_type);

        if (chart_store.symbol !== params.symbol) chart_store.onSymbolChange(params.symbol);
        if (chart_store.granularity !== granularity) chart_store.updateGranularity(granularity);
        if (chart_store.chart_type !== smartchart_type) chart_store.updateChartType(smartchart_type);
    }, [chart_store, params.chart_type, params.interval, params.symbol]);

    // Chart -> URL, for the changes made with SmartCharts' own toolbar. Both
    // effects only write when the two sides disagree, so they settle rather than
    // ping-pong.
    useEffect(() => {
        if (!chart_store.symbol) return;

        const next = {
            symbol: chart_store.symbol,
            interval: getInterval(chart_store.granularity),
            chart_type: getChartType(chart_store.chart_type),
        };

        if (
            next.symbol === params.symbol &&
            next.interval === params.interval &&
            next.chart_type === params.chart_type
        ) {
            return;
        }

        setParams(next, { replace: true });
    }, [chart_store.symbol, chart_store.granularity, chart_store.chart_type, params, setParams]);

    const active_symbol = useMemo(
        () => active_symbols.find(symbol => getSymbolCode(symbol) === params.symbol),
        [active_symbols, params.symbol]
    );
    const is_market_open = active_symbol?.exchange_is_open !== 0;

    const spot = useTickStream(is_market_open ? params.symbol : '');

    const amount = Number(stake);
    const is_stake_valid = !Number.isNaN(amount) && amount >= STAKE_LIMITS.min && amount <= STAKE_LIMITS.max;

    // Prices are only requested for a signed-in session: the account is what
    // decides the currency a payout is quoted in, so quoting before there is one
    // would put a number on screen in a currency the user may not hold.
    const proposal_request = useMemo(() => {
        if (!isAuthorized || !is_stake_valid || !params.symbol || !is_market_open) return null;

        return {
            symbol: params.symbol,
            contract_type,
            amount,
            currency,
            duration: duration.value,
            duration_unit: duration.unit,
            ...(config.barrier ? { barrier } : {}),
        };
    }, [
        amount,
        barrier,
        config.barrier,
        contract_type,
        currency,
        duration,
        isAuthorized,
        is_market_open,
        is_stake_valid,
        params.symbol,
    ]);

    const proposal_state = useProposal(proposal_request);
    const { contract } = useOpenContract(contract_id);

    const handleBuy = useCallback(async () => {
        const proposal = proposal_state.proposal;

        if (!proposal || !api_base.api) return;

        setIsBuying(true);
        setBuyError(null);
        setContractId(null);

        try {
            const response: any = await api_base.api.send({ buy: proposal.id, price: proposal.ask_price });

            setContractId(response?.buy?.contract_id ?? null);
        } catch (error: any) {
            setBuyError(error?.error ?? { message: error?.message ?? localize('Could not place the trade.') });
        } finally {
            setIsBuying(false);
        }
    }, [proposal_state.proposal]);

    const handleLogin = useCallback(async () => {
        const oauth_url = await generateOAuthURL();

        if (oauth_url) window.location.replace(oauth_url);
    }, []);

    const has_open_ticket = is_buying || contract_id !== null;

    return (
        <div className='trade'>
            <TradeTypeTabs value={params.trade_type} onSelect={trade_type => setParams({ trade_type })} />

            <SymbolHeader
                symbol={params.symbol}
                display_name={active_symbol?.display_name || params.symbol}
                submarket_name={active_symbol?.submarket_display_name}
                is_market_open={is_market_open}
                spot={spot}
                onOpenSymbolPicker={() => setIsSymbolSheetOpen(true)}
            />

            <div className='trade__chart'>
                <Suspense fallback={<AppLoading message={localize('Please wait, loading chart...')} />}>
                    <ChartWrapper prefix='trade-chart' show_digits_stats={false} show_top_widgets={false} />
                </Suspense>
            </div>

            {has_open_ticket && (
                <ActiveContract contract={contract} currency={currency} onDismiss={() => setContractId(null)} />
            )}

            {run_panel.is_running && (
                <p className='trade__bot-notice'>
                    {localize('A bot is running on this account. Trades you place here are separate from it.')}
                </p>
            )}

            <TradePanel
                config={config}
                contract_type={contract_type}
                onContractTypeChange={setContractType}
                duration={duration}
                onDurationChange={setDuration}
                stake={stake}
                onStakeChange={setStake}
                barrier={barrier}
                onBarrierChange={setBarrier}
                currency={currency}
                proposal_state={proposal_state}
                is_pricing_enabled={proposal_request !== null}
                is_authorized={isAuthorized}
                is_market_open={is_market_open}
                is_buying={is_buying}
                buy_error={buy_error}
                is_expanded={is_panel_expanded}
                onToggleExpanded={() => setIsPanelExpanded(value => !value)}
                onBuy={handleBuy}
                onLogin={handleLogin}
            />

            <SymbolSheet
                is_open={is_symbol_sheet_open}
                onClose={() => setIsSymbolSheetOpen(false)}
                symbols={active_symbols}
                active_symbol={params.symbol}
                onSelect={symbol => setParams({ symbol })}
            />
        </div>
    );
});

export default Trade;
