import { useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { isRouteActive } from '@/constants/routes';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { getNavItems, NavIcon, TNavItem } from '../nav-items';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './bottom-nav.scss';

/**
 * Mobile-only tab bar for signed-in users, fixed to the bottom of the viewport;
 * `.layout` pads itself by the same height while it is mounted so nothing hides
 * underneath. Every destination is a route — main.tsx mirrors the route onto
 * `dashboard.active_tab` for the vendored bot code that still reads it.
 */
const BottomNav = observer(() => {
    const { isDesktop } = useDevice();
    const { isAuthorized } = useApiBase();
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const store = useStore();

    const is_quick_strategy_open = store?.quick_strategy?.is_open;

    const handleClick = useCallback(
        (item: TNavItem) => {
            // Query params carry the account selection, so they survive the hop.
            navigate({ pathname: item.path, search });
        },
        [navigate, search]
    );

    // The quick strategy sheet covers the screen on mobile; a tab bar under it
    // would only get in the way.
    const is_visible = !isDesktop && isAuthorized && !is_quick_strategy_open;

    // The bar is fixed, so the layout has to reserve its height. Flagging it on
    // <body> keeps that padding tied to the bar actually being on screen.
    useEffect(() => {
        if (!is_visible) return;

        document.body.classList.add('has-bottom-nav');

        return () => document.body.classList.remove('has-bottom-nav');
    }, [is_visible]);

    if (!is_visible) return null;

    return (
        <nav className='bottom-nav' aria-label={localize('Main navigation')}>
            {getNavItems().map(item => {
                const is_active = isRouteActive(pathname, item.path);

                return (
                    <button
                        key={item.key}
                        type='button'
                        className={clsx('bottom-nav__item', { 'bottom-nav__item--active': is_active })}
                        onClick={() => handleClick(item)}
                        aria-current={is_active ? 'page' : undefined}
                    >
                        <NavIcon name={item.key} />
                        <span className='bottom-nav__label'>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
});

export default BottomNav;
