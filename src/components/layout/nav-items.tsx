import { APP_ROUTES } from '@/constants/routes';
import { localize } from '@deriv-com/translations';

/** 24px outline glyphs on `currentColor`, matching the profile screen's icon set. */
export const NAV_ICONS = {
    home: <path d='M4 10.4 12 4l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-8.6Z' />,
    trade: (
        <>
            <rect x='4.5' y='7' width='5' height='10' rx='1.6' />
            <rect x='14.5' y='7' width='5' height='10' rx='1.6' />
            <path d='M7 3.5V7M7 17v3.5M17 3.5V7M17 17v3.5' />
        </>
    ),
    bots: (
        <>
            <rect x='4' y='8' width='16' height='11.5' rx='3.5' />
            <path d='M12 4v4M2.5 12.5v2.5M21.5 12.5v2.5M9.5 12.8h.01M14.5 12.8h.01M9.8 16.4h4.4' />
        </>
    ),
    positions: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 7v5.2l3.2 1.9' />
        </>
    ),
    wallet: (
        <>
            <rect x='3' y='6' width='18' height='13' rx='3' />
            <path d='M3 10.5h18M16.5 14.8h1.2' />
        </>
    ),
} as const;

export type TNavKey = keyof typeof NAV_ICONS;

export type TNavItem = {
    key: TNavKey;
    label: string;
    path: string;
};

/** Built per render so the labels pick up the active language. */
export const getNavItems = (): TNavItem[] => [
    { key: 'home', label: localize('Home'), path: APP_ROUTES.HOME },
    { key: 'bots', label: localize('Bots'), path: APP_ROUTES.BOTS },
    { key: 'trade', label: localize('Trade'), path: APP_ROUTES.TRADE },
    { key: 'positions', label: localize('Positions'), path: APP_ROUTES.POSITIONS },
    { key: 'wallet', label: localize('Wallet'), path: APP_ROUTES.WALLET },
];

export const NavIcon = ({ name, size = 26 }: { name: TNavKey; size?: number }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 26 26'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        className='nav-icon'
    >
        {NAV_ICONS[name]}
    </svg>
);
