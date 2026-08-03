import { lazy, PropsWithChildren, Suspense, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import BootLoader from '@/components/loader/boot-loader';
import CircleLoader from '@/components/loader/circle-loader';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useStore } from '@/hooks/useStore';
import { applyThemeClass } from '@/utils/theme-class';
import { localize } from '@deriv-com/translations';
// @ts-ignore
import './app-root.scss';

const AppContent = lazy(() => import('./app-content'));

const ErrorBoundary = lazy(() => import('@/components/error-component/error-boundary'));
const ErrorComponent = lazy(() => import('@/components/error-component/error-component'));

const AppRootLoader = () => {
    return <BootLoader message={localize('Loading')} />;
};

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

    const is_auth_ready = useAuthBootstrap(Boolean(store));
    const is_dark_mode_on = Boolean(store?.ui?.is_dark_mode_on);

    useEffect(() => {
        applyThemeClass(is_dark_mode_on);
    }, [is_dark_mode_on]);

    if (!store || !is_auth_ready) return <AppRootLoader />;

    return (
        <Suspense fallback={<CircleLoader message={localize('Loading')} />}>
            <ErrorBoundary root_store={store}>
                <ErrorComponentWrapper>
                    <AppContent />
                </ErrorComponentWrapper>
            </ErrorBoundary>
        </Suspense>
    );
});

export default AppRoot;
