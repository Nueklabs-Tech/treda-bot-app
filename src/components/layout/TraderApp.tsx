import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ *
 * Tradeclas — mobile app (Home / Bots / Copy / Profile)
 * Styles/keyframes live in app-root.scss.
 * Fonts: Space Grotesk + JetBrains Mono (load in your app).
 * ------------------------------------------------------------------ */

type Trader = {
    ini: string;
    name: string;
    roi: string;
    win: string;
    copiers: string;
    c1: string;
    c2: string;
};
const TRADERS: Trader[] = [
    {
        ini: 'NK',
        name: 'NeonKappa',
        roi: '+38.4%',
        win: '71%',
        copiers: '2,410',
        c1: '#2f6fed',
        c2: '#7cb7ff',
    },
    {
        ini: 'QV',
        name: 'QuantVega',
        roi: '+29.1%',
        win: '66%',
        copiers: '1,884',
        c1: '#1b3a8f',
        c2: '#4aa8ff',
    },
    {
        ini: 'AR',
        name: 'AlgoRhythm',
        roi: '+24.7%',
        win: '63%',
        copiers: '1,207',
        c1: '#3457c9',
        c2: '#22c55e',
    },
    {
        ini: 'DL',
        name: 'DeltaLoop',
        roi: '+19.3%',
        win: '69%',
        copiers: '942',
        c1: '#2f6fed',
        c2: '#9fb4d4',
    },
];
const BOTS = [
    {
        name: 'Momentum Scalper',
        tag: 'EUR/USD · 1m',
        pnl: '+$1,284',
        up: true,
        g: '⧉',
    },
    { name: 'Grid BTC', tag: 'BTC/USDT', pnl: '+$842', up: true, g: '▦' },
    {
        name: 'Mean Reversion',
        tag: 'XAU/USD · 5m',
        pnl: '−$96',
        up: false,
        g: '⟲',
    },
    { name: 'Breakout Hunter', tag: 'SOL/USDT', pnl: '+$377', up: true, g: '◹' },
];
const WORDS = ['ship in minutes', 'backtested', 'risk-managed', 'copy trading'];
const STATS = [
    { v: '12.4k', k: 'bots' },
    { v: '$2.4B', k: 'volume' },
    { v: '99.9%', k: 'uptime' },
];
const MENU = [
    { g: '◱', l: 'Account details' },
    { g: '⛨', l: 'Security & 2FA' },
    { g: '◈', l: 'Payouts & billing' },
    { g: '⇄', l: 'Broker connections' },
    { g: '?', l: 'Help & support' },
];
type Tab = 'home' | 'bots' | 'copy' | 'profile';

type Props = {
    showBottomNav?: boolean;
    rotateHeadline?: boolean;
    withBezel?: boolean;
};

