export const STITCH_NEON_UPGRADE_CSS = String.raw`
:root{
  --bg:#020708;
  --surface:#051012;
  --surface2:#07171a;
  --surface3:#0a1c20;
  --line:rgba(40,224,239,.22);
  --line-strong:rgba(40,224,239,.58);
  --muted:#6f8b91;
  --text:#effdff;
  --cyan:#20e6f2;
  --cyan2:#78f8ff;
  --green:#43ff88;
  --green-soft:rgba(67,255,136,.12);
  --mag:#ff58d3;
  --yellow:#ffbf4b;
  --danger:#ff476f;
  --side:268px;
  --glow-cyan:0 0 18px rgba(32,230,242,.25),0 0 48px rgba(32,230,242,.08);
  --glow-green:0 0 18px rgba(67,255,136,.25),0 0 42px rgba(67,255,136,.08);
}

html,body{background:var(--bg)}
body{
  background:
    radial-gradient(circle at 83% 6%,rgba(32,230,242,.11),transparent 29%),
    radial-gradient(circle at 72% 75%,rgba(255,88,211,.055),transparent 32%),
    linear-gradient(145deg,#010405 0%,#031013 52%,#020607 100%);
  overflow-x:hidden;
}
body:before{
  inset:0;
  opacity:.18;
  background-image:
    linear-gradient(rgba(32,230,242,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(32,230,242,.055) 1px,transparent 1px);
  background-size:42px 42px;
  -webkit-mask-image:radial-gradient(circle at 62% 42%,#000 20%,transparent 83%);
  mask-image:radial-gradient(circle at 62% 42%,#000 20%,transparent 83%);
}
body:after{
  content:"";
  position:fixed;
  inset:0;
  z-index:100;
  pointer-events:none;
  opacity:.035;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.7) 0,rgba(255,255,255,.7) 1px,transparent 1px,transparent 4px);
  mix-blend-mode:overlay;
}
::selection{background:rgba(32,230,242,.32);color:#fff}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-track{background:#020708}
::-webkit-scrollbar-thumb{background:#12333a;border:2px solid #020708}

.sidebar{
  background:rgba(2,8,9,.95);
  border-right-color:rgba(32,230,242,.22);
  backdrop-filter:blur(20px);
  box-shadow:12px 0 48px rgba(0,0,0,.26);
}
.identity,.side-brand-block{
  min-height:116px;
  padding:22px 20px 18px;
  border-bottom-color:rgba(32,230,242,.22);
  position:relative;
}
.identity:after,.side-brand-block:after{
  content:"";
  position:absolute;
  left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg,var(--cyan),transparent 82%);
  box-shadow:0 0 14px var(--cyan);
}
.osa-lockup{display:flex;align-items:center;gap:13px;margin-top:12px}
.osa-emblem{
  width:44px;height:44px;flex:0 0 44px;position:relative;display:grid;place-items:center;
  color:var(--cyan);filter:drop-shadow(0 0 9px rgba(32,230,242,.55));
}
.osa-emblem:before,.osa-emblem:after{
  content:"";position:absolute;inset:5px;border:2px solid currentColor;
  clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);
  transform:rotate(30deg);
}
.osa-emblem:after{inset:12px;transform:rotate(-30deg);border-color:var(--green)}
.osa-emblem i{width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 10px var(--cyan),0 0 20px var(--green)}
.osa-wordmark{font:800 18px/1.02 "Plus Jakarta Sans";letter-spacing:.035em;text-transform:uppercase;color:#fff}
.osa-wordmark b{color:var(--cyan);font-weight:800;text-shadow:0 0 12px rgba(32,230,242,.35)}
.osa-submark{margin-top:6px;color:#4fa8b2;font:600 8px/1.35 "JetBrains Mono";letter-spacing:.14em;text-transform:uppercase}
.side-wordmark{display:none}
.operator{margin-top:13px}
.operator-icon{border-color:rgba(32,230,242,.55);background:radial-gradient(circle,rgba(32,230,242,.17),rgba(2,9,11,.82));box-shadow:inset 0 0 16px rgba(32,230,242,.08)}
.operator small{color:var(--green);text-shadow:0 0 9px rgba(67,255,136,.30)}

.nav{padding:18px 11px;gap:5px}
.nav-link{height:50px;border-left:0;border:1px solid transparent;padding:0 15px;transition:.18s ease;position:relative}
.nav-link:hover{color:#fff;background:rgba(32,230,242,.045);border-color:rgba(32,230,242,.17);transform:translateX(2px)}
.nav-link.active{
  color:var(--cyan);border:1px solid rgba(32,230,242,.36);border-left:0;
  background:linear-gradient(90deg,rgba(32,230,242,.14),rgba(32,230,242,.025));
  box-shadow:inset 3px 0 0 var(--cyan),0 0 24px rgba(32,230,242,.09);
}
.nav-link.active:after{content:"";width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 11px var(--cyan);margin-left:auto;animation:osaPulse 1.8s ease-in-out infinite}
.side-bottom{border-top-color:rgba(32,230,242,.18);padding:16px 16px 20px}
.side-system-card{border:1px solid rgba(67,255,136,.20);background:linear-gradient(140deg,rgba(67,255,136,.07),rgba(32,230,242,.025));padding:12px;margin-bottom:13px;position:relative;overflow:hidden}
.side-system-card:after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:linear-gradient(90deg,var(--green),transparent);box-shadow:0 0 9px var(--green)}
.side-system-head{display:flex;align-items:center;justify-content:space-between;color:#718e94;font:600 8px "JetBrains Mono";letter-spacing:.11em;text-transform:uppercase}
.side-system-live{color:var(--green)}
.side-system-live i{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green);margin-right:6px;animation:osaPulse 1.8s ease-in-out infinite}
.side-system-wave{height:24px;margin-top:10px;display:flex;align-items:end;gap:2px}
.side-system-wave i{flex:1;background:var(--green);opacity:.58;box-shadow:0 0 5px rgba(67,255,136,.30);animation:osaBar 1.7s ease-in-out infinite alternate}
.side-system-wave i:nth-child(2n){animation-delay:.16s}.side-system-wave i:nth-child(3n){animation-delay:.32s}
.side-powered{margin:13px 2px 0;color:#48666c;font:600 8px/1.5 "JetBrains Mono";letter-spacing:.12em;text-transform:uppercase}
.side-powered b{color:var(--cyan)}

.topbar{
  height:82px;padding:0 28px;background:rgba(2,8,9,.86);border-bottom-color:rgba(32,230,242,.20);
  backdrop-filter:blur(20px);box-shadow:0 10px 38px rgba(0,0,0,.18);
}
.brand{font-size:22px;letter-spacing:.035em;text-transform:uppercase;color:#fff}
body[data-screen="command"] .brand{color:var(--cyan);text-shadow:0 0 14px rgba(32,230,242,.32)}
.command-meta{gap:42px}
.command-meta span{color:#668188;font-size:9px;letter-spacing:.08em;text-transform:uppercase}
.command-meta b{font-size:10px;color:var(--mag)}
.command-meta b.cyan{color:var(--green);text-shadow:0 0 10px rgba(67,255,136,.28)}
.shell-icon{color:#a9c2c7;transition:.18s ease}
.shell-icon:hover{color:#fff;text-shadow:0 0 10px var(--cyan)}
.shell-icon i,.icon-button i{background:var(--mag);box-shadow:0 0 9px var(--mag)}
.top-divider{background:rgba(32,230,242,.18)}

.button{border-color:rgba(32,230,242,.25);background:rgba(5,17,19,.88);color:#b9d7dc;border-radius:2px;transition:.18s ease}
.button:hover{color:#fff;border-color:var(--cyan);box-shadow:0 0 18px rgba(32,230,242,.14);transform:translateY(-1px)}
.button.primary{background:linear-gradient(90deg,#13c9d5,#21edf7);border-color:var(--cyan);color:#001012;box-shadow:var(--glow-cyan)}
.button.primary:hover{box-shadow:0 0 28px rgba(32,230,242,.42);color:#001012}
.button.mag{background:linear-gradient(90deg,#ff75dd,#ff58d3);border-color:var(--mag);box-shadow:0 0 20px rgba(255,88,211,.22)}

.content{padding:26px 28px 72px;max-width:1750px}
.hero{
  min-height:350px;padding:42px 44px;width:100%;
  background:
    radial-gradient(circle at 78% 50%,rgba(32,230,242,.13),transparent 29%),
    linear-gradient(135deg,rgba(6,21,24,.97),rgba(2,9,11,.94));
  border-color:rgba(32,230,242,.48);box-shadow:var(--glow-cyan);isolation:isolate;
}
.hero:before{
  content:"";position:absolute;inset:0;pointer-events:none;z-index:-1;
  background:
    linear-gradient(90deg,transparent 0 58%,rgba(32,230,242,.045) 58% 58.2%,transparent 58.2%),
    linear-gradient(rgba(32,230,242,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(32,230,242,.035) 1px,transparent 1px);
  background-size:auto,24px 24px,24px 24px;
  -webkit-mask-image:linear-gradient(90deg,transparent 45%,#000 72%);
  mask-image:linear-gradient(90deg,transparent 45%,#000 72%);
}
.hero:after{
  content:"RE";font-family:"JetBrains Mono";font-size:34px;font-weight:800;line-height:180px;text-align:center;
  width:180px;height:180px;right:8%;top:50%;transform:translateY(-50%) rotate(45deg);
  color:#fff;opacity:1;border:1px solid var(--cyan);background:rgba(3,16,19,.82);
  box-shadow:
    0 0 0 28px rgba(32,230,242,.025),0 0 0 29px rgba(32,230,242,.26),
    0 0 0 58px rgba(67,255,136,.018),0 0 0 59px rgba(67,255,136,.16),
    0 0 32px rgba(32,230,242,.38),inset 0 0 30px rgba(32,230,242,.16);
  text-shadow:0 0 15px var(--cyan);animation:osaCore 9s linear infinite;
}
.hero .eyebrow{color:var(--cyan);text-shadow:0 0 10px rgba(32,230,242,.28)}
.hero h1{font-size:clamp(46px,5vw,72px);line-height:.98;max-width:740px;text-transform:uppercase;letter-spacing:-.055em;margin:20px 0 16px}
.hero h1::first-line{color:#fff}
.hero p{max-width:670px;color:#9cb4b9;font-size:15px;position:relative;z-index:2}
.hero-copy-strong{color:#fff;text-shadow:0 0 10px rgba(32,230,242,.15)}
.system-summary{position:relative;z-index:2;color:#789399}
.system-summary i{background:var(--green);box-shadow:0 0 9px var(--green)}
.hero-actions{position:relative;z-index:2}

.section-head{margin:28px 0 14px}
.section-head h2{font-size:27px;text-transform:uppercase;letter-spacing:-.035em}
.section-head .stamp{color:#5b777d}
.tag{border-color:rgba(32,230,242,.20);background:rgba(5,19,22,.72);color:#9fc0c5}
.section-head .system-green{color:var(--green);border-color:rgba(67,255,136,.25);background:rgba(67,255,136,.055)}
.section-head .system-green .dot{background:var(--green);box-shadow:0 0 10px var(--green)}

.cards{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.card{
  min-height:252px;padding:18px;background:linear-gradient(160deg,rgba(7,23,26,.94),rgba(3,10,12,.96));
  border-color:rgba(32,230,242,.27);overflow:hidden;transition:.18s ease;
}
.card:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.08;background:linear-gradient(135deg,var(--cyan),transparent 38%)}
.card:after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--cyan),transparent 74%);box-shadow:0 0 12px rgba(32,230,242,.42)}
.card:hover{transform:translateY(-4px);border-color:var(--cyan);box-shadow:0 0 25px rgba(32,230,242,.16)}
.card-top{color:var(--cyan);position:relative;z-index:1}
.card-top .material-symbols-outlined{width:35px;height:35px;display:grid;place-items:center;border:1px solid currentColor;background:rgba(32,230,242,.045);font-size:20px;box-shadow:inset 0 0 13px rgba(32,230,242,.08)}
.card-code{color:#49666c}
.card h3{font-size:18px;line-height:1.08;text-transform:uppercase;margin:20px 0 8px;position:relative;z-index:1}
.card p{font-size:11px;color:#7e999f;min-height:48px;position:relative;z-index:1}
.card .metric-row{padding:16px 0 14px;position:relative;z-index:1}
.card .metric{font-size:19px;color:var(--cyan);text-shadow:0 0 11px rgba(32,230,242,.25)}
.card .module-status{color:var(--green);border-color:rgba(67,255,136,.25);background:rgba(67,255,136,.07);box-shadow:inset 0 0 10px rgba(67,255,136,.04)}
.card .module-status.attention{color:var(--mag);border-color:rgba(255,88,211,.28);background:rgba(255,88,211,.08)}
.card .button{position:relative;z-index:1;background:rgba(2,10,12,.75)}
.card:nth-child(3){border-color:rgba(255,88,211,.40);background:linear-gradient(160deg,rgba(32,8,27,.78),rgba(4,9,11,.96))}
.card:nth-child(3):after{background:linear-gradient(90deg,var(--mag),transparent 74%);box-shadow:0 0 12px rgba(255,88,211,.42)}

.split{gap:12px;margin-top:27px}
.panel{background:linear-gradient(145deg,rgba(6,18,21,.94),rgba(2,9,11,.90));border-color:rgba(32,230,242,.20);box-shadow:inset 0 0 0 1px rgba(255,255,255,.012)}
.panel-head{border-bottom-color:rgba(32,230,242,.13)}
.event{border-bottom-color:rgba(32,230,242,.10);color:#a9c1c6}
.event:hover{background:rgba(32,230,242,.025)}
.event .dot{background:var(--green);box-shadow:0 0 8px var(--green)}
.event.mag .dot{background:var(--mag);box-shadow:0 0 8px var(--mag)}
.attention{background:linear-gradient(145deg,rgba(8,20,23,.92),rgba(4,11,13,.92));border-color:rgba(32,230,242,.20)}
.attention.urgent{border-color:rgba(255,88,211,.28);border-right-color:var(--mag);box-shadow:inset -14px 0 28px rgba(255,88,211,.035)}
.attention .stamp,.attention.urgent .attention-meta{color:var(--mag)}

.metric-box,.lead-task,.draft,.incident,.telemetry-strip{background:linear-gradient(145deg,rgba(6,18,21,.94),rgba(2,9,11,.92));border-color:rgba(32,230,242,.22)}
.metric-box strong.cyan,.strength,.draft .id,.draft-confidence b{color:var(--green);text-shadow:0 0 10px rgba(67,255,136,.20)}
.bar{background:#0b2529}.bar i{background:linear-gradient(90deg,var(--green),var(--cyan));box-shadow:0 0 8px rgba(67,255,136,.24)}
.lead-toolbar{background:rgba(5,16,18,.94);border-bottom-color:rgba(32,230,242,.18)}
.table th,.table td{border-bottom-color:rgba(32,230,242,.11)}
.terminal{background:rgba(1,7,8,.78);border-color:rgba(32,230,242,.20);color:#5e9497}
.cockpit,.lower-grid{gap:12px}
.deployment-map{background:radial-gradient(circle at 50% 48%,rgba(32,230,242,.15),transparent 31%),#02090b;border-color:rgba(32,230,242,.24)}
.telemetry-stable i{background:var(--green);box-shadow:0 0 12px var(--green)}
.toast{background:#041114;border-color:var(--cyan);box-shadow:var(--glow-cyan)}
.modal-card{background:#041114;border-color:rgba(32,230,242,.36);box-shadow:0 0 52px rgba(0,0,0,.55),var(--glow-cyan)}

@keyframes osaPulse{50%{opacity:.42;transform:scale(.72)}}
@keyframes osaBar{to{opacity:.36;transform:scaleY(.62);transform-origin:bottom}}
@keyframes osaCore{
  0%{transform:translateY(-50%) rotate(45deg);filter:hue-rotate(0deg)}
  50%{transform:translateY(-50%) rotate(225deg);filter:hue-rotate(12deg)}
  100%{transform:translateY(-50%) rotate(405deg);filter:hue-rotate(0deg)}
}

@media(max-width:1250px) and (min-width:721px){
  :root{--side:232px}
  .command-meta{gap:18px;margin-right:16px}
  .top-actions{gap:8px}
  .hero:after{right:6%;transform:translateY(-50%) rotate(45deg) scale(.82)}
  .cards{grid-template-columns:repeat(2,minmax(0,1fr))}
}

@media(max-width:720px){
  body:before{background-size:30px 30px;opacity:.12}
  .mobile-top{background:rgba(2,8,9,.94);border-bottom-color:rgba(32,230,242,.20);backdrop-filter:blur(18px)}
  .mobile-wordmark{font-size:21px;text-transform:uppercase;letter-spacing:.01em}
  .mobile-wordmark strong{color:var(--cyan);text-shadow:0 0 10px rgba(32,230,242,.35)}
  .content{padding:14px 12px 36px}
  .hero{min-height:430px;padding:28px 24px;border-radius:8px;background:linear-gradient(150deg,rgba(6,21,24,.98),rgba(2,8,10,.96))}
  .hero:before{-webkit-mask-image:linear-gradient(transparent 45%,#000 80%);mask-image:linear-gradient(transparent 45%,#000 80%)}
  .hero:after{width:100px;height:100px;line-height:100px;font-size:20px;right:calc(50% - 50px);top:auto;bottom:43px;transform:rotate(45deg);box-shadow:0 0 0 18px rgba(32,230,242,.025),0 0 0 19px rgba(32,230,242,.20),0 0 28px rgba(32,230,242,.28);animation:osaCoreMobile 9s linear infinite}
  .hero h1{font-size:42px;line-height:1.02;max-width:340px}
  .hero p{font-size:15px;line-height:1.5}
  .mobile-metrics{margin-top:22px;gap:8px}.mobile-metrics span{border-radius:2px;background:rgba(5,19,22,.88);border-color:rgba(32,230,242,.18);font-size:9px;padding:8px 5px}
  .cards{gap:10px;margin-top:16px}
  .card{min-height:145px;border-radius:6px;padding:20px;grid-template-columns:64px 1fr;gap:16px}
  .card-top{width:64px;height:64px;border-radius:4px}
  .card-top .material-symbols-outlined{width:64px;height:64px;font-size:28px}
  .card h3{font-size:22px}.card .metric{font-size:13px;color:#fff}
  .split{margin-top:16px}
  .mobile-bottom{height:78px;background:rgba(2,8,9,.97);border-top-color:rgba(32,230,242,.22);backdrop-filter:blur(16px)}
  .mobile-bottom a.active{color:var(--cyan);border-top-color:var(--cyan);text-shadow:0 0 9px rgba(32,230,242,.32)}
  .mobile-fab{width:62px;height:62px;right:22px;bottom:94px;background:linear-gradient(135deg,var(--green),var(--cyan));box-shadow:0 0 24px rgba(67,255,136,.26)}
  @keyframes osaCoreMobile{from{transform:rotate(45deg)}to{transform:rotate(405deg)}}
}
`
