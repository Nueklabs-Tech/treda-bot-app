import { lazy, Suspense, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import AppLoading from '@/components/loader/app-loading';
import { PageButton, PageShell, Pill, Section, StatGrid, StatTile } from '@/components/page-shell';
import { Icon } from '@/components/page-shell/icons';
import { APP_ROUTES } from '@/constants/routes';
import { api_base } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './chart-page.scss';

const ChartWrapper = lazy(() => import('./chart-wrapper'));

type TActiveSymbol = {
    symbol?: string;
    underlying_symbol?: string;
    display_name?: string;
    market_display_name?: string;
    submarket_display_name?: string;
    exchange_is_open?: 0 | 1;
    pip?: number;
};

/** Granularity is seconds per candle; 0 means the chart is on ticks. */
const getTimeframeLabel = (granularity?: number): string => {
    if (!granularity) return localize('Ticks');

    const minutes = granularity / 60;

    if (minutes < 60) return localize('{{count}} min', { count: minutes });
    if (minutes < 1440) return localize('{{count}} h', { count: minutes / 60 });

    return localize('1 day');
};

const CHART_TYPE_LABELS: Record<string, string> = {
    line: localize('Line'),
    candle: localize('Candles'),
    hollow: localize('Hollow candles'),
    ohlc: localize('OHLC'),
};

const ChartPage = observer(() => {
    const navigate = useNavigate();
    const { connectionStatus } = useApiBase();
    const { chart_store, run_panel } = useStore();
    const { symbol, granularity, chart_type } = chart_store;

    // Digit stats are only meaningful on digit contracts, so they stay opt-in
    // rather than being forced on every market.
    const [show_digits_stats, setShowDigitsStats] = useState(false);

    const active_symbol: TActiveSymbol | undefined = useMemo(() => {
        const symbols = (api_base?.active_symbols ?? []) as TActiveSymbol[];

        return symbols.find(item => (item.underlying_symbol || item.symbol) === symbol);
    }, [symbol]);

    const is_connected = connectionStatus === CONNECTION_STATUS.OPENED;
    const is_market_open = active_symbol?.exchange_is_open !== 0;

    return (
        <PageShell
            className='chart-page'
            title={<Localize i18n_default_text='Chart' />}
            subtitle={
                <Localize i18n_default_text='Live prices for the market your bot trades, with the same feed the trade engine uses.' />
            }
            meta={
                <>
                    <Pill tone={is_connected ? 'success' : 'danger'} has_dot>
                        {is_connected ? (
                            <Localize i18n_default_text='Live feed' />
                        ) : (
                            <Localize i18n_default_text='Reconnecting' />
                        )}
                    </Pill>
                    <Pill tone={is_market_open ? 'success' : 'warning'}>
                        {is_market_open ? (
                            <Localize i18n_default_text='Market open' />
                        ) : (
                            <Localize i18n_default_text='Market closed' />
                        )}
                    </Pill>
                    {run_panel.is_running && (
                        <Pill tone='info' has_dot>
                            <Localize i18n_default_text='Bot running' />
                        </Pill>
                    )}
                </>
            }
            actions={
                <>
                    <PageButton
                        onClick={() => setShowDigitsStats(value => !value)}
                        icon={<Icon name='grid' size={18} />}
                    >
                        {show_digits_stats ? (
                            <Localize i18n_default_text='Hide digit stats' />
                        ) : (
                            <Localize i18n_default_text='Show digit stats' />
                        )}
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
            <StatGrid columns={4}>
                <StatTile
                    label={<Localize i18n_default_text='Asset' />}
                    value={active_symbol?.display_name || symbol || '—'}
                    hint={active_symbol?.submarket_display_name}
                />
                <StatTile
                    label={<Localize i18n_default_text='Market' />}
                    value={active_symbol?.market_display_name || '—'}
                    hint={<Localize i18n_default_text='Change it from the chart title' />}
                />
                <StatTile
                    label={<Localize i18n_default_text='Timeframe' />}
                    value={getTimeframeLabel(granularity)}
                    hint={CHART_TYPE_LABELS[chart_type as string] || chart_type || ''}
                />
                <StatTile
                    label={<Localize i18n_default_text='Pip size' />}
                    value={active_symbol?.pip ?? '—'}
                    hint={<Localize i18n_default_text='Smallest price move' />}
                />
            </StatGrid>

            <div className='chart-page__canvas'>
                <Suspense fallback={<AppLoading message={localize('Please wait, loading chart...')} />}>
                    <ChartWrapper show_digits_stats={show_digits_stats} />
                </Suspense>
            </div>

            <Section
                title={<Localize i18n_default_text='Reading this chart' />}
                description={
                    <Localize i18n_default_text='The chart is independent of your strategy — changing the asset here does not change the asset your bot trades.' />
                }
            >
                <div className='chart-page__tips'>
                    <div className='chart-page__tip'>
                        <span className='chart-page__tip-icon' aria-hidden='true'>
                            <Icon name='candles' size={20} />
                        </span>
                        <div>
                            <p className='chart-page__tip-title'>
                                <Localize i18n_default_text='Pick an asset and timeframe' />
                            </p>
                            <p className='chart-page__tip-text'>
                                <Localize i18n_default_text='Use the chart title to switch markets, and the toolbar to move between ticks, candles and indicators.' />
                            </p>
                        </div>
                    </div>
                    <div className='chart-page__tip'>
                        <span className='chart-page__tip-icon' aria-hidden='true'>
                            <Icon name='grid' size={20} />
                        </span>
                        <div>
                            <p className='chart-page__tip-title'>
                                <Localize i18n_default_text='Digit stats for digit trades' />
                            </p>
                            <p className='chart-page__tip-text'>
                                <Localize i18n_default_text='Turn on digit stats to see the distribution of last digits before building an over/under or matches/differs bot.' />
                            </p>
                        </div>
                    </div>
                    <div className='chart-page__tip'>
                        <span className='chart-page__tip-icon' aria-hidden='true'>
                            <Icon name='gauge' size={20} />
                        </span>
                        <div>
                            <p className='chart-page__tip-title'>
                                <Localize i18n_default_text='Watch a run in context' />
                            </p>
                            <p className='chart-page__tip-text'>
                                <Localize i18n_default_text='Keep the run panel open while a bot trades to line up each contract against the price action here.' />
                            </p>
                        </div>
                    </div>
                </div>
            </Section>
        </PageShell>
    );
});

export default ChartPage;
