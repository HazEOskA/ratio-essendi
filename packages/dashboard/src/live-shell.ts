/**
 * The live dashboard page: a self-contained HTML shell whose data comes from
 * /api/state (polled every 2s). Operator buttons POST to /api/action; the
 * report button POSTs to /api/report. No template literals / ${} in the client
 * script (it lives inside this TS template literal), so it uses concatenation.
 */
export function renderLiveShell(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ratio Essendi — Live Ops</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d1117; color: #e6edf3; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  .wrap { max-width: 1140px; margin: 0 auto; padding: 24px 20px 70px; }
  h1 { font-size: 22px; margin: 0; letter-spacing: .3px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .sub { color: #8b949e; font-size: 13px; margin: 2px 0 18px; }
  .toolbar { display: flex; gap: 8px; flex-wrap: wrap; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: #8b949e; margin: 26px 0 10px; }
  .stats { display: flex; flex-wrap: wrap; gap: 10px; }
  .stat { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 10px 14px; min-width: 104px; }
  .stat .v { font-size: 20px; font-weight: 600; }
  .stat .l { font-size: 10.5px; color: #8b949e; text-transform: uppercase; letter-spacing: .6px; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border: 1px solid #21262d; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #21262d; vertical-align: top; }
  th { font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px; color: #8b949e; background: #11161d; }
  tr:last-child td { border-bottom: none; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
  .dim { color: #8b949e; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  .card { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
  .ctitle { font-weight: 600; margin-bottom: 6px; }
  .card pre { white-space: pre-wrap; background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 8px 10px; margin: 6px 0; font-size: 12px; color: #c9d1d9; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 600; border: 1px solid transparent; white-space: nowrap; }
  .badge.ok, .v.ok { background: #11321f; color: #3fb950; border-color: #234b2e; }
  .badge.warn, .v.warn { background: #34270a; color: #d29922; border-color: #4d3c14; }
  .badge.bad, .v.bad { background: #3a1418; color: #f85149; border-color: #5a1e23; }
  .badge.muted { background: #21262d; color: #8b949e; border-color: #30363d; }
  .badge.info, .v.info { background: #0f2740; color: #58a6ff; border-color: #1c3a5e; }
  .v.ok, .v.warn, .v.bad, .v.info { background: transparent; }
  button.b, .tbtn { cursor: pointer; border-radius: 8px; border: 1px solid #30363d; background: #21262d; color: #e6edf3; padding: 6px 12px; font-size: 12.5px; font-weight: 600; }
  button.b.ok { background: #11321f; color: #3fb950; border-color: #234b2e; }
  button.b.bad { background: #3a1418; color: #f85149; border-color: #5a1e23; }
  button.b.warn { background: #34270a; color: #d29922; border-color: #4d3c14; }
  tr.evt.bad td { background: rgba(248,81,73,.05); }
  tr.evt.ok td { background: rgba(63,185,80,.05); }
  tr.evt.warn td { background: rgba(210,153,34,.05); }
  #report { white-space: pre-wrap; background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 14px; min-height: 60px; font-size: 13px; color: #c9d1d9; }
  .pill { font-size: 11.5px; color: #8b949e; border: 1px solid #30363d; border-radius: 999px; padding: 1px 10px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <h1>Ratio Essendi — Live Ops</h1>
      <p class="sub">Live view · operator controls · <span id="paused" class="pill">…</span></p>
    </div>
    <div class="toolbar">
      <button class="tbtn" id="btn-tick">Tick now</button>
      <button class="tbtn" id="btn-pause">Pause sim</button>
      <button class="tbtn" id="btn-resume">Resume sim</button>
      <button class="tbtn" id="btn-report">Generate LLM report</button>
    </div>
  </div>

  <div class="stats" id="stats"></div>

  <div class="grid">
    <div>
      <h2>Pending your approval</h2>
      <div id="pending"></div>
    </div>
    <div>
      <h2>Needs attention (drift / weak)</h2>
      <div id="attention"></div>
    </div>
  </div>

  <h2>Operator report</h2>
  <div id="report" class="dim">Click "Generate LLM report" for a briefing.</div>

  <h2>System cells</h2>
  <table><thead><tr><th>ID</th><th>Name</th><th>Domain</th><th>Health</th><th>Control</th></tr></thead><tbody id="cells"></tbody></table>

  <h2>Agents</h2>
  <table><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Status</th><th>Lineage</th></tr></thead><tbody id="agents"></tbody></table>

  <h2>Decision log (latest first)</h2>
  <table><thead><tr><th>Event</th><th>Entity</th><th>Transition</th><th>Reason</th></tr></thead><tbody id="log"></tbody></table>
</div>

<script>
  var E = function (s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  var badge = function (t,c) { return '<span class="badge '+c+'">'+E(t)+'</span>'; };
  var healthC = function (s) { return s==='healthy'?'ok':s==='failed'?'bad':s==='quarantined'?'muted':'warn'; };
  var agentC = function (s) { if(s==='active')return 'ok'; if(s==='created')return 'info'; if(s==='replaced'||s==='archived')return 'muted'; if(s==='degraded'||s==='disabled')return 'bad'; return 'warn'; };
  var evtC = function (t) { if(/fail|drift|conflict|quarantined|blocked|disabled|rejected/.test(t))return 'bad'; if(/succession|warning|under_review|shadow_prepared/.test(t))return 'warn'; if(/approval|granted|recovered|shadow_promoted|activated|successor|replaced|output_evaluated/.test(t))return 'ok'; return 'info'; };
  var stat = function (l,v,c) { return '<div class="stat"><div class="v '+(c||'info')+'">'+E(v)+'</div><div class="l">'+E(l)+'</div></div>'; };

  function getState(){ return fetch('/api/state').then(function(r){ return r.json(); }); }
  function act(a,id){ return fetch('/api/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:a,id:id})}).then(render); }
  function genReport(){ var el=document.getElementById('report'); el.textContent='Generating report…'; return fetch('/api/report',{method:'POST'}).then(function(r){return r.json();}).then(function(j){ el.textContent='['+j.mode+']\\n\\n'+j.report; }).catch(function(e){ el.textContent='Report failed: '+e; }); }

  function render(){
    return getState().then(function(st){
      var s = st.snapshot;
      var pend = st.pending.filter(function(p){return p.status==='pending';});
      var active = s.agents.filter(function(a){return a.status==='active';}).length;
      var replaced = s.agents.filter(function(a){return a.status==='replaced';}).length;
      var attention = s.agents.filter(function(a){return ['succession_required','degraded','under_review','warning'].indexOf(a.status)>=0;});

      document.getElementById('paused').textContent = st.paused ? 'sim paused' : 'sim running';
      document.getElementById('stats').innerHTML =
        stat('Cells',s.cells.length)+stat('Agents',s.agents.length)+stat('Active',active,'ok')+stat('Replaced',replaced,'muted')+stat('Pending',pend.length,pend.length?'warn':'ok')+stat('Decisions',s.events.length);

      document.getElementById('pending').innerHTML = pend.length ? pend.map(function(p){
        return '<div class="card"><div class="ctitle">'+E(p.agentName)+' <span class="dim mono">'+E(p.agentId)+'</span> '+badge('score '+p.score,'info')+'</div><pre>'+E(p.offer)+'</pre><div class="row"><button class="b ok" data-act="approve" data-id="'+E(p.id)+'">Approve</button><button class="b bad" data-act="reject" data-id="'+E(p.id)+'">Reject</button></div></div>';
      }).join('') : '<div class="dim">No offers awaiting approval.</div>';

      document.getElementById('attention').innerHTML = attention.length ? attention.map(function(a){
        return '<div class="card"><div class="ctitle">'+E(a.name)+' <span class="dim mono">'+E(a.id)+'</span> '+badge(a.status,agentC(a.status))+'</div><div class="row"><button class="b warn" data-act="succeed" data-id="'+E(a.id)+'">Force succession</button><button class="b bad" data-act="quarantine" data-id="'+E(a.id)+'">Quarantine</button></div></div>';
      }).join('') : '<div class="dim">No agents need attention.</div>';

      document.getElementById('cells').innerHTML = s.cells.map(function(c){
        return '<tr><td class="mono">'+E(c.id)+'</td><td>'+E(c.name)+'</td><td>'+E(c.domain)+'</td><td>'+badge(c.healthStatus,healthC(c.healthStatus))+'</td><td>'+(c.activeController?badge('active controller','ok'):badge('standby','muted'))+'</td></tr>';
      }).join('');

      document.getElementById('agents').innerHTML = s.agents.map(function(a){
        var lin = (a.lineage && a.lineage.createdFrom) ? 'from '+a.lineage.createdFrom : ((a.lineage && a.lineage.successorId) ? '→ '+a.lineage.successorId : '—');
        return '<tr><td class="mono">'+E(a.id)+'</td><td>'+E(a.name)+' <span class="dim">'+E(a.version)+'</span></td><td>'+E(a.role)+'</td><td>'+badge(a.status,agentC(a.status))+'</td><td class="mono dim">'+E(lin)+'</td></tr>';
      }).join('');

      var ev = s.events.slice(-25).reverse();
      document.getElementById('log').innerHTML = ev.map(function(e){
        var tr = (e.previousState||e.nextState) ? E((e.previousState||'∅')+' → '+(e.nextState||'∅')) : '';
        return '<tr class="evt '+evtC(e.eventType)+'"><td>'+badge(e.eventType,evtC(e.eventType))+'</td><td class="mono">'+E(e.entityId)+'</td><td class="mono dim">'+tr+'</td><td>'+E(e.reason||'')+'</td></tr>';
      }).join('');
    }).catch(function(){});
  }

  document.addEventListener('click', function(e){
    var t = e.target;
    if (t && t.getAttribute) { var a = t.getAttribute('data-act'); if (a) { act(a, t.getAttribute('data-id') || ''); } }
  });
  document.getElementById('btn-report').addEventListener('click', genReport);
  document.getElementById('btn-pause').addEventListener('click', function(){ act('pause',''); });
  document.getElementById('btn-resume').addEventListener('click', function(){ act('resume',''); });
  document.getElementById('btn-tick').addEventListener('click', function(){ act('tick',''); });
  render();
  setInterval(render, 2000);
</script>
</body>
</html>
`
}
