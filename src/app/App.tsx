import { lazy, Suspense, useEffect } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useNavigate } from 'react-router-dom';
import BootLoader from '@/components/loader/boot-loader';
import SkeletonLoader from '@/components/loader/skeleton-loader';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
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
// @ts-ignore TS: side-effect SCSS import handled by bundler
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const Profile = lazy(() => import('../pages/profile'));
const Wallet = lazy(() => import('../pages/wallet'));
const Positions = lazy(() => import('../pages/positions'));

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
    // The root store registers itself with api_base on construction, so wait for
    // it before opening the connection.
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

    // Route paths are relative to the basename, so drop it before comparing.
    if (routerBasename && path.startsWith(routerBasename)) path = path.slice(routerBasename.length);

    const route = path.replace(/^\/+|\/+$/g, '');

    // Empty means the redirect lands on the app root, already covered by the
    // index route; 'preview' is likewise already declared below.
    return route && route !== 'preview' ? route : null;
};

const oauthCallbackRoute = getOAuthCallbackRoute();

// One element shared by every route that renders the app shell, so React
// reconciles it across those routes instead of tearing the tree down.
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
