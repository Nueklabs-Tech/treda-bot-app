// @ts-nocheck — vendored bot code with known upstream type gaps; see AGENTS.md
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { Outlet, useLocation } from 'react-router-dom';
import { STANDALONE_ROUTES } from '@/constants/routes';
import { api_base, ApiHelpers, ServerTime } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useIsReauthorizing } from '@/hooks/useAuthBootstrap';
import { useStore } from '@/hooks/useStore';
import { setSmartChartsPublicPath } from '@deriv-com/smartcharts-champion';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import BootLoader from '../loader/boot-loader';
import { crypto_currencies_display_order, fiat_currencies_display_order, getUrlBase } from '../shared';
import BottomNav from './bottom-nav';
import Footer from './footer';
import AppHeader from './header';
import Body from './main-body';
import './layout.scss';

const Layout = observer(() => {
    const { isDesktop } = useDevice();
    const store = useStore();
    const { connectionStatus } = useApiBase();
    const is_quick_strategy_active = store?.quick_strategy?.is_open;
    const isCallbackPage = window.location.pathname === '/callback';
    // The profile and wallet screens are standalone mobile-app style pages: each
    // carries its own dark hero and back button, so on mobile the app header would
    // double up. On desktop the header is the only navigation there is, so it stays.
    const { pathname } = useLocation();
    const isStandalonePage = !isDesktop && STANDALONE_ROUTES.includes(pathname);

    const checkClientAccount = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
    const getQueryParams = new URLSearchParams(window.location.search);
    const currency = getQueryParams.get('account') ?? '';
    const accountsList = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
    const isClientAccountsPopulated = Object.keys(accountsList).length > 0;
    const ifClientAccountHasCurrency =
        Object.values(checkClientAccount).some((account: any) => account.currency === currency) ||
        currency === 'demo' ||
        currency === '';
    const [clientHasCurrency, setClientHasCurrency] = useState(ifClientAccountHasCurrency);

    // The initial session is already resolved by AuthBootstrapGate; the only
    // loading state left here is an account switch, which drops the socket and
    // re-authorizes.
    const is_reauthorizing = useIsReauthorizing(store?.client?.is_account_regenerating);

    // Standalone routes never mount AppContent either, which is the only other
    // place SmartCharts' public path gets set. Without it, the library's lazily
    // loaded chunks (e.g. flutter-chart-loader, lz-string) resolve against the
    // page's own origin instead of /js/smartcharts/, 404 into the SPA's HTML
    // fallback, and fail to parse as JS.
    useEffect(() => {
        setSmartChartsPublicPath(getUrlBase('/js/smartcharts/'));
    }, []);

    // Standalone routes (trade, profile, wallet, positions) render directly
    // under this Layout and never mount AppContent, which is the only other
    // place that bootstraps ApiHelpers/ServerTime for the bot-skeleton services
    // the SmartCharts adapter depends on. Without this, a route reached without
    // first visiting the dashboard fails chart data fetching forever with
    // "ApiHelpers not initialized". Every call here is idempotent, so this is
    // safe to run alongside AppContent's own copy on the dashboard route.
    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) return;

        const { app, common } = store;
        if (!app || !common) return;

        ServerTime.init(common);
        app.setDBotEngineStores();
        ApiHelpers.setInstance(app.api_helpers_store);
    }, [connectionStatus, store]);

    useEffect(() => {
        (window as any).setClientHasCurrency = setClientHasCurrency;

        return () => {
            delete (window as any).setClientHasCurrency;
        };
    }, []);

    const validCurrencies = [...fiat_currencies_display_order, ...crypto_currencies_display_order];
    const query_currency = (getQueryParams.get('account') ?? '')?.toUpperCase();
    const isCurrencyValid = validCurrencies.includes(query_currency);
    const api_accounts: any[][] = [];
    let subscription: { unsubscribe: () => void };

    const validateApiAccounts = ({ data }: any) => {
        if (data.msg_type === 'authorize') {
            const account_list = data?.authorize?.account_list || [];
            const account_list_filter = account_list.filter((acc: any) => acc.is_disabled === 0);
            api_accounts.push(account_list_filter || []);
            const allCurrencies = new Set(Object.values(checkClientAccount).map((acc: any) => acc.currency));

            // Skip disabled accounts when checking for missing currency
            const accounts = api_accounts.flat();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let detected_currency = '';
            const hasMissingCurrency = accounts.some(data => {
                if (!allCurrencies.has(data.currency)) {
                    sessionStorage.setItem('query_param_currency', data.currency);
                    return true;
                }
                detected_currency = data.currency;
                return false;
            });

            let hasMissingToken = false;
            let missingTokenCurrency = '';

            for (const acc of account_list_filter) {
                if (acc.loginid && !accountsList[acc.loginid]) {
                    hasMissingToken = true;
                    missingTokenCurrency = acc.currency || '';
                    // Store the missing token's currency in session storage
                    if (missingTokenCurrency) {
                        sessionStorage.setItem('query_param_currency', missingTokenCurrency);
                    }
                    break;
                }
            }

            if (hasMissingCurrency || hasMissingToken) {
                setClientHasCurrency(false);
            } else {
                const account_list_ =
                    account_list_filter?.find((acc: { currency: string }) => acc.currency === currency) ||
                    account_list_filter?.[0];

                let session_storage_currency =
                    sessionStorage.getItem('query_param_currency') || account_list_?.currency || 'USD';

                session_storage_currency = `account=${session_storage_currency}`;
                setClientHasCurrency(true);
                if (!new URLSearchParams(window.location.search).has('account')) {
                    window.history.pushState({}, '', `${window.location.pathname}?${session_storage_currency}`);
                }

                setClientHasCurrency(true);
            }

            if (subscription) {
                subscription?.unsubscribe();
            }
        }
    };

    useEffect(() => {
        if (isCurrencyValid && api_base.api) {
            // Subscribe to the onMessage event
            const is_valid_currency = currency && validCurrencies.includes(currency.toUpperCase());
            if (!is_valid_currency) return;
            subscription = api_base.api.onMessage().subscribe(validateApiAccounts);
        }
    }, []);

    useEffect(() => {
        // Always set the currency in session storage, even if the user is not logged in
        // This ensures the currency is available on the callback page
        if (currency) {
            sessionStorage.setItem('query_param_currency', currency);
        }
    }, [isClientAccountsPopulated, isCallbackPage, clientHasCurrency, currency]);

    if (is_reauthorizing) return <BootLoader message={localize('Switching account')} />;

    return (
        <div
            className={clsx('layout', {
                responsive: isDesktop,
                'quick-strategy-active': is_quick_strategy_active && !isDesktop,
            })}
        >
            {!isCallbackPage && !isStandalonePage && <AppHeader />}
            <Body>
                <Outlet />
            </Body>
            {!isCallbackPage && isDesktop && <Footer />}
            {/* Fixed mobile tab bar; renders itself only for a signed-in mobile session. */}
            {!isCallbackPage && <BottomNav />}
        </div>
    );
});

export default Layout;
