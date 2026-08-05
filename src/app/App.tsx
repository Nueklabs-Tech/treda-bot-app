import { lazy, Suspense, useEffect } from 'react';
import React from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Navigate,
    Route,
    RouterProvider,
    useNavigate,
} from 'react-router-dom';
import BootLoader from '@/components/loader/boot-loader';
import SkeletonLoader from '@/components/loader/skeleton-loader';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { APP_ROUTES } from '@/constants/routes';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useLanguageFromURL } from '@/hooks/useLanguageFromURL';
import { StoreProvider, useStore } from '@/hooks/useStore';
import { consumeOAuthReturn } from '@/services/auth-bootstrap';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { getOAuthRedirectPath } from '@/utils/oauth-redirect';
import { localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import i18nInstance from './i18n';
//@ts-ignore
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const Profile = lazy(() => import('../pages/profile'));
const Wallet = lazy(() => import('../pages/wallet'));
const Positions = lazy(() => import('../pages/positions'));
const Trade = lazy(() => import('../pages/trade'));

const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
};

const OAuthReturnRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!consumeOAuthReturn()) return;

        navigate({ pathname: '/', search: window.location.search, hash: window.location.hash }, { replace: true });
    }, [navigate]);

    return null;
};

const AuthBootstrapGate = ({ children }: { children: React.ReactNode }) => {
    const store = useStore();
    const is_auth_ready = useAuthBootstrap(Boolean(store));

    if (!is_auth_ready) return <BootLoader message={localize('Connecting to your trading account')} />;

    return (
        <>
            <OAuthReturnRedirect />
            {children}
        </>
    );
};

const routerBasename = isPreviewMode() ? PREVIEW_BASE_PATH : undefined;

const getOAuthCallbackRoute = (): string | null => {
    let path = getOAuthRedirectPath();

    if (routerBasename && path.startsWith(routerBasename)) path = path.slice(routerBasename.length);

    const route = path.replace(/^\/+|\/+$/g, '');

    return route && route !== 'preview' ? route : null;
};

const oauthCallbackRoute = getOAuthCallbackRoute();

const appRootRoute = <AppRoot />;

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense fallback={<BootLoader />}>
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <LanguageHandler>
                            <StoreProvider>
                                <LocalStorageSyncWrapper>
                                    <RoutePromptDialog />
                                    <AuthBootstrapGate>
                                        <CoreStoreProvider>
                                            <Layout />
                                        </CoreStoreProvider>
                                    </AuthBootstrapGate>
                                </LocalStorageSyncWrapper>
                            </StoreProvider>
                        </LanguageHandler>
                    </TranslationProvider>
                </Suspense>
            }
        >
            <Route
                path='profile'
                element={
                    <Suspense fallback={<SkeletonLoader message={localize('Loading')} />}>
                        <Profile />
                    </Suspense>
                }
            />
            <Route
                path='wallet'
                element={
                    <Suspense fallback={<SkeletonLoader message={localize('Loading')} />}>
                        <Wallet />
                    </Suspense>
                }
            />
            <Route
                path='positions'
                element={
                    <Suspense fallback={<SkeletonLoader message={localize('Loading')} />}>
                        <Positions />
                    </Suspense>
                }
            />
            {/* The trade screen fills in its own query params on arrival — see useTradeUrlParams. */}
            <Route
                path='trade'
                element={
                    <Suspense fallback={<SkeletonLoader message={localize('Loading')} />}>
                        <Trade />
                    </Suspense>
                }
            />
            <Route
                path='chart'
                element={<Navigate to={{ pathname: APP_ROUTES.TRADE, search: window.location.search }} replace />}
            />
            <Route path='preview' element={appRootRoute} />
            {oauthCallbackRoute && <Route path={oauthCallbackRoute} element={appRootRoute} />}
            <Route index element={appRootRoute} />
            <Route path='*' element={appRootRoute} />
        </Route>
    ),
    { basename: routerBasename }
);

function App() {
    useAccountSwitching();

    return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export default App;
