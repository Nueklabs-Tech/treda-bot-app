import { useCallback } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { DBOT_TABS, TAB_HASHES } from '@/constants/bot-contents';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import './bottom-nav.scss';

const PROFILE_PATH = '/profile';

/** 24px outline glyphs on `currentColor`, matching the profile screen's icon set. */
const ICONS = {
    home: <path d='M4 10.4 12 4l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.6Z' />,
    bots: (
        <>
            <rect x='4' y='8' width='16' height='11.5' rx='3.5' />
            <path d='M12 4v4M2.5 12.5v2.5M21.5 12.5v2.5M9.5 12.8h.01M14.5 12.8h.01M9.8 16.4h4.4' />
        </>
    ),
    chart: (
        <>
            <rect x='4.5' y='7' width='5' height='10' rx='1.6' />
            <rect x='14.5' y='7' width='5' height='10' rx='1.6' />
            <path d='M7 3.5V7M7 17v3.5M17 3.5V7M17 17v3.5' />
        </>
    ),
    profile: (
        <>
            <circle cx='12' cy='8' r='3.6' />
            <path d='M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6' />
        </>
    ),
} as const;

type TNavItem = {
    key: keyof typeof ICONS;
    label: string;
    tab?: number;
    path?: string;
};

// Built per render so the labels pick up the active language.
const getNavItems = (): TNavItem[] => [
    { key: 'home', label: localize('Home'), tab: DBOT_TABS.DASHBOARD },
    { key: 'bots', label: localize('Bots'), tab: DBOT_TABS.BOT_BUILDER },
    { key: 'chart', label: localize('Chart'), tab: DBOT_TABS.CHART },
    { key: 'profile', label: localize('Profile'), path: PROFILE_PATH },
];

/**
 * Mobile-only tab bar for signed-in users. It sits as the last flex child of
 * `.layout`, so it reserves its own height instead of floating over the bot
 * builder. The three app tabs drive the same `dashboard.active_tab` the top tab
 * strip does — main.tsx's `active_tab` effect keeps the `#hash` in sync.
 */
const BottomNav = observer(() => {
    const { isDesktop } = useDevice();
    const { isAuthorized } = useApiBase();
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const store = useStore();

    const active_tab = store?.dashboard?.active_tab ?? DBOT_TABS.DASHBOARD;
    const is_quick_strategy_open = store?.quick_strategy?.is_open;

    const handleClick = useCallback(
        (item: TNavItem) => {
            if (item.path) {
                navigate(item.path);
                return;
            }
            // Coming back from a route like /profile: land on the app root with the
            // tab's hash already set, so main.tsx opens on it rather than the
            // dashboard.
            if (pathname !== '/') navigate({ pathname: '/', search, hash: TAB_HASHES[item.tab as number] });
            store?.dashboard?.setActiveTab(item.tab as number);
        },
        [navigate, pathname, search, store]
    );

    // The quick strategy sheet covers the screen on mobile; a tab bar under it
    // would only get in the way.
    if (isDesktop || !isAuthorized || is_quick_strategy_open) return null;

    const is_profile_route = pathname === PROFILE_PATH;

    return (
        <nav className='bottom-nav' aria-label={localize('Main navigation')}>
            {getNavItems().map(item => {
                const is_active = item.path ? is_profile_route : !is_profile_route && active_tab === item.tab;

                return (
                    <button
                        key={item.key}
                        type='button'
                        className={clsx('bottom-nav__item', { 'bottom-nav__item--active': is_active })}
                        onClick={() => handleClick(item)}
                        aria-current={is_active ? 'page' : undefined}
                    >
                        <svg
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.6'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            aria-hidden='true'
                            className='bottom-nav__icon'
                        >
                            {ICONS[item.key]}
                        </svg>
                        <span className='bottom-nav__label'>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
});

export default BottomNav;
