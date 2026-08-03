// Inline icons for the header auth actions. They inherit `currentColor` so the
// gradient CTA (white text) and the ghost login button (brand blue) both work
// without per-variant fills.

const SIZE = 16;

const base = {
    width: SIZE,
    height: SIZE,
    viewBox: '0 0 16 16',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
    focusable: false,
} as const;

// Bot head with an antenna — the "start the trading bot" CTA.
export const BotIcon = () => (
    <svg {...base}>
        <path d='M8 1v2' stroke='currentColor' strokeWidth='1.4' strokeLinecap='round' />
        <circle cx='8' cy='1.2' r='1' fill='currentColor' />
        <rect x='2.2' y='4.4' width='11.6' height='9' rx='2.6' stroke='currentColor' strokeWidth='1.4' />
        <circle cx='5.9' cy='8.6' r='1.15' fill='currentColor' />
        <circle cx='10.1' cy='8.6' r='1.15' fill='currentColor' />
    </svg>
);

// Candlestick / uptrend — signals "log in to your trading session".
export const SignalIcon = () => (
    <svg {...base}>
        <path
            d='M1.8 12.2 5.6 8.4l2.6 2.6L14.2 5'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path
            d='M10.6 5h3.6v3.6'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Bi-directional arrows for the funds transfer action.
export const TransferIcon = () => (
    <svg {...base}>
        <path
            d='M2.4 5.6h11.2M10.8 2.8l2.8 2.8M13.6 10.4H2.4M5.2 13.2 2.4 10.4'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// The header icon buttons sit on a larger tap target than the pill buttons, so
// they draw on a 24px grid instead of the 16px one above.
const action_base = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
    focusable: false,
} as const;

// Bust in a circle — opens the profile page.
export const ProfileIcon = () => (
    <svg {...action_base}>
        <circle cx='12' cy='12' r='9.25' stroke='currentColor' strokeWidth='1.6' />
        <circle cx='12' cy='9.6' r='2.9' stroke='currentColor' strokeWidth='1.6' />
        <path
            d='M5.9 19.4a6.6 6.6 0 0 1 12.2 0'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

// Bell — opens the notifications drawer.
export const NotificationIcon = () => (
    <svg {...action_base}>
        <path
            d='M18 9.4a6 6 0 1 0-12 0c0 4.2-1.2 5.6-1.9 6.3a.7.7 0 0 0 .5 1.2h14.8a.7.7 0 0 0 .5-1.2c-.7-.7-1.9-2.1-1.9-6.3Z'
            stroke='currentColor'
            strokeWidth='1.6'
            strokeLinejoin='round'
        />
        <path d='M10 20.1a2.3 2.3 0 0 0 4 0' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    </svg>
);
