import { lazy, Suspense } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import ErrorComponent from '@/components/error-component/error-component';
import AppLoading from '@/components/loader/app-loading';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-root.scss';

const AppContent = lazy(() => import('./app-content'));

const AppRootLoader = () => {
    return <AppLoading message={localize('Loading...')} />;
};

const ErrorComponentWrapper = observer(() => {
    const { common } = useStore();

    if (!common.error) return null;

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

const AppRoot = () => {
    const store = useStore();
    // The connection and authorization are owned by the bootstrap (see
    // @/services/auth-bootstrap); this awaits the same promise, which has
    // normally already resolved by the time this route renders.
    const is_auth_ready = useAuthBootstrap(Boolean(store));

    if (!store || !is_auth_ready) return <AppRootLoader />;

    return (
        <Suspense fallback={<AppRootLoader />}>
            <ErrorBoundary root_store={store}>
                <ErrorComponentWrapper />
                <div>Welcome Home</div>
                {/* <AppContent /> */}
            </ErrorBoundary>
        </Suspense>
    );
};

export default AppRoot;
