import { lazy, Suspense, useEffect } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, useNavigate } from 'react-router-dom';
import BootLoader from '@/components/loader/boot-loader';
import CircleLoader from '@/components/loader/circle-loader';
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

const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
};

/**
 * Puts the router back on the app root after a trip to the OAuth provider.
 *
 * The bootstrap strips the OAuth params with `history.replaceState`, which
 * react-router does not observe — so its location can still be the callback path
 * (and still carry `?code=`) even though the address bar is clean. Replacing it
 * from inside the router resyncs both, and is what actually gets the user off a
 * dedicated redirect path like `/callback`.
 */
const OAuthReturnRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!consumeOAuthReturn()) return;

        navigate({ pathname: '/', search: window.location.search, hash: window.location.hash }, { replace: true });
    }, [navigate]);

    return null;
};

/**
 * Resolves the session (OAuth exchange, socket, authorize) before rendering the
 * app, so every component below mounts with `activeLoginid` already determined
 * and none of them needs a spinner of its own.
 */
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

/**
 * The OAuth provider redirects to NEXT_PUBLIC_DERIV_REDIRECT_URI, which may point
 * at a dedicated path (e.g. `/callback`). Without a route for it the router falls
 * through to its 404 boundary and AuthBootstrapGate — which performs the code
 * exchange — never mounts, so the user comes back from Deriv to a blank page.
 * Mount the same AppRoot there; auth-bootstrap rewrites the URL back to the app
 * root once the exchange is done.
 */
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
            <Route index element={<AppRoot />} />
            <Route
                path='profile'
                element={
                    <Suspense fallback={<CircleLoader message={localize('Loading')} />}>
                        <Profile />
                    </Suspense>
                }
            />
            <Route
                path='wallet'
                element={
                    <Suspense fallback={<CircleLoader message={localize('Loading')} />}>
                        <Wallet />
                    </Suspense>
                }
            />
            <Route path='preview' element={<AppRoot />} />
            {oauthCallbackRoute && <Route path={oauthCallbackRoute} element={<AppRoot />} />}
        </Route>
    ),
    { basename: routerBasename }
);

function App() {
    useAccountSwitching();

    // The OAuth callback, socket init and authorize all run in AuthBootstrapGate
    // (see @/services/auth-bootstrap) so the UI never renders a half-known session.
    return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export default App;
