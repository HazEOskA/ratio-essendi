export const STITCH_REFINEMENT_CSS = String.raw`
.side-brand-block{padding:26px 24px 20px;border-bottom:1px solid var(--line)}
.side-wordmark{margin-top:14px;font:800 25px/1.05 "Plus Jakarta Sans";letter-spacing:-.04em}
.sidebar-operator-bottom{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid var(--line)}
.sidebar-operator-bottom .operator{margin-top:0}
.side-utility{margin-top:16px}
.command-meta{display:flex;align-items:center;gap:54px;margin-left:auto;margin-right:36px}
.command-meta span{display:grid;gap:2px;color:#c4cdcc;font:600 10px/1.1 "JetBrains Mono"}
.command-meta b{color:var(--mag);font-weight:600}
.command-meta b.cyan{color:var(--cyan)}
.shell-icon{position:relative;width:28px;height:34px;display:grid;place-items:center;color:#d0d7d6;text-decoration:none;border:0;background:transparent;cursor:pointer}
.shell-icon i,.icon-button i{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--mag);right:1px;top:4px}
.top-divider{width:1px;height:36px;background:var(--line);margin:0 2px}
.mobile-wordmark{display:flex;align-items:center;gap:8px;font:500 26px "Plus Jakarta Sans";letter-spacing:-.04em}
.mobile-wordmark .material-symbols-outlined{color:var(--cyan);font-size:27px}
.mobile-wordmark strong{font-weight:800}
.mobile-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#cdd4d3;text-decoration:none;background:radial-gradient(circle at 35% 30%,#194a4b,#111 65%);border:1px solid #315b5a}
.mobile-avatar .material-symbols-outlined{font-size:37px}
.hero{border-color:#45504f;background:linear-gradient(130deg,#1c1c1c 0%,#181818 72%,#1a2020 100%)}
.hero .eyebrow{letter-spacing:.16em}
.hero h1{max-width:710px}
.hero-copy-strong{font-weight:700;color:#fff}
.system-summary{display:flex;align-items:center;gap:18px;margin-top:14px;color:#b7c0bf;font:500 11px "JetBrains Mono"}
.system-summary span{display:inline-flex;align-items:center;gap:7px}
.system-summary i{width:6px;height:6px;border-radius:50%;background:var(--cyan)}
.card{border-color:#46504f;background:#1b1b1b}
.card .module-status{display:inline-flex;align-items:center;justify-content:center;min-height:22px;padding:3px 8px;border:1px solid #245f5d;background:#0b2d2c;color:var(--cyan);font:600 8px "JetBrains Mono";letter-spacing:.08em;text-transform:uppercase;margin-left:auto}
.card .module-status.attention{border-color:#754b72;background:#2b1829;color:var(--mag)}
.card .metric-row{margin-top:auto;padding:22px 0;display:flex;align-items:center;gap:10px}
.card .metric{margin:0;padding:0}
.card .button{background:#171717}
.card .button:hover{background:#202020}
.section-head .system-green{display:flex;align-items:center;gap:8px}
.event{grid-template-columns:12px 84px 1fr 22px}
.event .event-icon{color:var(--cyan);font-size:17px;text-align:right}
.event.mag .dot,.event.mag .event-icon{background:var(--mag);color:var(--mag)}
.attention{background:#232323;border-color:#495453}
.attention.urgent{border-right:4px solid var(--mag)}
.attention-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.attention-actions .button{width:100%}
.attention-meta{display:flex;justify-content:space-between;gap:12px;color:#98a3a2;font:500 9px "JetBrains Mono"}
.metric-box{position:relative;overflow:hidden;border-color:#46504f}
.metric-rail{position:absolute;left:0;top:0;bottom:0;width:31px;display:flex;align-items:center;justify-content:center;border-right:1px solid #263130;color:#3f4948;font:600 13px "JetBrains Mono";writing-mode:vertical-rl;letter-spacing:.1em}
.metric-box.with-rail{padding-left:56px}
.metric-note{color:var(--cyan);font:600 9px "JetBrains Mono";margin-top:8px;max-width:150px}
.lead-toolbar{height:54px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 16px;border-bottom:1px solid var(--line);background:#202020}
.lead-toolbar-left,.lead-toolbar-right{display:flex;align-items:center;gap:12px}
.filter-button{border:1px solid var(--line);background:#171717;color:#c7cecd;padding:7px 10px;font:600 9px "JetBrains Mono";cursor:pointer;text-transform:uppercase}
.filter-button.active{border-color:var(--cyan);color:var(--cyan)}
.archive-row{padding:18px;text-align:center;color:#aeb7b6;font:600 9px "JetBrains Mono";letter-spacing:.22em}
.lead-task{min-height:278px;display:flex;flex-direction:column}
.lead-task h3{font:500 22px/1.35 "Plus Jakarta Sans";margin:24px 0 12px}
.lead-task p{font-size:14px;color:#bec7c6;line-height:1.45}
.lead-task .task-meta{display:flex;justify-content:space-between;align-items:center}
.lead-task .button-row{display:grid;grid-template-columns:1fr 1.25fr;gap:10px;margin-top:auto}
.staging-panel{position:relative}
.staging-panel:after{content:"STREFA_SZKICÓW";position:absolute;right:-41px;top:80px;transform:rotate(90deg);color:#303938;font:600 13px "JetBrains Mono";letter-spacing:.13em}
.draft{border-color:#4c5756;background:#171717}
.draft-confidence{display:flex;justify-content:space-between;align-items:center;color:#9ba7a6;font:600 8px "JetBrains Mono"}
.draft-confidence b{color:var(--cyan)}
.review-pipeline{padding:16px;border-top:1px solid var(--line)}
.console-feed{margin-top:24px;min-height:145px;max-height:190px;color:#0e706d;opacity:.75}
.status-log .terminal{font-size:13px;line-height:1.75;color:#93a09f}
.status-log .log-info{color:#4a9f9b}
.status-log .log-warn{color:var(--yellow)}
.status-log .log-critical{color:var(--mag)}
.status-log .log-system{color:var(--cyan)}
.health:after{content:"STAN_RDZENIA";position:absolute;right:-40px;top:120px;transform:rotate(90deg);color:#242b2b;font:700 33px "JetBrains Mono";letter-spacing:.06em}
.health{position:relative;overflow:hidden}
.incident{border-color:#45504f}
.incident.alert{border-color:#765873}
.incident-head{display:flex;justify-content:space-between;gap:8px}
.incident-head time{color:#a9b2b1;font:500 9px "JetBrains Mono"}
.deployment-map{min-height:445px;position:relative;background:radial-gradient(circle at 50% 48%,rgba(0,221,221,.12),transparent 31%),#080c0c;overflow:hidden}
.map-svg{position:absolute;inset:0;width:100%;height:100%;opacity:.92}
.map-svg .land{fill:#0f1c1c;stroke:#1f4b49;stroke-width:1}
.map-svg .route{fill:none;stroke:#00d7d7;stroke-width:1;opacity:.35}
.map-svg .route.mag{stroke:#ff8ce9;opacity:.38}
.map-svg .node{fill:#00e0df;filter:drop-shadow(0 0 4px #00d7d7)}
.map-svg .node.mag{fill:#ff99eb;filter:drop-shadow(0 0 4px #ff99eb)}
.map-controls{position:absolute;right:18px;bottom:18px;display:flex;gap:8px}
.map-controls button{width:34px;height:34px;border:1px solid var(--line);background:#131313;color:#fff;font-size:18px;cursor:pointer}
.setting-control{width:100%;accent-color:var(--cyan)}
.toggle-row{display:flex;gap:28px;flex-wrap:wrap;margin-top:20px}
.toggle{display:flex;align-items:center;gap:9px;color:#c7cecd;font:600 9px "JetBrains Mono";cursor:pointer}
.toggle input{accent-color:var(--cyan)}
.toggle.locked{opacity:.45;cursor:not-allowed}
.telemetry-strip{margin-top:24px;border:1px solid var(--line);background:#1b1b1b;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px}
.telemetry-group{display:flex;gap:42px}
.telemetry-item{display:grid;gap:7px}
.telemetry-item small{color:#a6afae;font:600 8px "JetBrains Mono";letter-spacing:.08em}
.telemetry-item strong{font:600 14px "JetBrains Mono"}
.telemetry-stable{display:flex;align-items:center;gap:10px;font:600 9px "JetBrains Mono"}
.telemetry-stable i{width:12px;height:12px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px rgba(0,221,221,.45)}
.empty-state{padding:28px;color:#8e9998;text-align:center;font:600 10px "JetBrains Mono"}
.anchor-button{border:1px solid var(--line);background:#171717;color:#fff;padding:12px 18px;text-decoration:none;font:700 10px "JetBrains Mono";letter-spacing:.1em}
.anchor-button:hover{border-color:var(--cyan);color:var(--cyan)}

@media(min-width:721px){
  body[data-screen="command"] .topbar{padding-left:32px}
  body[data-screen="command"] .brand{color:var(--cyan)}
  body[data-screen="lead"] .sidebar .side-bottom{padding-top:18px}
  body[data-screen="lead"] .sidebar-operator-bottom .operator-icon{background-image:radial-gradient(circle,#1b4141,#090909)}
  body[data-screen="operator"] .sidebar .nav-link.active{color:#fff;border-left-color:#fff;background:transparent}
  body[data-screen="operator"] .sidebar .operator-icon{border-radius:6px}
}

@media(max-width:1100px) and (min-width:721px){
  .command-meta{gap:22px;margin-right:18px}
  .top-actions{gap:8px}
  .topbar{padding-left:24px;padding-right:24px}
}

@media(max-width:720px){
  .mobile-top{height:82px;padding:0 22px}
  .mobile-wordmark{font-size:24px}
  .hero{min-height:370px;padding:30px;border-radius:16px}
  .hero h1{font-size:43px;line-height:1.12;max-width:340px}
  .hero p{font-size:18px;line-height:1.55}
  .system-summary{display:none}
  .cards .card:nth-child(n+5){display:none}
  .card{grid-template-columns:82px 1fr;grid-template-rows:auto auto;min-height:156px;padding:28px 30px}
  .card h3{font-size:27px}
  .card .metric-row{padding:0;margin-top:0}
  .card .module-status{display:none}
  .card:nth-child(4) .card-top{background:#0d3130;border-color:#0d5f5c;color:#208d89}
  .split{display:block}
  .split>div:first-child{display:block}
  .split>div:first-child>.section-head{display:none}
  .split>div:first-child>.events{border-radius:14px;overflow:hidden;margin-top:30px}
  .events:before{content:"WYJŚCIE TERMINALA SYSTEMU                 NA ŻYWO";display:block;padding:17px 18px;border-bottom:1px solid var(--line);color:#bfc8c7;font:600 10px "JetBrains Mono";white-space:pre}
  .event{grid-template-columns:8px 1fr;min-height:42px;padding:9px 16px}
  .event .event-icon{display:none}
  .event:nth-child(n+4){display:none}
  .lead-grid{display:block}
  .lead-toolbar{height:auto;align-items:flex-start;flex-direction:column;padding:14px}
  .lead-toolbar-right{width:100%;justify-content:space-between}
  .table th:nth-child(2),.table td:nth-child(2){display:none}
  .lower-grid{display:block}
  .lead-task{margin-bottom:16px;min-height:230px}
  .staging-panel:after{display:none}
  .cockpit{display:block}
  .health:after{display:none}
  .status-log .terminal{font-size:10px}
  .deployment-map{min-height:320px}
  .telemetry-strip{align-items:flex-start;flex-direction:column}
  .telemetry-group{width:100%;justify-content:space-between;gap:12px}
  .telemetry-item strong{font-size:12px}
  .telemetry-stable{width:100%;justify-content:flex-end}
}
`
