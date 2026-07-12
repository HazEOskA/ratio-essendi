/**
 * Ratio Essendi live command center.
 * Self-contained HTML shell: data comes from /api/state, operator controls POST
 * to /api/action, and the report button POSTs to /api/report.
 *
 * Keep the embedded browser script free from template-literal interpolation;
 * the whole page is returned from one TypeScript template string.
 */
export function renderLiveShell(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#020708">
<title>Ratio Essendi — OsaTechGPT Command Center</title>
<style>
  :root {
    color-scheme: dark;
    --bg: #020708;
    --bg-soft: #061013;
    --panel: rgba(5, 15, 18, .88);
    --panel-strong: rgba(7, 20, 23, .96);
    --line: rgba(71, 234, 255, .20);
    --line-strong: rgba(71, 234, 255, .52);
    --text: #ecfbff;
    --muted: #789099;
    --cyan: #19e6f2;
    --cyan-2: #00a7bd;
    --green: #43ff88;
    --green-soft: rgba(67, 255, 136, .12);
    --magenta: #ff58d3;
    --magenta-soft: rgba(255, 88, 211, .12);
    --amber: #ffbd54;
    --red: #ff456e;
    --shadow-cyan: 0 0 18px rgba(25, 230, 242, .24), 0 0 52px rgba(25, 230, 242, .08);
    --shadow-green: 0 0 18px rgba(67, 255, 136, .28), 0 0 46px rgba(67, 255, 136, .10);
    --sidebar: 252px;
    --radius: 4px;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    min-height: 100vh;
    overflow-x: hidden;
    background:
      radial-gradient(circle at 86% 8%, rgba(25, 230, 242, .10), transparent 30%),
      radial-gradient(circle at 68% 74%, rgba(255, 88, 211, .055), transparent 28%),
      linear-gradient(145deg, #010405 0%, #031013 52%, #020607 100%);
    color: var(--text);
    font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    opacity: .18;
    background-image:
      linear-gradient(rgba(25, 230, 242, .07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(25, 230, 242, .055) 1px, transparent 1px);
    background-size: 42px 42px;
    mask-image: radial-gradient(circle at center, black 28%, transparent 86%);
    z-index: 0;
  }
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 20;
    opacity: .05;
    background: repeating-linear-gradient(0deg, rgba(255,255,255,.45) 0, rgba(255,255,255,.45) 1px, transparent 1px, transparent 4px);
    mix-blend-mode: overlay;
  }
  button, input { font: inherit; }
  button { color: inherit; }
  ::selection { background: rgba(25, 230, 242, .32); color: white; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: #020607; }
  ::-webkit-scrollbar-thumb { background: #14343a; border: 2px solid #020607; }

  .app-shell { min-height: 100vh; position: relative; z-index: 1; }
  .ambient-orb {
    position: fixed;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    filter: blur(95px);
    pointer-events: none;
    opacity: .07;
    animation: ambientDrift 15s ease-in-out infinite alternate;
    background: var(--cyan);
    right: -160px;
    top: 14vh;
  }
  @keyframes ambientDrift { to { transform: translate(-100px, 180px) scale(1.18); opacity: .11; } }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--sidebar);
    background: rgba(2, 7, 8, .94);
    border-right: 1px solid var(--line);
    backdrop-filter: blur(18px);
    display: flex;
    flex-direction: column;
    z-index: 10;
  }
  .brand {
    min-height: 112px;
    padding: 22px 20px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid var(--line);
    position: relative;
  }
  .brand::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background: linear-gradient(90deg, var(--cyan), transparent 78%);
    box-shadow: 0 0 15px var(--cyan);
  }
  .brand-mark {
    width: 48px;
    height: 48px;
    flex: 0 0 48px;
    display: grid;
    place-items: center;
    position: relative;
    color: var(--cyan);
    filter: drop-shadow(0 0 9px rgba(25,230,242,.62));
  }
  .brand-mark::before,
  .brand-mark::after {
    content: "";
    position: absolute;
    inset: 5px;
    border: 2px solid currentColor;
    transform: rotate(30deg);
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  }
  .brand-mark::after { inset: 13px; transform: rotate(-30deg); border-color: var(--green); }
  .brand-core { width: 7px; height: 7px; background: white; box-shadow: 0 0 12px var(--cyan), 0 0 24px var(--green); border-radius: 50%; }
  .brand-name { font: 800 19px/1.05 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .14em; text-transform: uppercase; }
  .brand-name span { display: block; color: var(--cyan); }
  .brand-name span + span { color: white; }
  .brand-sub { color: #57bdc8; font: 9px/1.4 ui-monospace, monospace; letter-spacing: .20em; margin-top: 7px; text-transform: uppercase; }

  .side-nav { padding: 18px 12px; display: grid; gap: 6px; }
  .nav-btn {
    width: 100%;
    min-height: 48px;
    padding: 0 13px;
    border: 1px solid transparent;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    text-align: left;
    color: #789099;
    font: 700 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
    letter-spacing: .08em;
    text-transform: uppercase;
    transition: .18s ease;
    position: relative;
  }
  .nav-btn:hover { color: white; border-color: rgba(25,230,242,.20); background: rgba(25,230,242,.045); transform: translateX(2px); }
  .nav-btn.active { color: var(--cyan); border-color: rgba(25,230,242,.36); background: linear-gradient(90deg, rgba(25,230,242,.12), rgba(25,230,242,.02)); box-shadow: inset 3px 0 0 var(--cyan), 0 0 22px rgba(25,230,242,.08); }
  .nav-icon { width: 22px; height: 22px; display: grid; place-items: center; font-size: 16px; color: currentColor; }
  .nav-pulse { margin-left: auto; width: 6px; height: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 11px var(--cyan); }

  .side-spacer { flex: 1; }
  .side-panel { margin: 0 14px 12px; padding: 14px; border: 1px solid rgba(25,230,242,.20); background: rgba(4,17,20,.76); position: relative; overflow: hidden; }
  .side-panel::before { content:""; position:absolute; inset:0; background:linear-gradient(120deg, transparent 50%, rgba(25,230,242,.04)); pointer-events:none; }
  .side-kicker { font: 700 9px/1 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: #66868e; }
  .health-row { display:flex; align-items:flex-end; justify-content:space-between; gap:10px; margin-top:8px; }
  .health-number { font: 500 30px/1 ui-monospace, monospace; color: var(--green); text-shadow: 0 0 16px rgba(67,255,136,.40); }
  .health-label { color: var(--green); font: 700 9px/1.4 ui-monospace, monospace; text-transform: uppercase; letter-spacing:.08em; text-align:right; }
  .health-track { height: 3px; background: #0a1d20; margin-top: 12px; overflow:hidden; }
  .health-fill { height:100%; width:0; background:linear-gradient(90deg,var(--green),var(--cyan)); box-shadow:0 0 12px var(--green); transition: width .5s ease; }
  .operator { display:flex; gap:10px; align-items:center; }
  .operator-avatar { width:38px; height:38px; border:1px solid var(--line-strong); display:grid; place-items:center; background:radial-gradient(circle, rgba(25,230,242,.26), rgba(2,8,10,.8)); color:var(--cyan); font:800 14px ui-monospace, monospace; box-shadow:inset 0 0 18px rgba(25,230,242,.10); }
  .operator-name { font:800 12px ui-monospace,monospace; letter-spacing:.05em; }
  .operator-status { color:var(--green); font:700 9px ui-monospace,monospace; margin-top:3px; text-transform:uppercase; }
  .side-cta { margin: 2px 14px 14px; min-height: 46px; border: 1px solid var(--cyan); background: linear-gradient(90deg, #10c8d5, #23eff8); color:#001012; cursor:pointer; font:900 11px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; box-shadow:0 0 20px rgba(25,230,242,.32); transition:.18s ease; }
  .side-cta:hover { transform: translateY(-2px); box-shadow:0 0 30px rgba(25,230,242,.48); }
  .side-foot { padding: 0 18px 18px; color:#49656c; font:9px/1.6 ui-monospace,monospace; text-transform:uppercase; letter-spacing:.08em; }

  .main { margin-left: var(--sidebar); min-width: 0; }
  .topbar {
    height: 80px;
    position: sticky;
    top: 0;
    z-index: 8;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:18px;
    padding: 0 28px;
    background: rgba(2, 7, 8, .82);
    border-bottom: 1px solid var(--line);
    backdrop-filter: blur(18px);
  }
  .top-metrics { display:flex; align-items:stretch; min-width:0; overflow:auto; }
  .top-metric { padding: 0 22px; min-width:132px; border-right:1px solid rgba(25,230,242,.13); }
  .top-metric:first-child { padding-left:0; }
  .top-label { color:#60777e; font:700 8px ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase; }
  .top-value { margin-top:6px; color:#d9f9ff; font:800 11px ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
  .top-value.ok { color:var(--green); text-shadow:0 0 12px rgba(67,255,136,.32); }
  .top-value.info { color:var(--cyan); }
  .top-value.magenta { color:var(--magenta); }
  .status-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:var(--green); box-shadow:0 0 12px var(--green); margin-right:8px; animation:pulseDot 1.8s ease-in-out infinite; }
  @keyframes pulseDot { 50% { opacity:.45; transform:scale(.7); } }
  .top-actions { display:flex; align-items:center; gap:10px; flex:0 0 auto; }
  .icon-btn, .ghost-btn, .primary-btn, .danger-btn {
    min-height: 40px;
    border:1px solid rgba(25,230,242,.28);
    background:rgba(6,18,20,.84);
    color:#bdeaf0;
    cursor:pointer;
    font:800 10px ui-monospace,monospace;
    text-transform:uppercase;
    letter-spacing:.10em;
    transition:.18s ease;
  }
  .icon-btn { width:42px; padding:0; display:grid; place-items:center; font-size:16px; }
  .ghost-btn { padding:0 16px; }
  .primary-btn { padding:0 22px; color:#001012; background:linear-gradient(90deg,#13c9d5,#20edf7); border-color:var(--cyan); box-shadow:var(--shadow-cyan); }
  .danger-btn { padding:0 16px; color:#ffd6df; border-color:rgba(255,69,110,.35); background:rgba(255,69,110,.08); }
  .icon-btn:hover,.ghost-btn:hover { color:white; border-color:var(--cyan); box-shadow:0 0 18px rgba(25,230,242,.14); }
  .primary-btn:hover { transform:translateY(-2px); box-shadow:0 0 28px rgba(25,230,242,.42); }
  .danger-btn:hover { border-color:var(--red); box-shadow:0 0 18px rgba(255,69,110,.20); }

  .content { padding: 18px 24px 64px; max-width: 1780px; margin:0 auto; }
  .panel {
    position:relative;
    background:linear-gradient(145deg, rgba(6,18,21,.94), rgba(2,9,11,.88));
    border:1px solid var(--line);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.015), 0 18px 70px rgba(0,0,0,.22);
  }
  .panel::before, .panel::after {
    content:"";
    position:absolute;
    width:20px;
    height:20px;
    pointer-events:none;
  }
  .panel::before { left:-1px; top:-1px; border-left:2px solid var(--cyan); border-top:2px solid var(--cyan); box-shadow:-3px -3px 16px rgba(25,230,242,.16); }
  .panel::after { right:-1px; bottom:-1px; border-right:2px solid rgba(25,230,242,.55); border-bottom:2px solid rgba(25,230,242,.55); }

  .hero { min-height: 316px; display:grid; grid-template-columns:minmax(0,1.15fr) minmax(390px,.85fr); overflow:hidden; border-color:rgba(25,230,242,.42); box-shadow:var(--shadow-cyan); }
  .hero-copy { padding: 35px 40px 34px; position:relative; z-index:2; }
  .eyebrow { color:var(--cyan); font:800 9px ui-monospace,monospace; letter-spacing:.16em; text-transform:uppercase; }
  .hero h1 { margin:16px 0 12px; max-width:720px; font-size:clamp(38px,4vw,67px); line-height:.97; letter-spacing:-.055em; text-transform:uppercase; }
  .hero h1 span { color:var(--cyan); text-shadow:0 0 20px rgba(25,230,242,.42), 0 0 42px rgba(25,230,242,.13); }
  .hero p { color:#a3b8bd; max-width:640px; font-size:15px; margin:0; }
  .hero p strong { color:white; }
  .hero-actions { display:flex; gap:12px; margin-top:27px; flex-wrap:wrap; }
  .hero-status-strip { margin-top:28px; display:flex; gap:24px; flex-wrap:wrap; }
  .mini-metric { min-width:102px; }
  .mini-value { font:700 19px ui-monospace,monospace; color:white; }
  .mini-value.ok { color:var(--green); }
  .mini-label { margin-top:3px; color:#5b767c; font:700 8px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.12em; }

  .hero-visual { position:relative; min-height:316px; overflow:hidden; display:grid; place-items:center; background:radial-gradient(circle at 48% 50%, rgba(25,230,242,.10), transparent 48%); }
  .hero-visual::before { content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(25,230,242,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(25,230,242,.05) 1px,transparent 1px); background-size:24px 24px; mask-image:linear-gradient(90deg,transparent,black 30%); }
  .system-core { width:230px; height:230px; position:relative; display:grid; place-items:center; filter:drop-shadow(0 0 15px rgba(25,230,242,.22)); }
  .system-core .ring { position:absolute; border-radius:50%; border:1px solid rgba(25,230,242,.30); }
  .system-core .r1 { inset:0; animation:spin 18s linear infinite; border-style:dashed; }
  .system-core .r2 { inset:25px; animation:spinReverse 12s linear infinite; border-color:rgba(67,255,136,.32); box-shadow:inset 0 0 26px rgba(25,230,242,.06); }
  .system-core .r3 { inset:53px; animation:spin 8s linear infinite; border-width:2px; }
  .system-core .core-node { width:74px; height:74px; border:1px solid var(--cyan); transform:rotate(45deg); display:grid; place-items:center; background:rgba(2,15,18,.86); box-shadow:0 0 26px rgba(25,230,242,.34),inset 0 0 22px rgba(25,230,242,.16); }
  .system-core .core-node::before { content:"RE"; transform:rotate(-45deg); color:white; font:900 21px ui-monospace,monospace; letter-spacing:.04em; text-shadow:0 0 13px var(--cyan); }
  .system-core .orbit-dot { position:absolute; width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 12px var(--green); top:14px; left:50%; transform:translateX(-50%); animation:pulseDot 1.6s ease-in-out infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes spinReverse { to { transform:rotate(-360deg); } }
  .visual-label { position:absolute; right:22px; top:18px; color:#63848b; font:700 8px ui-monospace,monospace; letter-spacing:.14em; text-transform:uppercase; }
  .visual-status { position:absolute; right:22px; bottom:18px; display:flex; align-items:center; gap:8px; color:var(--green); font:800 9px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.12em; }

  .section-head { display:flex; align-items:end; justify-content:space-between; gap:14px; margin:24px 0 12px; }
  .section-title { margin:0; font:800 17px/1 ui-monospace,monospace; letter-spacing:.10em; text-transform:uppercase; }
  .section-title small { display:block; color:#567077; font:700 8px/1.5 ui-monospace,monospace; letter-spacing:.16em; margin-bottom:7px; }
  .live-pill { display:inline-flex; align-items:center; gap:8px; border:1px solid rgba(67,255,136,.25); color:var(--green); background:rgba(67,255,136,.06); padding:6px 10px; font:800 8px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.12em; }

  .cells-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
  .cell-card {
    min-height:238px;
    padding:18px;
    background:linear-gradient(160deg,rgba(7,23,26,.92),rgba(3,10,12,.92));
    border:1px solid rgba(25,230,242,.28);
    position:relative;
    overflow:hidden;
    cursor:pointer;
    transition:.18s ease;
  }
  .cell-card::before { content:""; position:absolute; inset:0; opacity:.08; background:linear-gradient(135deg,var(--cyan),transparent 38%); pointer-events:none; }
  .cell-card::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px; background:linear-gradient(90deg,var(--cyan),transparent 72%); box-shadow:0 0 12px rgba(25,230,242,.42); }
  .cell-card:hover { transform:translateY(-3px); border-color:var(--cyan); box-shadow:0 0 24px rgba(25,230,242,.16); }
  .cell-card.health-healthy { border-color:rgba(67,255,136,.36); }
  .cell-card.health-healthy::after { background:linear-gradient(90deg,var(--green),transparent 72%); box-shadow:0 0 12px rgba(67,255,136,.45); }
  .cell-card.health-failed,.cell-card.health-quarantined { border-color:rgba(255,69,110,.52); background:linear-gradient(160deg,rgba(35,8,16,.88),rgba(8,4,8,.94)); }
  .cell-card.health-degraded,.cell-card.health-recovering { border-color:rgba(255,189,84,.42); }
  .cell-top { display:flex; justify-content:space-between; gap:10px; }
  .domain-icon { width:34px; height:34px; display:grid; place-items:center; color:var(--cyan); border:1px solid currentColor; background:rgba(25,230,242,.045); font:900 16px ui-monospace,monospace; box-shadow:inset 0 0 13px rgba(25,230,242,.07); }
  .health-healthy .domain-icon { color:var(--green); background:rgba(67,255,136,.045); }
  .cell-code { color:#4d686f; font:700 8px ui-monospace,monospace; letter-spacing:.10em; text-transform:uppercase; }
  .cell-card h3 { margin:19px 0 7px; font-size:17px; line-height:1.08; text-transform:uppercase; letter-spacing:-.02em; }
  .cell-purpose { color:#7f969c; font-size:11px; min-height:49px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .cell-signal { display:flex; align-items:end; gap:12px; margin-top:15px; }
  .cell-number { color:var(--cyan); font:600 20px/1 ui-monospace,monospace; text-shadow:0 0 12px rgba(25,230,242,.24); }
  .health-healthy .cell-number { color:var(--green); }
  .cell-number-label { color:#4f6a70; font:700 8px/1.3 ui-monospace,monospace; text-transform:uppercase; letter-spacing:.10em; }
  .signal-bars { height:28px; flex:1; display:flex; align-items:end; gap:2px; opacity:.52; }
  .signal-bars i { flex:1; min-width:2px; background:var(--cyan); box-shadow:0 0 5px rgba(25,230,242,.32); animation:barPulse 2s ease-in-out infinite alternate; }
  .health-healthy .signal-bars i { background:var(--green); }
  @keyframes barPulse { to { opacity:.45; transform:scaleY(.72); transform-origin:bottom; } }
  .cell-foot { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:16px; }
  .open-module { flex:1; height:32px; border:1px solid rgba(25,230,242,.22); background:rgba(2,10,12,.72); color:#94b2b8; cursor:pointer; font:800 8px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; }
  .open-module:hover { color:white; border-color:var(--cyan); }

  .badge { display:inline-flex; align-items:center; gap:6px; min-height:22px; padding:2px 8px; border:1px solid transparent; font:800 8px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.08em; white-space:nowrap; }
  .badge::before { content:""; width:5px; height:5px; border-radius:50%; background:currentColor; box-shadow:0 0 8px currentColor; }
  .badge.ok { color:var(--green); background:rgba(67,255,136,.07); border-color:rgba(67,255,136,.24); }
  .badge.warn { color:var(--amber); background:rgba(255,189,84,.07); border-color:rgba(255,189,84,.24); }
  .badge.bad { color:var(--red); background:rgba(255,69,110,.07); border-color:rgba(255,69,110,.28); }
  .badge.muted { color:#71878c; background:rgba(113,135,140,.06); border-color:rgba(113,135,140,.18); }
  .badge.info { color:var(--cyan); background:rgba(25,230,242,.07); border-color:rgba(25,230,242,.24); }
  .badge.magenta { color:var(--magenta); background:var(--magenta-soft); border-color:rgba(255,88,211,.25); }

  .operations-grid { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(320px,.72fr) minmax(220px,.38fr); gap:12px; }
  .events-panel, .attention-panel, .bus-panel, .agents-panel, .report-panel { padding:18px; }
  .panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
  .panel-title { font:800 12px ui-monospace,monospace; letter-spacing:.10em; text-transform:uppercase; }
  .panel-kicker { color:#5a777d; font:700 8px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; }
  .table-wrap { overflow:auto; border:1px solid rgba(25,230,242,.13); }
  table { width:100%; border-collapse:collapse; min-width:620px; }
  th,td { text-align:left; padding:11px 12px; border-bottom:1px solid rgba(25,230,242,.10); vertical-align:middle; }
  th { color:#5f7a80; background:rgba(2,9,11,.74); font:800 8px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; }
  td { color:#b8c9cd; font-size:11px; }
  tr:last-child td { border-bottom:0; }
  tr.evt:hover td { background:rgba(25,230,242,.025); }
  tr.evt.bad td:first-child { box-shadow:inset 2px 0 0 var(--red); }
  tr.evt.ok td:first-child { box-shadow:inset 2px 0 0 var(--green); }
  tr.evt.warn td:first-child { box-shadow:inset 2px 0 0 var(--amber); }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .dim { color:#627b81; }
  .event-time { color:var(--cyan); font:700 9px ui-monospace,monospace; white-space:nowrap; }

  .stack { display:grid; gap:10px; }
  .action-card { border:1px solid rgba(255,88,211,.24); background:linear-gradient(145deg,rgba(31,7,26,.45),rgba(7,11,13,.84)); padding:14px; position:relative; overflow:hidden; }
  .action-card::after { content:""; position:absolute; top:0; right:0; bottom:0; width:2px; background:var(--magenta); box-shadow:0 0 13px var(--magenta); }
  .action-card.ok-card { border-color:rgba(67,255,136,.22); background:rgba(67,255,136,.035); }
  .action-card.ok-card::after { background:var(--green); box-shadow:0 0 13px var(--green); }
  .action-label { color:var(--magenta); font:800 8px ui-monospace,monospace; letter-spacing:.12em; text-transform:uppercase; }
  .action-card.ok-card .action-label { color:var(--green); }
  .action-title { margin:8px 0 5px; font-weight:800; color:white; }
  .action-copy { color:#8da2a7; font-size:11px; }
  .action-row { display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
  button.b { min-height:32px; padding:0 12px; cursor:pointer; border:1px solid rgba(25,230,242,.25); background:rgba(3,12,14,.88); color:#a9c9ce; font:800 8px ui-monospace,monospace; letter-spacing:.10em; text-transform:uppercase; }
  button.b:hover { border-color:var(--cyan); color:white; }
  button.b.ok { color:#00100a; border-color:var(--green); background:var(--green); box-shadow:0 0 16px rgba(67,255,136,.20); }
  button.b.bad { color:#ffd8e1; border-color:rgba(255,69,110,.40); background:rgba(255,69,110,.10); }
  button.b.warn { color:#fff0cf; border-color:rgba(255,189,84,.38); background:rgba(255,189,84,.08); }

  .bus-core { width:138px; height:138px; margin:4px auto 18px; position:relative; display:grid; place-items:center; }
  .bus-core::before,.bus-core::after { content:""; position:absolute; border-radius:50%; border:1px solid rgba(25,230,242,.28); }
  .bus-core::before { inset:0; border-style:dashed; animation:spin 15s linear infinite; }
  .bus-core::after { inset:22px; border-color:rgba(67,255,136,.26); animation:spinReverse 9s linear infinite; }
  .bus-brain { width:54px; height:54px; border:1px solid var(--cyan); border-radius:50%; background:radial-gradient(circle,rgba(25,230,242,.24),rgba(3,11,13,.92)); display:grid; place-items:center; color:var(--cyan); font:900 13px ui-monospace,monospace; box-shadow:0 0 24px rgba(25,230,242,.22); }
  .bus-list { display:grid; gap:10px; }
  .bus-row { display:flex; justify-content:space-between; gap:10px; padding-bottom:9px; border-bottom:1px solid rgba(25,230,242,.10); }
  .bus-row span:first-child { color:#58737a; font:700 8px ui-monospace,monospace; letter-spacing:.10em; text-transform:uppercase; }
  .bus-row strong { color:var(--cyan); font:700 10px ui-monospace,monospace; }
  .bus-row strong.ok { color:var(--green); }

  .lower-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(330px,.75fr); gap:12px; margin-top:12px; }
  .agents-panel { min-width:0; }
  .report-panel { min-width:0; }
  #report { min-height:160px; white-space:pre-wrap; color:#9db2b7; font:11px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace; border:1px solid rgba(25,230,242,.13); padding:14px; background:rgba(1,7,8,.62); overflow:auto; }
  .report-toolbar { display:flex; gap:8px; flex-wrap:wrap; }

  .empty { color:#617a80; border:1px dashed rgba(25,230,242,.14); padding:18px; text-align:center; font:10px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.08em; }
  .error-banner { display:none; margin-bottom:12px; padding:10px 12px; color:#ffd7df; border:1px solid rgba(255,69,110,.38); background:rgba(255,69,110,.08); font:800 10px ui-monospace,monospace; }

  .drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.58); backdrop-filter:blur(4px); z-index:30; opacity:0; visibility:hidden; transition:.18s ease; }
  .drawer-backdrop.open { opacity:1; visibility:visible; }
  .drawer { position:fixed; top:0; right:0; bottom:0; width:min(480px,92vw); z-index:31; background:#031012; border-left:1px solid var(--line-strong); box-shadow:-24px 0 80px rgba(0,0,0,.58),-4px 0 28px rgba(25,230,242,.10); padding:24px; transform:translateX(102%); transition:.22s ease; overflow:auto; }
  .drawer.open { transform:translateX(0); }
  .drawer-head { display:flex; align-items:start; justify-content:space-between; gap:12px; padding-bottom:18px; border-bottom:1px solid var(--line); }
  .drawer h2 { margin:5px 0 0; font-size:26px; line-height:1; text-transform:uppercase; }
  .drawer-close { width:38px; height:38px; border:1px solid var(--line); background:#06171a; color:var(--cyan); cursor:pointer; font-size:18px; }
  .detail-block { margin-top:18px; padding:14px; border:1px solid rgba(25,230,242,.15); background:rgba(1,8,10,.54); }
  .detail-key { color:#57737a; font:800 8px ui-monospace,monospace; text-transform:uppercase; letter-spacing:.12em; }
  .detail-value { margin-top:7px; color:#c9d9dc; font-size:12px; }
  .tag-list { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .tag { padding:4px 7px; border:1px solid rgba(25,230,242,.18); color:#79abb3; font:700 8px ui-monospace,monospace; text-transform:uppercase; }

  .mobile-brand { display:none; }
  @media (max-width: 1240px) {
    .cells-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .operations-grid { grid-template-columns:minmax(0,1.3fr) minmax(320px,.7fr); }
    .bus-panel { grid-column:1 / -1; }
    .bus-panel .bus-layout { display:flex; align-items:center; gap:30px; }
    .bus-core { margin:0; flex:0 0 138px; }
    .bus-list { flex:1; }
  }
  @media (max-width: 980px) {
    :root { --sidebar: 84px; }
    .brand { padding:18px; justify-content:center; }
    .brand-copy,.nav-btn span:not(.nav-icon),.nav-pulse,.side-panel,.side-cta,.side-foot { display:none; }
    .side-nav { padding:16px 10px; }
    .nav-btn { padding:0; justify-content:center; }
    .hero { grid-template-columns:1fr; }
    .hero-visual { min-height:250px; border-top:1px solid var(--line); }
    .lower-grid { grid-template-columns:1fr; }
    .top-metric { min-width:115px; padding:0 14px; }
  }
  @media (max-width: 720px) {
    :root { --sidebar: 0px; }
    .sidebar { display:none; }
    .main { margin-left:0; }
    .topbar { height:auto; min-height:68px; padding:12px 14px; align-items:center; }
    .mobile-brand { display:flex; align-items:center; gap:10px; font:900 12px ui-monospace,monospace; letter-spacing:.08em; text-transform:uppercase; }
    .mobile-brand b { color:var(--cyan); }
    .top-metrics { display:none; }
    .top-actions .icon-btn,.top-actions .ghost-btn { display:none; }
    .top-actions .primary-btn { min-height:38px; padding:0 13px; }
    .content { padding:12px 10px 42px; }
    .hero-copy { padding:26px 20px 24px; }
    .hero h1 { font-size:40px; }
    .hero-visual { min-height:220px; }
    .system-core { transform:scale(.78); }
    .cells-grid { grid-template-columns:1fr; }
    .cell-card { min-height:215px; }
    .operations-grid { grid-template-columns:1fr; }
    .bus-panel { grid-column:auto; }
    .bus-panel .bus-layout { display:block; }
    .bus-core { margin:4px auto 18px; }
    .section-head { align-items:start; }
  }
</style>
</head>
<body>
<div class="app-shell">
  <div class="ambient-orb"></div>

  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark"><div class="brand-core"></div></div>
      <div class="brand-copy">
        <div class="brand-name"><span>Ratio</span><span>Essendi</span></div>
        <div class="brand-sub">OsaTechGPT Command System</div>
      </div>
    </div>

    <nav class="side-nav" aria-label="Command navigation">
      <button class="nav-btn active" data-scroll="command"><span class="nav-icon">▦</span><span>Command</span><i class="nav-pulse"></i></button>
      <button class="nav-btn" data-scroll="intelligence"><span class="nav-icon">◉</span><span>Intelligence</span></button>
      <button class="nav-btn" data-scroll="infrastructure"><span class="nav-icon">⌘</span><span>Infrastructure</span></button>
      <button class="nav-btn" data-scroll="personnel"><span class="nav-icon">◎</span><span>Personnel</span></button>
      <button class="nav-btn" data-scroll="logs"><span class="nav-icon">≡</span><span>System logs</span></button>
    </nav>

    <div class="side-spacer"></div>

    <div class="side-panel">
      <div class="side-kicker">System health</div>
      <div class="health-row">
        <div class="health-number" id="side-health">—</div>
        <div class="health-label" id="side-health-label">Awaiting<br>telemetry</div>
      </div>
      <div class="health-track"><div class="health-fill" id="side-health-fill"></div></div>
    </div>

    <div class="side-panel operator">
      <div class="operator-avatar">OSA</div>
      <div>
        <div class="operator-name">OPERATOR-01</div>
        <div class="operator-status"><span class="status-dot"></span>God-Boss online</div>
      </div>
    </div>

    <button class="side-cta" id="btn-findclient">Find Client</button>
    <div class="side-foot">Built by OsaTechGPT<br>Ratio Essendi v0.1</div>
  </aside>

  <main class="main">
    <header class="topbar">
      <div class="mobile-brand"><b>RE</b> / OsaTechGPT</div>
      <div class="top-metrics">
        <div class="top-metric"><div class="top-label">Mode</div><div class="top-value magenta">Autonomous</div></div>
        <div class="top-metric"><div class="top-label">Status</div><div class="top-value ok" id="top-status"><span class="status-dot"></span>Connecting</div></div>
        <div class="top-metric"><div class="top-label">Operator</div><div class="top-value">OSA / God-Boss</div></div>
        <div class="top-metric"><div class="top-label">Uptime</div><div class="top-value info" id="uptime">00:00:00</div></div>
        <div class="top-metric"><div class="top-label">Last sync</div><div class="top-value" id="last-sync">—</div></div>
      </div>
      <div class="top-actions">
        <button class="icon-btn" id="btn-tick" title="Run one simulation tick">↻</button>
        <button class="icon-btn" id="btn-pause" title="Pause simulation">Ⅱ</button>
        <button class="ghost-btn" id="btn-report">LLM Briefing</button>
        <button class="primary-btn" id="btn-resume">▶ Start Operation</button>
      </div>
    </header>

    <div class="content">
      <div id="error-banner" class="error-banner"></div>

      <section class="hero panel" id="command">
        <div class="hero-copy">
          <div class="eyebrow">System_Status_Alpha / OsaTechGPT</div>
          <h1>Your company is <span id="hero-state">connecting.</span></h1>
          <p id="hero-copy">Reading live system state from Ratio Essendi.</p>
          <div class="hero-actions">
            <button class="primary-btn" id="btn-continue">Continue Operation →</button>
            <button class="ghost-btn" id="btn-viewlogs">View Live Logs</button>
          </div>
          <div class="hero-status-strip" id="stats"></div>
        </div>
        <div class="hero-visual">
          <div class="visual-label">Live command core / RE-01</div>
          <div class="system-core" aria-hidden="true">
            <div class="ring r1"><i class="orbit-dot"></i></div>
            <div class="ring r2"></div>
            <div class="ring r3"></div>
            <div class="core-node"></div>
          </div>
          <div class="visual-status"><span class="status-dot"></span><span id="visual-status">Awaiting telemetry</span></div>
        </div>
      </section>

      <section id="infrastructure">
        <div class="section-head">
          <h2 class="section-title"><small>Core_Modules / Live Registry</small>System Infrastructure</h2>
          <div class="live-pill"><span class="status-dot"></span><span id="systems-summary">Loading systems</span></div>
        </div>
        <div class="cells-grid" id="cells"></div>
      </section>

      <section id="logs">
        <div class="section-head">
          <h2 class="section-title"><small>Live stream / Operator evidence</small>Factory Operations</h2>
          <div class="live-pill"><span class="status-dot"></span>Live · 2s refresh</div>
        </div>

        <div class="operations-grid">
          <div class="panel events-panel">
            <div class="panel-head">
              <div><div class="panel-title">Recent Factory Events</div><div class="panel-kicker">Newest decisions first</div></div>
              <span class="badge info" id="event-count">0 events</span>
            </div>
            <div class="table-wrap"><table><thead><tr><th>Time</th><th>Event</th><th>Entity</th><th>Transition</th><th>Reason</th></tr></thead><tbody id="log"></tbody></table></div>
          </div>

          <div class="panel attention-panel">
            <div class="panel-head">
              <div><div class="panel-title">Attention Required</div><div class="panel-kicker">Operator decisions only</div></div>
              <span class="badge magenta" id="attention-count">0 pending</span>
            </div>
            <div class="stack" id="pending"></div>
            <div class="stack" id="attention" style="margin-top:10px"></div>
          </div>

          <div class="panel bus-panel">
            <div class="panel-head"><div><div class="panel-title">Neural Bus</div><div class="panel-kicker">Actual live state</div></div></div>
            <div class="bus-layout">
              <div class="bus-core"><div class="bus-brain">RE</div></div>
              <div class="bus-list">
                <div class="bus-row"><span>Cells</span><strong id="bus-cells">—</strong></div>
                <div class="bus-row"><span>Agents</span><strong id="bus-agents">—</strong></div>
                <div class="bus-row"><span>Decisions</span><strong id="bus-events">—</strong></div>
                <div class="bus-row"><span>Simulation</span><strong class="ok" id="paused">—</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="lower-grid">
        <div class="panel agents-panel" id="personnel">
          <div class="panel-head">
            <div><div class="panel-title">Agent Operations</div><div class="panel-kicker">Purpose-bound workforce registry</div></div>
            <span class="badge info" id="agent-count">0 agents</span>
          </div>
          <div class="table-wrap"><table><thead><tr><th>ID</th><th>Agent</th><th>Role</th><th>Status</th><th>Lineage</th></tr></thead><tbody id="agents"></tbody></table></div>
        </div>

        <div class="panel report-panel" id="intelligence">
          <div class="panel-head">
            <div><div class="panel-title">Operator Intelligence</div><div class="panel-kicker">Human-readable LLM briefing</div></div>
            <div class="report-toolbar"><button class="ghost-btn" id="btn-report-secondary">Generate report</button></div>
          </div>
          <div id="report">Select “Generate report” to request a live operational briefing.</div>
        </div>
      </section>
    </div>
  </main>

  <div class="drawer-backdrop" id="drawer-backdrop"></div>
  <aside class="drawer" id="detail-drawer" aria-hidden="true">
    <div class="drawer-head">
      <div><div class="eyebrow">Module Inspector</div><h2 id="drawer-title">System Cell</h2></div>
      <button class="drawer-close" id="drawer-close" aria-label="Close module inspector">×</button>
    </div>
    <div id="drawer-content"></div>
  </aside>
</div>

<script>
  var bootTime = Date.now();
  var latestState = null;
  var openCellId = null;
  var E = function (s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var badge = function (t,c) { return '<span class="badge '+c+'">'+E(t)+'</span>'; };
  var healthC = function (s) { return s==='healthy'?'ok':s==='failed'||s==='quarantined'?'bad':s==='degraded'||s==='recovering'?'warn':'info'; };
  var agentC = function (s) { if(s==='active')return 'ok'; if(s==='created')return 'info'; if(s==='replaced'||s==='archived')return 'muted'; if(s==='degraded'||s==='disabled'||s==='succession_required')return 'bad'; if(s==='warning'||s==='under_review')return 'warn'; return 'info'; };
  var evtC = function (t) { var x=String(t||'').toLowerCase(); if(/fail|drift|conflict|quarantined|blocked|disabled|rejected/.test(x))return 'bad'; if(/succession|warning|under_review|shadow_prepared/.test(x))return 'warn'; if(/approval|granted|recovered|shadow_promoted|activated|successor|replaced|output_evaluated|approved/.test(x))return 'ok'; return 'info'; };
  var formatTime = function (iso) { try { return new Date(iso).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}); } catch(e){ return '—'; } };
  var formatPct = function (n) { return Math.max(0,Math.min(100,Math.round(n)))+'%'; };
  var domainCode = function (d) { var m={product:'PRD',sales:'SLS',marketing:'MKT',finance:'FIN',security:'SEC',research:'RSH',delivery:'DLV',content:'CNT',customer_success:'CS'}; return m[d]||String(d||'SYS').slice(0,3).toUpperCase(); };
  var domainIcon = function (d) { var m={product:'◇',sales:'↗',marketing:'✦',finance:'¤',security:'⬡',research:'⌬',delivery:'▣',content:'≋',customer_success:'◎'}; return m[d]||'⌘'; };
  var signalBars = function (seed) { var out='<div class="signal-bars">'; var s=String(seed||'ratio'); for(var i=0;i<20;i++){ var c=s.charCodeAt(i%s.length); var h=5+((c*(i+3))%23); out+='<i style="height:'+h+'px;animation-delay:'+(i*.06)+'s"></i>'; } return out+'</div>'; };
  var miniStat = function (label,value,klass) { return '<div class="mini-metric"><div class="mini-value '+(klass||'')+'">'+E(value)+'</div><div class="mini-label">'+E(label)+'</div></div>'; };
  var showError = function (msg) { var el=document.getElementById('error-banner'); el.style.display='block'; el.textContent=msg; };
  var clearError = function () { var el=document.getElementById('error-banner'); el.style.display='none'; el.textContent=''; };

  function getState(){ return fetch('/api/state').then(function(r){ if(!r.ok) throw new Error('State request failed: '+r.status); return r.json(); }); }
  function act(a,id){
    return fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:a,id:id})})
      .then(function(r){ if(!r.ok) throw new Error('Action failed: '+r.status); return r.json().catch(function(){return {};}); })
      .then(render)
      .catch(function(e){ showError(String(e)); });
  }
  function genReport(){
    var el=document.getElementById('report');
    el.textContent='Generating operational briefing…';
    return fetch('/api/report',{method:'POST'})
      .then(function(r){ if(!r.ok) throw new Error('Report request failed: '+r.status); return r.json(); })
      .then(function(j){ el.textContent='['+String(j.mode||'report').toUpperCase()+']\\n\\n'+String(j.report||'No report returned.'); })
      .catch(function(e){ el.textContent='Report failed: '+e; });
  }

  function renderCells(s){
    var cells=s.cells||[];
    document.getElementById('cells').innerHTML=cells.length?cells.map(function(c){
      var linked=(s.agents||[]).filter(function(a){return a.cellId===c.id;});
      return '<article class="cell-card health-'+E(c.healthStatus)+'" data-cell="'+E(c.id)+'" tabindex="0">'+
        '<div class="cell-top"><div class="domain-icon">'+E(domainIcon(c.domain))+'</div><div class="cell-code">'+E(domainCode(c.domain))+' / '+E(c.id)+'</div></div>'+
        '<h3>'+E(c.name)+'</h3><div class="cell-purpose">'+E(c.purpose||c.domain)+'</div>'+
        '<div class="cell-signal"><div><div class="cell-number">'+E(linked.length)+'</div><div class="cell-number-label">registered agents</div></div>'+signalBars(c.id+c.updatedAt)+'</div>'+
        '<div class="cell-foot">'+badge(c.healthStatus,healthC(c.healthStatus))+'<button class="open-module" data-cell="'+E(c.id)+'">Open module</button></div>'+
      '</article>';
    }).join(''):'<div class="empty">No system cells registered.</div>';
  }

  function renderPending(st,attention){
    var pend=(st.pending||[]).filter(function(p){return p.status==='pending';});
    document.getElementById('pending').innerHTML=pend.length?pend.slice(0,3).map(function(p){
      return '<div class="action-card"><div class="action-label">Approval gate / score '+E(p.score)+'</div><div class="action-title">'+E(p.agentName)+'</div><div class="action-copy">'+E(String(p.offer||'').slice(0,180))+(String(p.offer||'').length>180?'…':'')+'</div><div class="action-row"><button class="b ok" data-act="approve" data-id="'+E(p.id)+'">Approve</button><button class="b bad" data-act="reject" data-id="'+E(p.id)+'">Reject</button></div></div>';
    }).join(''):'<div class="action-card ok-card"><div class="action-label">Approval gate clear</div><div class="action-title">No external action is waiting.</div><div class="action-copy">Every outbound action remains behind explicit operator approval.</div></div>';

    document.getElementById('attention').innerHTML=attention.length?attention.slice(0,3).map(function(a){
      return '<div class="action-card"><div class="action-label">'+E(a.status)+'</div><div class="action-title">'+E(a.name)+'</div><div class="action-copy">'+E(a.role)+' · '+E(a.id)+'</div><div class="action-row"><button class="b warn" data-act="succeed" data-id="'+E(a.id)+'">Force succession</button><button class="b bad" data-act="quarantine" data-id="'+E(a.id)+'">Quarantine</button></div></div>';
    }).join(''):'';
    document.getElementById('attention-count').textContent=(pend.length+attention.length)+' pending';
  }

  function renderEvents(s){
    var ev=(s.events||[]).slice(-18).reverse();
    document.getElementById('event-count').textContent=(s.events||[]).length+' events';
    document.getElementById('log').innerHTML=ev.length?ev.map(function(e){
      var tr=(e.previousState||e.nextState)?E((e.previousState||'∅')+' → '+(e.nextState||'∅')):'—';
      return '<tr class="evt '+evtC(e.eventType)+'"><td class="event-time">'+E(formatTime(e.createdAt))+'</td><td>'+badge(e.eventType,evtC(e.eventType))+'</td><td class="mono">'+E(e.entityId)+'</td><td class="mono dim">'+tr+'</td><td>'+E(e.reason||'')+'</td></tr>';
    }).join(''):'<tr><td colspan="5" class="empty">No events recorded.</td></tr>';
  }

  function renderAgents(s){
    var agents=s.agents||[];
    document.getElementById('agent-count').textContent=agents.length+' agents';
    document.getElementById('agents').innerHTML=agents.length?agents.map(function(a){
      var lin=(a.lineage&&a.lineage.createdFrom)?'from '+a.lineage.createdFrom:((a.lineage&&a.lineage.successorId)?'→ '+a.lineage.successorId:'—');
      return '<tr><td class="mono">'+E(a.id)+'</td><td><strong>'+E(a.name)+'</strong> <span class="dim">'+E(a.version)+'</span></td><td>'+E(a.role)+'</td><td>'+badge(a.status,agentC(a.status))+'</td><td class="mono dim">'+E(lin)+'</td></tr>';
    }).join(''):'<tr><td colspan="5" class="empty">No agents registered.</td></tr>';
  }

  function openDrawer(id){
    if(!latestState)return;
    var s=latestState.snapshot;
    var c=(s.cells||[]).find(function(x){return x.id===id;});
    if(!c)return;
    openCellId=id;
    var agents=(s.agents||[]).filter(function(a){return a.cellId===c.id;});
    document.getElementById('drawer-title').textContent=c.name;
    document.getElementById('drawer-content').innerHTML=
      '<div class="detail-block"><div class="detail-key">Current health</div><div class="detail-value">'+badge(c.healthStatus,healthC(c.healthStatus))+(c.activeController?' '+badge('active controller','ok'):' '+badge('standby','muted'))+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">Purpose</div><div class="detail-value">'+E(c.purpose)+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">Domain / Memory scope</div><div class="detail-value">'+E(c.domain)+' / '+E(c.memoryScope)+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">Budget limit</div><div class="detail-value">'+E(c.budgetLimit)+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">KPIs</div><div class="tag-list">'+((c.kpis||[]).map(function(x){return '<span class="tag">'+E(x)+'</span>';}).join('')||'<span class="dim">No KPIs declared</span>')+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">Assigned agents ('+agents.length+')</div><div class="tag-list">'+(agents.map(function(a){return '<span class="tag">'+E(a.name)+' · '+E(a.status)+'</span>';}).join('')||'<span class="dim">No agents assigned</span>')+'</div></div>'+
      '<div class="detail-block"><div class="detail-key">Failover policy</div><div class="detail-value">'+E(c.failoverPolicy)+'</div></div>';
    document.getElementById('detail-drawer').classList.add('open');
    document.getElementById('drawer-backdrop').classList.add('open');
    document.getElementById('detail-drawer').setAttribute('aria-hidden','false');
  }
  function closeDrawer(){
    openCellId=null;
    document.getElementById('detail-drawer').classList.remove('open');
    document.getElementById('drawer-backdrop').classList.remove('open');
    document.getElementById('detail-drawer').setAttribute('aria-hidden','true');
  }

  function render(){
    return getState().then(function(st){
      clearError();
      latestState=st;
      var s=st.snapshot||{cells:[],agents:[],events:[]};
      var cells=s.cells||[];
      var agents=s.agents||[];
      var active=agents.filter(function(a){return a.status==='active';}).length;
      var healthy=cells.filter(function(c){return c.healthStatus==='healthy';}).length;
      var failed=cells.filter(function(c){return c.healthStatus==='failed'||c.healthStatus==='quarantined';}).length;
      var attention=agents.filter(function(a){return ['succession_required','degraded','under_review','warning'].indexOf(a.status)>=0;});
      var pending=(st.pending||[]).filter(function(p){return p.status==='pending';});
      var healthPct=cells.length?(healthy/cells.length)*100:0;
      var operational=failed===0&&attention.length===0;
      var stateText=operational?'operational.':'under review.';
      var statusText=operational?'Operational':'Attention required';

      document.getElementById('hero-state').textContent=stateText;
      document.getElementById('hero-state').style.color=operational?'var(--green)':'var(--magenta)';
      document.getElementById('hero-copy').innerHTML='Ratio Essendi is processing <strong>'+E(active)+' active agents</strong> across <strong>'+E(cells.length)+' system cells</strong>. Every external action remains behind the operator approval gate.';
      document.getElementById('top-status').innerHTML='<span class="status-dot"></span>'+E(statusText);
      document.getElementById('top-status').className='top-value '+(operational?'ok':'magenta');
      document.getElementById('visual-status').textContent=statusText;
      document.getElementById('systems-summary').textContent=failed?failed+' critical systems':healthy+' / '+cells.length+' systems green';
      document.getElementById('stats').innerHTML=miniStat('System health',formatPct(healthPct),operational?'ok':'')+miniStat('Active agents',active,'ok')+miniStat('Pending approval',pending.length,pending.length?'':'ok')+miniStat('Decisions',s.events.length,'');
      document.getElementById('side-health').textContent=formatPct(healthPct);
      document.getElementById('side-health-label').innerHTML=operational?'All systems<br>nominal':'Review<br>required';
      document.getElementById('side-health-fill').style.width=formatPct(healthPct);
      document.getElementById('bus-cells').textContent=cells.length;
      document.getElementById('bus-agents').textContent=agents.length;
      document.getElementById('bus-events').textContent=s.events.length;
      document.getElementById('paused').textContent=st.paused?'Paused':'Running';
      document.getElementById('paused').className=st.paused?'':'ok';
      document.getElementById('last-sync').textContent=formatTime(st.generatedAt||s.generatedAt||new Date().toISOString());

      renderCells(s);
      renderPending(st,attention);
      renderEvents(s);
      renderAgents(s);
      if(openCellId)openDrawer(openCellId);
    }).catch(function(e){ showError('Live telemetry unavailable. '+String(e)); });
  }

  function updateUptime(){
    var total=Math.floor((Date.now()-bootTime)/1000);
    var h=String(Math.floor(total/3600)).padStart(2,'0');
    var m=String(Math.floor((total%3600)/60)).padStart(2,'0');
    var s=String(total%60).padStart(2,'0');
    document.getElementById('uptime').textContent=h+':'+m+':'+s;
  }

  document.addEventListener('click',function(e){
    var t=e.target;
    if(!t||!t.getAttribute)return;
    var action=t.getAttribute('data-act');
    if(action){act(action,t.getAttribute('data-id')||'');return;}
    var cell=t.getAttribute('data-cell');
    if(!cell&&t.closest){var card=t.closest('[data-cell]');if(card)cell=card.getAttribute('data-cell');}
    if(cell){openDrawer(cell);return;}
    var target=t.getAttribute('data-scroll');
    if(target){var el=document.getElementById(target);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
  });
  document.getElementById('btn-findclient').addEventListener('click',function(){act('findClient','');});
  document.getElementById('btn-report').addEventListener('click',genReport);
  document.getElementById('btn-report-secondary').addEventListener('click',genReport);
  document.getElementById('btn-pause').addEventListener('click',function(){act('pause','');});
  document.getElementById('btn-resume').addEventListener('click',function(){act('resume','');});
  document.getElementById('btn-tick').addEventListener('click',function(){act('tick','');});
  document.getElementById('btn-continue').addEventListener('click',function(){act('tick','');});
  document.getElementById('btn-viewlogs').addEventListener('click',function(){document.getElementById('logs').scrollIntoView({behavior:'smooth'});});
  document.getElementById('drawer-close').addEventListener('click',closeDrawer);
  document.getElementById('drawer-backdrop').addEventListener('click',closeDrawer);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrawer();});

  render();
  updateUptime();
  setInterval(render,2000);
  setInterval(updateUptime,1000);
</script>
</body>
</html>
`
}
