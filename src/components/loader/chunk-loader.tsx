import { useEffect, useState } from 'react';

const ACCENT = '#2f6fed';
const ACCENT_LT = '#7cb7ff';

const STATUS = [
    'Booting neural core',
    'Reading order books',
    'Scanning 2,400 pairs',
    'Modeling volatility',
    'Weighting signals',
    'Backtesting strategy',
    'Calibrating risk',
];
const SUBS = [
    'establishing secure feed',
    'aggregating L2 depth',
    'cross-market arbitrage scan',
    'GARCH model warmup',
    'ensemble vote in progress',
    '1y tick replay',
    'VaR + drawdown limits',
];
const BAR_DURS = [0.9, 1.3, 0.7, 1.1, 0.8, 1.4, 1.0, 1.2, 0.85];
const TICKER = [
    { sym: 'BTC', chg: '+2.4%', up: true },
    { sym: 'ETH', chg: '+1.1%', up: true },
    { sym: 'SOL', chg: '-0.8%', up: false },
    { sym: 'NVDA', chg: '+3.2%', up: true },
    { sym: 'SPX', chg: '+0.4%', up: true },
    { sym: 'GOLD', chg: '-0.3%', up: false },
];

function Loader() {
    const [i, setI] = useState(0);
    const [pct, setPct] = useState(4);

    useEffect(() => {
        const t = setInterval(() => setI(v => (v + 1) % STATUS.length), 2600);
        const p = setInterval(() => setPct(v => (v >= 99 ? 99 : Math.min(99, v + Math.random() * 11))), 650);
        return () => {
            clearInterval(t);
            clearInterval(p);
        };
    }, []);

    const pctLabel = `${Math.round(pct)}%`;
    const ticker = [...TICKER, ...TICKER];

    return (
        <div className='ctl-stage'>
            <div className='ctl-grid' />
            <div className='ctl-scan' />
            <div className='ctl-core-wrap'>
                <svg width='200' height='200' viewBox='0 0 200 200' className='ctl-abs'>
                    <circle cx='100' cy='100' r='92' fill='none' stroke='rgba(47,111,237,.12)' strokeWidth='1' />
                    <circle
                        cx='100'
                        cy='100'
                        r='92'
                        fill='none'
                        stroke={ACCENT}
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeDasharray='40 320'
                        className='ctl-ringdash'
                    />
                </svg>
                <div className='ctl-ring1' />
                <div className='ctl-ring2' />
                <div className='ctl-orbit' />
                <div className='ctl-core'>
                    <svg width='34' height='34' viewBox='0 0 24 24' style={{ position: 'relative', zIndex: 1 }}>
                        <path
                            d='M3 17l4-5 3 3 4-7 4 6'
                            fill='none'
                            stroke='#f4f8ff'
                            strokeWidth='2.2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                        <circle cx='7' cy='12' r='1.4' fill='#f4f8ff' />
                        <circle cx='10' cy='15' r='1.4' fill='#f4f8ff' />
                        <circle cx='14' cy='8' r='1.4' fill='#f4f8ff' />
                    </svg>
                </div>
            </div>

            <div className='ctl-bars'>
                {BAR_DURS.map((d, k) => (
                    <span
                        key={k}
                        style={{ animationDuration: `${d}s`, animationDelay: `${(-k * 0.17).toFixed(2)}s` }}
                    />
                ))}
            </div>

            <div className='ctl-status'>
                <span className='ctl-status-txt'>
                    <span key={i} className='ctl-status-float'>
                        {STATUS[i]}
                    </span>
                </span>
                <span className='ctl-dots'>
                    <span style={{ animationDelay: '0s' }} />
                    <span style={{ animationDelay: '.2s' }} />
                    <span style={{ animationDelay: '.4s' }} />
                </span>
            </div>
            <div className='ctl-sub'>{SUBS[i]}</div>

            <div className='ctl-prog'>
                <div className='ctl-prog-head'>
                    <span>SYNCING MARKETS</span>
                    <span style={{ color: ACCENT }}>{pctLabel}</span>
                </div>
                <div className='ctl-prog-track'>
                    <div className='ctl-prog-fill' style={{ width: pctLabel }} />
                </div>
            </div>

            <div className='ctl-ticker'>
                <div className='ctl-ticker-row'>
                    {ticker.map((t, k) => (
                        <span key={k} className='ctl-ticker-item'>
                            {t.sym} <span style={{ color: t.up ? '#22c55e' : '#ff6b7a' }}>{t.chg}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='app-root'>
            <Loader />
            <div className='load-message'>{message}</div>
        </div>
    );
}
