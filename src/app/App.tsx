import { lazy, Suspense } from 'react';
import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import AppLoading from '@/components/loader/app-loading';
import LocalStorageSyncWrapper from '@/components/localStorage-sync-wrapper';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useLanguageFromURL } from '@/hooks/useLanguageFromURL';
import { StoreProvider, useStore } from '@/hooks/useStore';
import { isPreviewMode, PREVIEW_BASE_PATH } from '@/utils/is-preview-mode';
import { localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import i18nInstance from './i18n';
// @ts-ignore TS: side-effect SCSS import handled by bundler
import './app-root.scss';

const Layout = lazy(() => import('../components/layout'));
const AppRoot = lazy(() => import('./app-root'));

const LanguageHandler = ({ children }: { children: React.ReactNode }) => {
    useLanguageFromURL();
    return <>{children}</>;
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

    if (!is_auth_ready) return <AppLoading message={localize('Connecting to your trading account')} />;

    return <>{children}</>;
};

const routerBasename = isPreviewMode() ? PREVIEW_BASE_PATH : undefined;

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense fallback={<AppLoading />}>
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
            <Route path='preview' element={<AppRoot />} />
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
