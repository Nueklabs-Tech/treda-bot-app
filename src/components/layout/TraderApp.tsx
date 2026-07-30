import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ *
 * Tradeclas — mobile app (Home / Bots / Copy / Profile)
 * Self-contained: styles/keyframes injected via one <style> tag.
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
    ini: "NK",
    name: "NeonKappa",
    roi: "+38.4%",
    win: "71%",
    copiers: "2,410",
    c1: "#2f6fed",
    c2: "#7cb7ff",
  },
  {
    ini: "QV",
    name: "QuantVega",
    roi: "+29.1%",
    win: "66%",
    copiers: "1,884",
    c1: "#1b3a8f",
    c2: "#4aa8ff",
  },
  {
    ini: "AR",
    name: "AlgoRhythm",
    roi: "+24.7%",
    win: "63%",
    copiers: "1,207",
    c1: "#3457c9",
    c2: "#22c55e",
  },
  {
    ini: "DL",
    name: "DeltaLoop",
    roi: "+19.3%",
    win: "69%",
    copiers: "942",
    c1: "#2f6fed",
    c2: "#9fb4d4",
  },
];
const BOTS = [
  {
    name: "Momentum Scalper",
    tag: "EUR/USD · 1m",
    pnl: "+$1,284",
    up: true,
    g: "⧉",
  },
  { name: "Grid BTC", tag: "BTC/USDT", pnl: "+$842", up: true, g: "▦" },
  {
    name: "Mean Reversion",
    tag: "XAU/USD · 5m",
    pnl: "−$96",
    up: false,
    g: "⟲",
  },
  { name: "Breakout Hunter", tag: "SOL/USDT", pnl: "+$377", up: true, g: "◹" },
];
const WORDS = ["ship in minutes", "backtested", "risk-managed", "copy trading"];
const STATS = [
  { v: "12.4k", k: "bots" },
  { v: "$2.4B", k: "volume" },
  { v: "99.9%", k: "uptime" },
];
const MENU = [
  { g: "◱", l: "Account details" },
  { g: "⛨", l: "Security & 2FA" },
  { g: "◈", l: "Payouts & billing" },
  { g: "⇄", l: "Broker connections" },
  { g: "?", l: "Help & support" },
];
type Tab = "home" | "bots" | "copy" | "profile";

type Props = {
  showBottomNav?: boolean;
  rotateHeadline?: boolean;
  withBezel?: boolean;
};

