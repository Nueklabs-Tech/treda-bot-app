import { ReactNode } from 'react';

/**
 * One outline glyph family (24px box, 1.6 stroke, `currentColor`) shared by the
 * routed screens, matching the profile and wallet icon set.
 */
const PATHS: Record<string, ReactNode> = {
    activity: <path d='M3 12.5h3.5L9 6l4 12 2.5-5.5H21' />,
    bolt: <path d='M13 3 5 13.5h6L11 21l8-10.5h-6L13 3Z' />,
    bot: (
        <>
            <rect x='4' y='8' width='16' height='11.5' rx='3.5' />
            <path d='M12 4v4M2.5 12.5v2.5M21.5 12.5v2.5M9.5 12.8h.01M14.5 12.8h.01M9.8 16.4h4.4' />
        </>
    ),
    book: (
        <>
            <path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z' />
            <path d='M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z' />
        </>
    ),
    candles: (
        <>
            <rect x='4.5' y='7' width='5' height='10' rx='1.6' />
            <rect x='14.5' y='7' width='5' height='10' rx='1.6' />
            <path d='M7 3.5V7M7 17v3.5M17 3.5V7M17 17v3.5' />
        </>
    ),
    check: <path d='m5 12.5 4.5 4.5L19 7' />,
    chevron: <path d='m9 5 7 7-7 7' />,
    clock: (
        <>
            <circle cx='12' cy='12' r='9' />
            <path d='M12 7v5.2l3.2 1.9' />
        </>
    ),
    download: <path d='M12 4v11m0 0 4-4m-4 4-4-4M4.5 18.5h15' />,
    gauge: (
        <>
            <path d='M4 17a8 8 0 1 1 16 0' />
            <path d='m14.5 10.5-3 4' />
        </>
    ),
    grid: (
        <>
            <rect x='3.5' y='3.5' width='7' height='7' rx='2' />
            <rect x='13.5' y='3.5' width='7' height='7' rx='2' />
            <rect x='3.5' y='13.5' width='7' height='7' rx='2' />
            <rect x='13.5' y='13.5' width='7' height='7' rx='2' />
        </>
    ),
    layers: <path d='m12 3.5 8.5 4.2-8.5 4.3L3.5 7.7 12 3.5ZM4 12.5 12 16.5l8-4M4 16.8 12 20.8l8-4' />,
    play: <path d='M8 5.5v13l11-6.5-11-6.5Z' />,
    plus: <path d='M12 5v14M5 12h14' />,
    puzzle: (
        <>
            <path d='M10 4.5a2 2 0 1 1 4 0V6h3.2a1 1 0 0 1 1 1v3.2h1.3a2 2 0 1 1 0 4H18.2V18a1 1 0 0 1-1 1H14v-1.5a2 2 0 1 0-4 0V19H6.8a1 1 0 0 1-1-1v-3.2H4.5a2 2 0 1 1 0-4h1.3V7a1 1 0 0 1 1-1H10V4.5Z' />
        </>
    ),
    refresh: (
        <>
            <path d='M20 12a8 8 0 1 1-2.3-5.6' />
            <path d='M20 4v4.5h-4.5' />
        </>
    ),
    shield: (
        <>
            <path d='M12 3.5 19 6.4v5c0 4.3-2.9 8.2-7 9.6-4.1-1.4-7-5.3-7-9.6v-5l7-2.9Z' />
            <path d='m9.2 12 2 2 3.6-3.6' />
        </>
    ),
    sliders: (
        <>
            <path d='M4 8h8M17 8h3M4 16h3M12 16h8' />
            <circle cx='14.5' cy='8' r='2.2' />
            <circle cx='9.5' cy='16' r='2.2' />
        </>
    ),
    stop: <rect x='6.5' y='6.5' width='11' height='11' rx='2' />,
    trend_down: <path d='M4 8.5 9.5 14l3.5-3.5L20 17M15.5 17H20v-4.5' />,
    trend_up: <path d='M4 17.5 9.5 12l3.5 3.5L20 8.5M15.5 8.5H20V13' />,
    wallet: (
        <>
            <rect x='3' y='6' width='18' height='13' rx='3' />
            <path d='M3 10.5h18M16.5 14.8h1.2' />
        </>
    ),
};

export type TIconName = keyof typeof PATHS;

export const Icon = ({ name, size = 22, className }: { name: TIconName; size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        aria-hidden='true'
        className={className}
    >
        {PATHS[name]}
    </svg>
);
