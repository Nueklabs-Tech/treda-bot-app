import { useCallback } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { isRouteActive } from '@/constants/routes';
import { useApiBase } from '@/hooks/useApiBase';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { getNavItems, NavIcon, TNavItem } from '../nav-items';
// @ts-ignore: Allow side-effect import of SCSS without type declarations
import './primary-nav.scss';

/**
 * Desktop counterpart of the mobile tab bar, sitting in the header next to the
 * logo. Both are driven by the same `getNavItems()` list, so a destination only
 * ever has to be declared once.
 */
const PrimaryNav = observer(() => {
    const { isDesktop } = useDevice();
    const { isAuthorized } = useApiBase();
    const navigate = useNavigate();
    const { pathname, search } = useLocation();

    const handleClick = useCallback(
        (item: TNavItem) => {
            navigate({ pathname: item.path, search });
        },
        [navigate, search]
    );

    if (!isDesktop || !isAuthorized) return null;

    return (
        <nav className='primary-nav' aria-label={localize('Main navigation')}>
            {getNavItems().map(item => {
                const is_active = isRouteActive(pathname, item.path);

                return (
                    <button
                        key={item.key}
                        type='button'
                        className={clsx('primary-nav__item', { 'primary-nav__item--active': is_active })}
                        onClick={() => handleClick(item)}
                        aria-current={is_active ? 'page' : undefined}
                    >
                        <NavIcon name={item.key} size={20} />
                        <span className='primary-nav__label'>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
});

export default PrimaryNav;
