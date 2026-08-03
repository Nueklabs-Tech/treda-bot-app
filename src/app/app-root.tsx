import { lazy, PropsWithChildren, Suspense, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import ErrorComponent from '@/components/error-component/error-component';
import AppLoading from '@/components/loader/app-loading';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useStore } from '@/hooks/useStore';
import { applyThemeClass } from '@/utils/theme-class';
import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-root.scss';

const AppContent = lazy(() => import('./app-content'));

const AppRootLoader = () => {
    return <AppLoading message={localize('Loading')} />;
};

// PageError renders inline (it is not an overlay), so the error has to replace
// the app content rather than stack on top of it.
const ErrorComponentWrapper = observer(({ children }: PropsWithChildren) => {
    const { common } = useStore();

    if (!common.error) return <>{children}</>;

    return (
        <ErrorComponent
            header={common.error?.header}
            message={common.error?.message}
            redirect_label={common.error?.redirect_label}
            redirectOnClick={common.error?.redirectOnClick}
            should_clear_error_on_click={common.error?.should_clear_error_on_click}
            setError={common.setError}
            redirect_to={common.error?.redirect_to}
            should_redirect={common.error?.should_redirect}
        />
    );
});

const AppRoot = observer(() => {
    const store = useStore();
    // The connection and authorization are owned by the bootstrap (see
    // @/services/auth-bootstrap); this awaits the same promise, which has
    // normally already resolved by the time this route renders.
    const is_auth_ready = useAuthBootstrap(Boolean(store));
    const is_dark_mode_on = Boolean(store?.ui?.is_dark_mode_on);

    // MainBody also does this, but it lives inside AppContent — the loader and
    // the error screens render outside it and still need the theme variables.
    useEffect(() => {
        applyThemeClass(is_dark_mode_on);
    }, [is_dark_mode_on]);

    if (!store || !is_auth_ready) return <AppRootLoader />;

    return (
        <Suspense fallback={<AppRootLoader />}>
            <ErrorBoundary root_store={store}>
                <ErrorComponentWrapper>
                    <AppContent />
                </ErrorComponentWrapper>
            </ErrorBoundary>
        </Suspense>
    );
});

export default AppRoot;