export default function TraderApp({
  showBottomNav = true,
  rotateHeadline = true,
  withBezel = true,
}: Props) {
  const [t, setT] = useState(0);
  const [tab, setTab] = useState<Tab>("home");
  const [botRun, setBotRun] = useState([true, true, false, false]);
  const [copied, setCopied] = useState<Record<string, boolean>>({
    NeonKappa: true,
  });
  const [notif, setNotif] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => setT((v) => v + 1), 650);
    return () => clearInterval(iv);
  }, []);

  const toggleBot = (i: number) =>
    setBotRun((b) => b.map((v, k) => (k === i ? !v : v)));
  const toggleCopy = (name: string) =>
    setCopied((c) => {
      const n = { ...c };
      if (n[name]) delete n[name];
      else n[name] = true;
      return n;
    });

  const rotWord = rotateHeadline
    ? WORDS[Math.floor(t / 5) % WORDS.length]
    : "bot builder";
  const runningCount = botRun.filter(Boolean).length;
  const following = TRADERS.filter((x) => copied[x.name]);
  const discover = TRADERS.filter((x) => !copied[x.name]);
  const titles: Record<Tab, string> = {
    home: "Tradeclas",
    bots: "My Bots",
    copy: "Copy Trading",
    profile: "Profile",
  };

  const CopyBtn = ({ tr, label }: { tr: Trader; label?: "stop" }) => {
    const on = !!copied[tr.name];
    if (label === "stop")
      return (
        <div
          className="tc-btn"
          onClick={() => toggleCopy(tr.name)}
          style={{
            background: "rgba(255,107,122,.12)",
            color: "#ff8f9c",
            border: "1px solid rgba(255,107,122,.3)",
            padding: "7px 13px",
            fontSize: 12.5,
          }}
        >
          Stop
        </div>
      );
    return (
      <div
        className="tc-btn"
        onClick={() => toggleCopy(tr.name)}
        style={{
          background: on
            ? "rgba(34,197,94,.14)"
            : "linear-gradient(150deg,#2f6fed,#1e51c4)",
          color: on ? "#7ee6a3" : "#fff",
          border: `1px solid ${on ? "rgba(34,197,94,.35)" : "transparent"}`,
        }}
      >
        {on ? "Copying" : "Copy"}
      </div>
    );
  };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <div
      className="tc-switch"
      onClick={onClick}
      style={{
        background: on
          ? "linear-gradient(150deg,#2f6fed,#1e51c4)"
          : "rgba(255,255,255,.12)",
        justifyContent: on ? "flex-end" : "flex-start",
      }}
    >
      <div className="tc-knob" />
    </div>
  );

  const screen = (
    <div className="tc-screen">
      <div className="tc-status">
        <span>9:41</span>
        <span
          style={{ fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}
        >
          5G
        </span>
      </div>
      {withBezel && <div className="tc-notch" />}

      <div className="tc-scroll">
        {/* top bar */}
        <div className="tc-topbar">
          <div className="tc-brand">
            <div className="tc-logo">
              <Mark />
            </div>
            <span className="tc-brandname">{titles[tab]}</span>
          </div>
          <div className="tc-actions-top">
            <div className="tc-icobtn">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c3d2e8"
                strokeWidth="1.8"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
                <path d="M13.7 21a2 2 0 01-3.4 0" />
              </svg>
              <span className="tc-dot" />
            </div>
            <div
              className="tc-avatar"
              onClick={() => setTab("profile")}
              style={{ cursor: "pointer" }}
            >
              AK
            </div>
          </div>
        </div>

        {/* HOME */}
        {tab === "home" && (
          <div className="tc-page">
            <div className="tc-hero">
              <div className="tc-hero-grid" />
              <div className="tc-hero-row">
                <div style={{ flex: 1 }}>
                  <div className="tc-eyebrow">No-code · {rotWord}</div>
                  <h1 className="tc-h1">Build bots that never sleep.</h1>
                  <p className="tc-hero-p">
                    Design, backtest &amp; deploy in minutes — or copy top
                    traders 24/7.
                  </p>
                  <div
                    className="tc-cta-light"
                    onClick={() => setTab("bots")}
                    style={{ cursor: "pointer" }}
                  >
                    Start free →
                  </div>
                </div>
                <div className="tc-mark-wrap">
                  <svg
                    width="96"
                    height="96"
                    viewBox="0 0 96 96"
                    className="tc-abs"
                  >
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="rgba(124,183,255,.15)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      fill="none"
                      stroke="#7cb7ff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="26 150"
                      className="tc-ringdash"
                    />
                  </svg>
                  <div className="tc-ring1" />
                  <div className="tc-orbit" />
                  <div className="tc-core">
                    <Mark size={22} />
                  </div>
                </div>
              </div>
            </div>
            <div className="tc-stats">
              {STATS.map((s) => (
                <div key={s.k} className="tc-stat">
                  <div className="tc-stat-v">{s.v}</div>
                  <div className="tc-stat-k">{s.k}</div>
                </div>
              ))}
            </div>
            <div className="tc-quick">
              {[
                ["⧉", "New bot", "bots"],
                ["⇄", "Copy", "copy"],
                ["⟲", "Backtest", "bots"],
                ["◪", "Markets", "home"],
              ].map(([g, l, dest]) => (
                <div
                  key={l}
                  className="tc-quick-item"
                  onClick={() => setTab(dest as Tab)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="tc-quick-ico">{g}</div>
                  <span className="tc-quick-l">{l}</span>
                </div>
              ))}
            </div>
            <div className="tc-secthd">
              <h2 className="tc-secttl">Top traders to copy</h2>
              <span
                className="tc-seeall"
                onClick={() => setTab("copy")}
                style={{ cursor: "pointer" }}
              >
                See all
              </span>
            </div>
            <div className="tc-list">
              {TRADERS.slice(0, 3).map((tr) => (
                <div key={tr.name} className="tc-trader">
                  <div
                    className="tc-tavatar"
                    style={{
                      background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                    }}
                  >
                    {tr.ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tc-tname">{tr.name}</div>
                    <div className="tc-tsub">
                      {tr.copiers} copiers · {tr.win} win
                    </div>
                  </div>
                  <div style={{ textAlign: "right", marginRight: 4 }}>
                    <div className="tc-roi">{tr.roi}</div>
                    <div className="tc-roi-k">30D</div>
                  </div>
                  <CopyBtn tr={tr} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTS */}
        {tab === "bots" && (
          <div className="tc-page">
            <div className="tc-hero" style={{ padding: "20px 22px" }}>
              <div className="tc-pl-k">TOTAL P/L · 30D</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div className="tc-pl-v">+$2,407</div>
                <div className="tc-pl-pct">+8.6%</div>
              </div>
              <div className="tc-pl-sub">
                {runningCount} of {BOTS.length} bots running
              </div>
            </div>
            <div className="tc-newbot" onClick={() => setTab("bots")}>
              <span style={{ fontSize: 18 }}>＋</span> New bot
            </div>
            <div className="tc-list">
              {BOTS.map((b, i) => {
                const run = botRun[i];
                return (
                  <div key={b.name} className="tc-botcard">
                    <div className="tc-botrow">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                        }}
                      >
                        <div className="tc-boticon">{b.g}</div>
                        <div>
                          <div className="tc-botname">{b.name}</div>
                          <div className="tc-tsub">{b.tag}</div>
                        </div>
                      </div>
                      <Toggle on={run} onClick={() => toggleBot(i)} />
                    </div>
                    <div className="tc-botfoot">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <span
                          className="tc-sdot"
                          style={{
                            background: run
                              ? "#22c55e"
                              : "rgba(180,200,230,.5)",
                          }}
                        />
                        <span
                          style={{
                            font: "600 12.5px 'JetBrains Mono',monospace",
                            color: run ? "#22c55e" : "rgba(180,200,230,.6)",
                          }}
                        >
                          {run ? "Running" : "Paused"}
                        </span>
                      </div>
                      <div
                        style={{
                          font: "700 16px 'JetBrains Mono',monospace",
                          color: b.up ? "#22c55e" : "#ff8f9c",
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
        {tab === "copy" && (
          <div className="tc-page">
            {following.length > 0 && (
              <>
                <h2 className="tc-secttl" style={{ margin: "0 0 12px" }}>
                  Copying ({following.length})
                </h2>
                <div className="tc-list" style={{ marginBottom: 24 }}>
                  {following.map((tr) => (
                    <div key={tr.name} className="tc-follow">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          className="tc-tavatar"
                          style={{
                            background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                          }}
                        >
                          {tr.ini}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="tc-tname">{tr.name}</div>
                          <div
                            style={{
                              font: "500 11.5px 'JetBrains Mono',monospace",
                              color: "#22c55e",
                            }}
                          >
                            Live · {tr.roi} 30D
                          </div>
                        </div>
                        <CopyBtn tr={tr} label="stop" />
                      </div>
                      <div className="tc-followmeta">
                        <span>Allocation $500</span>
                        <span>Win {tr.win}</span>
                        <span>{tr.copiers} copiers</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="tc-secthd">
              <h2 className="tc-secttl">Discover</h2>
              <span className="tc-tsub">ranked by 30D ROI</span>
            </div>
            <div className="tc-list">
              {discover.map((tr, i) => (
                <div key={tr.name} className="tc-trader">
                  <div
                    style={{
                      font: "700 13px 'JetBrains Mono',monospace",
                      color: "rgba(180,200,230,.4)",
                      width: 18,
                    }}
                  >
                    #{i + 1}
                  </div>
                  <div
                    className="tc-tavatar"
                    style={{
                      background: `linear-gradient(150deg,${tr.c1},${tr.c2})`,
                    }}
                  >
                    {tr.ini}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tc-tname">{tr.name}</div>
                    <div className="tc-tsub">
                      {tr.copiers} · {tr.win} win
                    </div>
                  </div>
                  <div className="tc-roi" style={{ marginRight: 2 }}>
                    {tr.roi}
                  </div>
                  <CopyBtn tr={tr} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div className="tc-page">
            <div className="tc-prof">
              <div className="tc-prof-av">AK</div>
              <div className="tc-prof-name">Alex Kim</div>
              <div className="tc-tsub" style={{ marginBottom: 10 }}>
                @alexk · joined 2025
              </div>
              <div className="tc-badge">
                <span style={{ color: "#7cb7ff" }}>◆</span>
                <span>Pro plan</span>
              </div>
            </div>
            <div className="tc-pstats">
              {[
                ["BALANCE", "$18,240", "#fff"],
                ["TOTAL P/L", "+$3,912", "#22c55e"],
                ["ACTIVE BOTS", String(runningCount), "#fff"],
                ["COPYING", String(following.length), "#fff"],
              ].map(([k, v, c]) => (
                <div key={k} className="tc-pstat">
                  <div className="tc-pstat-k">{k}</div>
                  <div className="tc-pstat-v" style={{ color: c }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div className="tc-menu">
              {MENU.map((m) => (
                <div key={m.l} className="tc-menu-row">
                  <span className="tc-menu-ico">{m.g}</span>
                  <span
                    style={{
                      flex: 1,
                      font: "500 15px 'Space Grotesk',sans-serif",
                      color: "#e7eef7",
                    }}
                  >
                    {m.l}
                  </span>
                  <span style={{ color: "rgba(180,200,230,.4)" }}>›</span>
                </div>
              ))}
            </div>
            <div className="tc-notifrow">
              <span
                style={{
                  font: "500 15px 'Space Grotesk',sans-serif",
                  color: "#e7eef7",
                }}
              >
                Push notifications
              </span>
              <Toggle on={notif} onClick={() => setNotif((v) => !v)} />
            </div>
            <div className="tc-logout">Log out</div>
          </div>
        )}

        <div className="tc-disc">
          Trading involves risk of loss. Past performance is not indicative of
          future results.
        </div>
      </div>

      {showBottomNav && (
        <div className="tc-tabbar">
          {(
            [
              ["home", "⌂", "Home"],
              ["bots", "⧉", "Bots"],
              ["copy", "⇄", "Copy"],
              ["profile", "○", "Profile"],
            ] as [Tab, string, string][]
          ).map(([k, g, l]) => (
            <div
              key={k}
              className="tc-tab"
              onClick={() => setTab(k)}
              style={{
                color: tab === k ? "#7cb7ff" : "rgba(180,200,230,.5)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 20 }}>{g}</span>
              <span className="tc-tab-l">{l}</span>
            </div>
          ))}
        </div>
      )}
      {withBezel && <div className="tc-home" />}
    </div>
  );

  return (
    <div className={withBezel ? "tc-root tc-desk" : "tc-root"}>
      <style>{CSS}</style>
      {withBezel ? <div className="tc-phone">{screen}</div> : screen}
    </div>
  );
}

function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M3 17l4-5 3 3 4-7 4 6"
        fill="none"
        stroke="#f4f8ff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CSS = `
.tc-root{font-family:'Space Grotesk',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.tc-desk{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;background:radial-gradient(120% 80% at 50% -5%,#12234a,#070d1c 60%)}
.tc-phone{position:relative;width:390px;height:844px;border-radius:56px;padding:12px;background:linear-gradient(160deg,#1c2530,#0c1016);box-shadow:0 50px 110px -30px rgba(10,20,50,.9),0 0 0 1px rgba(255,255,255,.05)}
.tc-phone .tc-screen{border-radius:46px}
.tc-screen{position:relative;width:100%;height:100%;min-height:100%;overflow:hidden;background:#070d1c;color:#e7eef7}
.tc-status{position:absolute;top:0;left:0;right:0;height:52px;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:0 30px;color:#e7eef7;font:600 15px 'Space Grotesk',sans-serif;pointer-events:none}
.tc-notch{position:absolute;top:18px;left:50%;transform:translateX(-50%);width:112px;height:30px;background:#000;border-radius:16px;z-index:21}
.tc-scroll{position:absolute;inset:0;overflow-y:auto;padding:62px 18px 96px;scrollbar-width:none}
.tc-scroll::-webkit-scrollbar{width:0}
.tc-page{animation:tcFade .28s ease}
.tc-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.tc-brand{display:flex;align-items:center;gap:10px}
.tc-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(150deg,#2f6fed,#1b3a8f);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px -6px rgba(47,111,237,.7)}
.tc-brandname{font:700 19px 'Space Grotesk',sans-serif;color:#e7eef7}
.tc-actions-top{display:flex;align-items:center;gap:12px}
.tc-icobtn{width:38px;height:38px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;position:relative}
.tc-dot{position:absolute;top:8px;right:9px;width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 2px #0a1428}
.tc-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(150deg,#2f6fed,#7cb7ff);display:flex;align-items:center;justify-content:center;font:700 14px 'Space Grotesk',sans-serif;color:#fff}
.tc-hero{position:relative;border-radius:22px;overflow:hidden;padding:24px 22px;background:linear-gradient(150deg,#173b7e,#0c1f45);border:1px solid rgba(90,140,220,.22);margin-bottom:18px}
.tc-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(124,183,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(124,183,255,.07) 1px,transparent 1px);background-size:36px 36px;animation:tcGrid 4s linear infinite;-webkit-mask-image:radial-gradient(90% 80% at 80% 20%,#000,transparent 80%);mask-image:radial-gradient(90% 80% at 80% 20%,#000,transparent 80%)}
.tc-hero-row{position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
.tc-eyebrow{font:600 11px 'JetBrains Mono',monospace;letter-spacing:1.5px;color:#7cb7ff;text-transform:uppercase;margin-bottom:12px}
.tc-h1{font:700 27px/1.12 'Space Grotesk',sans-serif;letter-spacing:-.6px;color:#fff;margin:0 0 10px;text-wrap:balance}
.tc-hero-p{font:400 14px/1.5 'Space Grotesk',sans-serif;color:rgba(210,224,245,.72);margin:0 0 18px}
.tc-cta-light{display:inline-flex;align-items:center;gap:7px;font:600 14.5px 'Space Grotesk',sans-serif;background:#fff;color:#0c1f45;padding:11px 18px;border-radius:11px;text-decoration:none}
.tc-mark-wrap{position:relative;width:96px;height:96px;flex:none;display:flex;align-items:center;justify-content:center;margin-top:4px}
.tc-abs{position:absolute;inset:0}
.tc-ringdash{animation:tcRingDash 2.2s linear infinite}
.tc-ring1{position:absolute;width:70px;height:70px;border-radius:50%;border:1px dashed rgba(124,183,255,.3);border-top-color:#7cb7ff;animation:tcSpin 3s linear infinite}
.tc-orbit{position:absolute;width:7px;height:7px;border-radius:50%;background:#7cb7ff;box-shadow:0 0 10px 2px rgba(124,183,255,.9);animation:tcOrbit 3.2s linear infinite}
.tc-core{width:40px;height:40px;border-radius:13px;background:linear-gradient(150deg,#2f6fed,#1b3a8f);display:flex;align-items:center;justify-content:center;animation:tcPulse 2s ease-in-out infinite,tcGlow 2s ease-in-out infinite}
.tc-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:22px}
.tc-stat{background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:14px;padding:13px 12px;text-align:center}
.tc-stat-v{font:700 18px 'Space Grotesk',sans-serif;color:#fff}
.tc-stat-k{font:500 10.5px 'JetBrains Mono',monospace;color:rgba(180,200,230,.55);margin-top:2px}
.tc-quick{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:26px}
.tc-quick-item{display:flex;flex-direction:column;align-items:center;gap:8px}
.tc-quick-ico{width:100%;aspect-ratio:1;border-radius:16px;background:rgba(47,111,237,.12);border:1px solid rgba(47,111,237,.25);display:flex;align-items:center;justify-content:center;color:#7cb7ff;font-size:22px}
.tc-quick-l{font:500 11.5px 'Space Grotesk',sans-serif;color:#c3d2e8;text-align:center}
.tc-secthd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.tc-secttl{font:600 18px 'Space Grotesk',sans-serif;color:#e7eef7;margin:0}
.tc-seeall{font:600 13px 'Space Grotesk',sans-serif;color:#7cb7ff}
.tc-list{display:flex;flex-direction:column;gap:11px}
.tc-trader{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:15px;padding:13px 14px}
.tc-tavatar{width:42px;height:42px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font:700 15px 'Space Grotesk',sans-serif;color:#fff}
.tc-tname{font:600 15px 'Space Grotesk',sans-serif;color:#e7eef7}
.tc-tsub{font:500 11.5px 'JetBrains Mono',monospace;color:rgba(180,200,230,.5)}
.tc-roi{font:700 16px 'JetBrains Mono',monospace;color:#22c55e}
.tc-roi-k{font:500 10px 'JetBrains Mono',monospace;color:rgba(180,200,230,.45)}
.tc-btn{cursor:pointer;font:600 13px 'Space Grotesk',sans-serif;padding:8px 14px;border-radius:10px;white-space:nowrap}
.tc-pl-k{font:500 12px 'JetBrains Mono',monospace;color:rgba(200,215,235,.6);letter-spacing:1px;margin-bottom:6px}
.tc-pl-v{font:700 32px 'Space Grotesk',sans-serif;color:#fff}
.tc-pl-pct{font:600 14px 'JetBrains Mono',monospace;color:#22c55e}
.tc-pl-sub{font:500 12.5px 'Space Grotesk',sans-serif;color:rgba(200,215,235,.6);margin-top:6px}
.tc-newbot{cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font:600 15px 'Space Grotesk',sans-serif;background:linear-gradient(150deg,#2f6fed,#1e51c4);color:#fff;padding:13px;border-radius:13px;margin-bottom:18px;box-shadow:0 12px 26px -10px rgba(47,111,237,.7)}
.tc-botcard{background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:16px;padding:15px 16px}
.tc-botrow{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.tc-boticon{width:40px;height:40px;border-radius:12px;background:rgba(47,111,237,.14);border:1px solid rgba(47,111,237,.25);display:flex;align-items:center;justify-content:center;color:#7cb7ff;font-size:18px}
.tc-botname{font:600 15.5px 'Space Grotesk',sans-serif;color:#e7eef7}
.tc-botfoot{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid rgba(90,140,220,.1)}
.tc-sdot{width:7px;height:7px;border-radius:50%}
.tc-switch{cursor:pointer;width:46px;height:27px;border-radius:14px;padding:3px;display:flex;transition:all .2s ease}
.tc-knob{width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.tc-follow{background:linear-gradient(160deg,rgba(23,59,126,.5),rgba(12,31,69,.5));border:1px solid rgba(47,111,237,.3);border-radius:15px;padding:14px 15px}
.tc-followmeta{display:flex;justify-content:space-between;font:500 11.5px 'JetBrains Mono',monospace;color:rgba(200,215,235,.6)}
.tc-prof{display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:22px}
.tc-prof-av{width:78px;height:78px;border-radius:50%;background:linear-gradient(150deg,#2f6fed,#7cb7ff);display:flex;align-items:center;justify-content:center;font:700 28px 'Space Grotesk',sans-serif;color:#fff;box-shadow:0 12px 30px -8px rgba(47,111,237,.7);margin-bottom:14px}
.tc-prof-name{font:700 21px 'Space Grotesk',sans-serif;color:#fff}
.tc-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:999px;background:linear-gradient(150deg,rgba(47,111,237,.2),rgba(124,183,255,.15));border:1px solid rgba(124,183,255,.35);font:600 12.5px 'Space Grotesk',sans-serif;color:#cfe0f7}
.tc-pstats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:22px}
.tc-pstat{background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:15px;padding:16px}
.tc-pstat-k{font:500 11px 'JetBrains Mono',monospace;color:rgba(180,200,230,.5);letter-spacing:.5px;margin-bottom:6px}
.tc-pstat-v{font:700 20px 'Space Grotesk',sans-serif}
.tc-menu{background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:16px;overflow:hidden;margin-bottom:16px}
.tc-menu-row{display:flex;align-items:center;gap:13px;padding:15px 16px;border-bottom:1px solid rgba(90,140,220,.08);cursor:pointer}
.tc-menu-ico{width:22px;text-align:center;color:#7cb7ff;font-size:16px}
.tc-notifrow{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(90,140,220,.14);border-radius:16px;padding:15px 16px;margin-bottom:16px}
.tc-logout{text-align:center;font:600 14px 'Space Grotesk',sans-serif;color:#ff8f9c;padding:14px;border:1px solid rgba(255,107,122,.25);border-radius:14px;cursor:pointer}
.tc-disc{text-align:center;font:400 10.5px/1.5 'Space Grotesk',sans-serif;color:rgba(160,180,210,.35);margin-top:24px}
.tc-tabbar{position:absolute;left:0;right:0;bottom:0;z-index:15;height:82px;padding:10px 24px 22px;background:linear-gradient(180deg,rgba(7,13,28,.4),rgba(7,13,28,.96) 40%);backdrop-filter:blur(12px);border-top:1px solid rgba(90,140,220,.12);display:flex;align-items:flex-start;justify-content:space-between}
.tc-tab{display:flex;flex-direction:column;align-items:center;gap:5px;flex:1}
.tc-tab-l{font:600 10.5px 'Space Grotesk',sans-serif}
.tc-home{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:126px;height:5px;border-radius:3px;background:rgba(255,255,255,.3);z-index:22}
@keyframes tcFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes tcGrid{to{background-position:0 -40px,-40px 0}}
@keyframes tcPulse{0%,100%{transform:scale(1);opacity:.92}50%{transform:scale(1.1);opacity:1}}
@keyframes tcGlow{0%,100%{box-shadow:0 0 18px 3px rgba(47,111,237,.5)}50%{box-shadow:0 0 30px 7px rgba(47,111,237,.72)}}
@keyframes tcSpin{to{transform:rotate(360deg)}}
@keyframes tcRingDash{to{stroke-dashoffset:-360}}
@keyframes tcOrbit{from{transform:rotate(0) translateX(40px) rotate(0)}to{transform:rotate(360deg) translateX(40px) rotate(-360deg)}}
`;