export default function TraderApp({ showBottomNav = true, rotateHeadline = true, withBezel = true }: Props) {
    const [t, setT] = useState(0);
    const [tab, setTab] = useState<Tab>('home');
    const [botRun, setBotRun] = useState([true, true, false, false]);
    const [copied, setCopied] = useState<Record<string, boolean>>({
        NeonKappa: true,
    });
    const [notif, setNotif] = useState(true);

    useEffect(() => {
        const iv = setInterval(() => setT(v => v + 1), 650);
        return () => clearInterval(iv);
    }, []);

    const toggleBot = (i: number) => setBotRun(b => b.map((v, k) => (k === i ? !v : v)));
    const toggleCopy = (name: string) =>
        setCopied(c => {
            const n = { ...c };
            if (n[name]) delete n[name];
            else n[name] = true;
            return n;
        });

    const rotWord = rotateHeadline ? WORDS[Math.floor(t / 5) % WORDS.length] : 'bot builder';
    const runningCount = botRun.filter(Boolean).length;
    const following = TRADERS.filter(x => copied[x.name]);
    const discover = TRADERS.filter(x => !copied[x.name]);
    const titles: Record<Tab, string> = {
        home: 'Tradeclas',
        bots: 'My Bots',
        copy: 'Copy Trading',
        profile: 'Profile',
    };

    const CopyBtn = ({ tr, label }: { tr: Trader; label?: 'stop' }) => {
        const on = !!copied[tr.name];
        if (label === 'stop')
            return (
                <div
                    className='tc-btn'
                    onClick={() => toggleCopy(tr.name)}
                    style={{
                        background: 'rgba(255,107,122,.12)',
                        color: '#ff8f9c',
                        border: '1px solid rgba(255,107,122,.3)',
                        padding: '7px 13px',
                        fontSize: 12.5,
                    }}
                >
                    Stop
                </div>
            );
        return (
            <div
                className='tc-btn'
                onClick={() => toggleCopy(tr.name)}
                style={{
                    background: on ? 'rgba(34,197,94,.14)' : 'linear-gradient(150deg,#2f6fed,#1e51c4)',
                    color: on ? '#7ee6a3' : '#fff',
                    border: `1px solid ${on ? 'rgba(34,197,94,.35)' : 'transparent'}`,
                }}
            >
                {on ? 'Copying' : 'Copy'}
            </div>
        );
    };

    const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
        <div
            className='tc-switch'
            onClick={onClick}
            style={{
                background: on ? 'linear-gradient(150deg,#2f6fed,#1e51c4)' : 'rgba(255,255,255,.12)',
                justifyContent: on ? 'flex-end' : 'flex-start',
            }}
        >
            <div className='tc-knob' />
        </div>
    );

    const screen = (
        <div className='tc-screen'>

            <div className='tc-scroll'>
                {/* top bar */}
                <div className='tc-topbar'>
                    <div className='tc-brand'>
                        <div className='tc-logo'>
                            <Mark />
                        </div>
                        <span className='tc-brandname'>{titles[tab]}</span>
                    </div>
                    <div className='tc-actions-top'>
                        <div className='tc-icobtn'>
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='#c3d2e8'
                                strokeWidth='1.8'
                            >
                                <path d='M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8' />
                                <path d='M13.7 21a2 2 0 01-3.4 0' />
                            </svg>
                            <span className='tc-dot' />
                        </div>
                        <div className='tc-avatar' onClick={() => setTab('profile')} style={{ cursor: 'pointer' }}>
                            AK
                        </div>
                    </div>
                </div>

                {/* HOME */}
                {tab === 'home' && (
                    <div className='tc-page'>
                        <div className='tc-hero'>
                            <div className='tc-hero-grid' />
                            <div className='tc-hero-row'>
                                <div style={{ flex: 1 }}>
                                    <div className='tc-eyebrow'>No-code · {rotWord}</div>
                                    <h1 className='tc-h1'>Build bots that never sleep.</h1>
                                    <p className='tc-hero-p'>
                                        Design, backtest &amp; deploy in minutes — or copy top traders 24/7.
                                    </p>
                                    <div
                                        className='tc-cta-light'
                                        onClick={() => setTab('bots')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        Start free →
                                    </div>
                                </div>
                                <div className='tc-mark-wrap'>
                                    <svg width='96' height='96' viewBox='0 0 96 96' className='tc-abs'>
                                        <circle
                                            cx='48'
                                            cy='48'
                                            r='44'
                                            fill='none'
                                            stroke='rgba(124,183,255,.15)'
                                            strokeWidth='1.5'
                                        />
                                        <circle
                                            cx='48'
                                            cy='48'
                                            r='44'
                                            fill='none'
                                            stroke='#7cb7ff'
                                            strokeWidth='2'
                                            strokeLinecap='round'
                                            strokeDasharray='26 150'
                                            className='tc-ringdash'
                                        />
                                    </svg>
                                    <div className='tc-ring1' />
                                    <div className='tc-orbit' />
                                    <div className='tc-core'>
                                        <Mark size={22} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='tc-stats'>
                            {STATS.map(s => (
                                <div key={s.k} className='tc-stat'>
                                    <div className='tc-stat-v'>{s.v}</div>
                                    <div className='tc-stat-k'>{s.k}</div>
                                </div>
                            ))}
                        </div>
                        <div className='tc-quick'>
                            {[
                                ['⧉', 'New bot', 'bots'],
                                ['⇄', 'Copy', 'copy'],
                                ['⟲', 'Backtest', 'bots'],
                                ['◪', 'Markets', 'home'],
                            ].map(([g, l, dest]) => (
                                <div
                                    key={l}
                                    className='tc-quick-item'
                                    onClick={() => setTab(dest as Tab)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className='tc-quick-ico'>{g}</div>
                                    <span className='tc-quick-l'>{l}</span>
                                </div>
                            ))}
                        </div>
                        <div className='tc-secthd'>
                            <h2 className='tc-secttl'>Top traders to copy</h2>
                            <span className='tc-seeall' onClick={() => setTab('copy')} style={{ cursor: 'pointer' }}>
                                See all
                            </span>
                        </div>
                        <div className='tc-list'>
                            {TRADERS.slice(0, 3).map(tr => (
                                <div key={tr.name} className='tc-trader'>
                                    <div
                                        className='tc-tavatar'
                                        style={{
                                            background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                                        }}
                                    >
                                        {tr.ini}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className='tc-tname'>{tr.name}</div>
                                        <div className='tc-tsub'>
                                            {tr.copiers} copiers · {tr.win} win
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                                        <div className='tc-roi'>{tr.roi}</div>
                                        <div className='tc-roi-k'>30D</div>
                                    </div>
                                    <CopyBtn tr={tr} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOTS */}
                {tab === 'bots' && (
                    <div className='tc-page'>
                        <div className='tc-hero' style={{ padding: '20px 22px' }}>
                            <div className='tc-pl-k'>TOTAL P/L · 30D</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                <div className='tc-pl-v'>+$2,407</div>
                                <div className='tc-pl-pct'>+8.6%</div>
                            </div>
                            <div className='tc-pl-sub'>
                                {runningCount} of {BOTS.length} bots running
                            </div>
                        </div>
                        <div className='tc-newbot' onClick={() => setTab('bots')}>
                            <span style={{ fontSize: 18 }}>＋</span> New bot
                        </div>
                        <div className='tc-list'>
                            {BOTS.map((b, i) => {
                                const run = botRun[i];
                                return (
                                    <div key={b.name} className='tc-botcard'>
                                        <div className='tc-botrow'>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 11,
                                                }}
                                            >
                                                <div className='tc-boticon'>{b.g}</div>
                                                <div>
                                                    <div className='tc-botname'>{b.name}</div>
                                                    <div className='tc-tsub'>{b.tag}</div>
                                                </div>
                                            </div>
                                            <Toggle on={run} onClick={() => toggleBot(i)} />
                                        </div>
                                        <div className='tc-botfoot'>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 7,
                                                }}
                                            >
                                                <span
                                                    className='tc-sdot'
                                                    style={{
                                                        background: run ? '#22c55e' : 'rgba(180,200,230,.5)',
                                                    }}
                                                />
                                                <span
                                                    style={{
                                                        font: "600 12.5px 'JetBrains Mono',monospace",
                                                        color: run ? '#22c55e' : 'rgba(180,200,230,.6)',
                                                    }}
                                                >
                                                    {run ? 'Running' : 'Paused'}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    font: "700 16px 'JetBrains Mono',monospace",
                                                    color: b.up ? '#22c55e' : '#ff8f9c',
                                                }}
                                            >
                                                {b.pnl}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* COPY */}
                {tab === 'copy' && (
                    <div className='tc-page'>
                        {following.length > 0 && (
                            <>
                                <h2 className='tc-secttl' style={{ margin: '0 0 12px' }}>
                                    Copying ({following.length})
                                </h2>
                                <div className='tc-list' style={{ marginBottom: 24 }}>
                                    {following.map(tr => (
                                        <div key={tr.name} className='tc-follow'>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 12,
                                                    marginBottom: 12,
                                                }}
                                            >
                                                <div
                                                    className='tc-tavatar'
                                                    style={{
                                                        background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                                                    }}
                                                >
                                                    {tr.ini}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div className='tc-tname'>{tr.name}</div>
                                                    <div
                                                        style={{
                                                            font: "500 11.5px 'JetBrains Mono',monospace",
                                                            color: '#22c55e',
                                                        }}
                                                    >
                                                        Live · {tr.roi} 30D
                                                    </div>
                                                </div>
                                                <CopyBtn tr={tr} label='stop' />
                                            </div>
                                            <div className='tc-followmeta'>
                                                <span>Allocation $500</span>
                                                <span>Win {tr.win}</span>
                                                <span>{tr.copiers} copiers</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div className='tc-secthd'>
                            <h2 className='tc-secttl'>Discover</h2>
                            <span className='tc-tsub'>ranked by 30D ROI</span>
                        </div>
                        <div className='tc-list'>
                            {discover.map((tr, i) => (
                                <div key={tr.name} className='tc-trader'>
                                    <div
                                        style={{
                                            font: "700 13px 'JetBrains Mono',monospace",
                                            color: 'rgba(180,200,230,.4)',
                                            width: 18,
                                        }}
                                    >
                                        #{i + 1}
                                    </div>
                                    <div
                                        className='tc-tavatar'
                                        style={{
                                            background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                                        }}
                                    >
                                        {tr.ini}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div className='tc-tname'>{tr.name}</div>
                                        <div className='tc-tsub'>
                                            {tr.copiers} · {tr.win} win
                                        </div>
                                    </div>
                                    <div className='tc-roi' style={{ marginRight: 2 }}>
                                        {tr.roi}
                                    </div>
                                    <CopyBtn tr={tr} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PROFILE */}
                {tab === 'profile' && (
                    <div className='tc-page'>
                        <div className='tc-prof'>
                            <div className='tc-prof-av'>AK</div>
                            <div className='tc-prof-name'>Alex Kim</div>
                            <div className='tc-tsub' style={{ marginBottom: 10 }}>
                                @alexk · joined 2025
                            </div>
                            <div className='tc-badge'>
                                <span style={{ color: '#7cb7ff' }}>◆</span>
                                <span>Pro plan</span>
                            </div>
                        </div>
                        <div className='tc-pstats'>
                            {[
                                ['BALANCE', '$18,240', '#fff'],
                                ['TOTAL P/L', '+$3,912', '#22c55e'],
                                ['ACTIVE BOTS', String(runningCount), '#fff'],
                                ['COPYING', String(following.length), '#fff'],
                            ].map(([k, v, c]) => (
                                <div key={k} className='tc-pstat'>
                                    <div className='tc-pstat-k'>{k}</div>
                                    <div className='tc-pstat-v' style={{ color: c }}>
                                        {v}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className='tc-menu'>
                            {MENU.map(m => (
                                <div key={m.l} className='tc-menu-row'>
                                    <span className='tc-menu-ico'>{m.g}</span>
                                    <span
                                        style={{
                                            flex: 1,
                                            font: "500 15px 'Space Grotesk',sans-serif",
                                            color: '#e7eef7',
                                        }}
                                    >
                                        {m.l}
                                    </span>
                                    <span style={{ color: 'rgba(180,200,230,.4)' }}>›</span>
                                </div>
                            ))}
                        </div>
                        <div className='tc-notifrow'>
                            <span
                                style={{
                                    font: "500 15px 'Space Grotesk',sans-serif",
                                    color: '#e7eef7',
                                }}
                            >
                                Push notifications
                            </span>
                            <Toggle on={notif} onClick={() => setNotif(v => !v)} />
                        </div>
                        <div className='tc-logout'>Log out</div>
                    </div>
                )}

                <div className='tc-disc'>
                    Trading involves risk of loss. Past performance is not indicative of future results.
                </div>
            </div>

            {showBottomNav && (
                <div className='tc-tabbar'>
                    {(
                        [
                            ['home', '⌂', 'Home'],
                            ['bots', '⧉', 'Bots'],
                            ['copy', '⇄', 'Copy'],
                            ['profile', '○', 'Profile'],
                        ] as [Tab, string, string][]
                    ).map(([k, g, l]) => (
                        <div
                            key={k}
                            className='tc-tab'
                            onClick={() => setTab(k)}
                            style={{
                                color: tab === k ? '#7cb7ff' : 'rgba(180,200,230,.5)',
                                cursor: 'pointer',
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{g}</span>
                            <span className='tc-tab-l'>{l}</span>
                        </div>
                    ))}
                </div>
            )}
            {withBezel && <div className='tc-home' />}
        </div>
    );

    return (
        <div className={withBezel ? 'tc-root tc-desk' : 'tc-root'}>
            {withBezel ? <div className='tc-phone'>{screen}</div> : screen}
        </div>
    );
}

function Mark({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox='0 0 24 24'>
            <path
                d='M3 17l4-5 3 3 4-7 4 6'
                fill='none'
                stroke='#f4f8ff'
                strokeWidth='2.3'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </svg>
    );
}
