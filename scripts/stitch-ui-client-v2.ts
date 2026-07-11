export const STITCH_CLIENT_V2 = String.raw`
const screen = document.body.dataset.screen;
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modal-card');
const toast = document.getElementById('toast');
let cachedLeadState = null;
let leadHighValueOnly = false;
let mapZoom = 1;

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const fmt = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const shortTime = (value) => {
  try { return new Date(value).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '--:--:--'; }
};
const dateStamp = () => new Date().toISOString().slice(11, 19);

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function postForm(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
    body: new URLSearchParams(data),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.text();
}

function notify(message, bad = false) {
  toast.textContent = message;
  toast.style.borderColor = bad ? 'var(--danger)' : 'var(--cyan)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function openModal(html) {
  modalCard.innerHTML = html;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modalCard.innerHTML = '';
}

function setShellMode(mode) {
  const slot = document.getElementById('shell-mode');
  if (slot) slot.textContent = String(mode || 'IDLE').replaceAll('_', ' ');
}

function mobileStats(admin) {
  const cpu = Math.min(99, 12 + Number(admin.counts.workRuns || 0));
  const memory = (2.4 + Number(admin.counts.events || 0) / 100).toFixed(1);
  const up = Math.max(1, Number(admin.counts.workRuns || 0));
  return '<div class="mobile-metrics" style="display:none">' +
    '<span>CPU: ' + cpu + '%</span>' +
    '<span>MEM: ' + memory + 'GB</span>' +
    '<span>UP: ' + up + ' RUN</span>' +
  '</div>';
}

function moduleCard(item) {
  const statusClass = item.attention ? ' attention' : '';
  return '<article class="card">' +
    '<div class="card-top"><span class="material-symbols-outlined">' + item.icon + '</span><span class="card-code">' + item.code + '</span></div>' +
    '<h3>' + esc(item.title) + '</h3>' +
    '<p>' + esc(item.description) + '</p>' +
    '<div class="metric-row"><div class="metric">' + esc(item.metric) + '</div><span class="module-status' + statusClass + '">' + esc(item.status) + '</span></div>' +
    '<a class="button" href="' + item.href + '">' + esc(item.action) + '</a>' +
  '</article>';
}

function commandView(admin, production) {
  setShellMode(admin.mode);
  const integrity = admin.integrity || [];
  const unhealthy = integrity.filter((entry) => entry.status !== 'healthy').length;
  const activeWorkstreams = Number(admin.leadEngine.active || 0) + Number(admin.businessLoop.activeOrders || 0) + Number(admin.businessLoop.ordersReadyForReview || 0);
  const efficiency = Math.max(0, 100 - unhealthy * 5.2).toFixed(1);
  const stations = production.stations || [];
  const recentRuns = admin.workRunsSummary || [];
  const attentionCount = Number(admin.businessLoop.ordersReadyForReview || 0) + Number(admin.leadEngine.awaitingSend || 0) + unhealthy;

  const modules = [
    { icon: 'rocket_launch', code: 'LEAD_ENG', title: 'Lead Engine', description: 'Operator-controlled lead threads, qualification and reply drafting.', metric: fmt(admin.leadEngine.active) + ' Active', status: 'Operational', href: '/lead-engine', action: 'Open Lead Console' },
    { icon: 'factory', code: 'PROD_FLOW', title: 'Production Line', description: 'Client work, training outputs, rework and packaging flow.', metric: fmt(admin.businessLoop.activeOrders) + ' Active', status: 'Operational', href: '/production-line', action: 'Open Factory' },
    { icon: 'receipt_long', code: 'ORD_MGR', title: 'Client Orders', description: 'Inbound request synthesis and operator decision gates.', metric: fmt(admin.businessLoop.ordersReadyForReview) + ' Critical', status: attentionCount ? 'Attention' : 'Clear', attention: attentionCount > 0, href: '/orders', action: 'Open Tickets' },
    { icon: 'local_shipping', code: 'DLV_NODE', title: 'Delivery Center', description: 'Approved output packaging and client handoff preparation.', metric: fmt(admin.businessLoop.deliveryPacks.warehouseReady) + ' Ready', status: 'Operational', href: '/delivery', action: 'Open Logistics' },
    { icon: 'smart_toy', code: 'AGT_CORE', title: 'Agent Operations', description: 'Production station state and task distribution visibility.', metric: fmt(stations.length) + ' Nodes', status: 'Stable', href: '/production-line', action: 'Open Hive' },
    { icon: 'sensors', code: 'SIG_INT', title: 'Signal Room', description: 'Signal intake, qualification and offer acquisition evidence.', metric: fmt(admin.counts.events) + ' Events', status: 'Listening', href: '/?legacy=1', action: 'Open Radio' },
    { icon: 'database', code: 'DATA_STORE', title: 'Warehouse', description: 'Approved assets and institutional delivery memory.', metric: fmt(admin.counts.warehouseAssets) + ' Assets', status: 'Indexed', href: '/warehouse', action: 'Open Storage' },
    { icon: 'shield', code: 'SYS_SEC', title: 'System Integrity', description: 'Agent integrity records and production safety boundaries.', metric: unhealthy ? fmt(unhealthy) + ' Alerts' : '100% Health', status: unhealthy ? 'Attention' : 'Secure', attention: unhealthy > 0, href: '/operator', action: 'Open Security' },
  ];

  const eventRows = recentRuns.slice(0, 4).map((run, index) => {
    const isMag = run.status === 'failed' || index === 1;
    const icon = run.status === 'failed' ? 'priority_high' : index === 2 ? 'send' : 'check_circle';
    return '<div class="event' + (isMag ? ' mag' : '') + '">' +
      '<i class="dot"></i><time>' + shortTime(run.finishedAt || run.startedAt) + '</time>' +
      '<span>[' + esc(run.mode) + '] ' + esc(run.nextOperatorAction || run.status) + '</span>' +
      '<span class="material-symbols-outlined event-icon">' + icon + '</span>' +
    '</div>';
  }).join('');

  return '<section class="hero">' +
    '<div class="eyebrow">SYSTEM_STATUS_ALPHA</div>' +
    '<h1>Your company is operational.</h1>' +
    '<p>Agents are processing <span class="hero-copy-strong">' + fmt(activeWorkstreams) + ' active workstreams</span> across all connected modules. Derived operational integrity is at <span class="hero-copy-strong">' + efficiency + '%</span>.</p>' +
    '<div class="system-summary"><span><i></i>MODE ' + esc(admin.mode) + '</span><span><i></i>AUTOPILOT ' + (admin.autopilotEnabled ? 'ON' : 'PAUSED') + '</span><span><i></i>TRAINING ' + esc(admin.businessLoop.trainingToday) + '</span></div>' +
    mobileStats(admin) +
    '<div class="hero-actions"><a class="button primary" href="/factory-run">CONTINUE OPERATION <span class="material-symbols-outlined">arrow_forward</span></a><a class="button" href="/events">VIEW LIVE LOGS</a></div>' +
  '</section>' +
  '<div class="section-head"><div><div class="stamp">CORE_MODULES_08</div><h2>System Infrastructure</h2></div><div class="tag system-green"><span class="dot"></span>' + (unhealthy ? 'ATTENTION REQUIRED' : 'ALL SYSTEMS GREEN') + '</div></div>' +
  '<section class="cards">' + modules.map(moduleCard).join('') + '</section>' +
  '<section class="split"><div><div class="section-head" style="margin-top:0"><h2 style="font-size:23px">Recent Factory Events</h2><a class="stamp" href="/events" style="color:var(--cyan)">EXPORT LOGS</a></div><div class="panel events">' + (eventRows || '<div class="empty-state">NO WORK RUN EVENTS YET</div>') + '</div></div>' +
  '<div><h2 style="font:700 23px Plus Jakarta Sans">Attention Required</h2>' +
    '<div class="attention urgent"><div class="attention-meta"><span>OPERATOR DECISION</span><span>' + fmt(attentionCount) + ' OPEN</span></div><p>' + esc(admin.nextOperatorAction.detail) + '</p><div class="attention-actions"><a class="button mag" href="/admin?legacy=1">OPEN GATE</a><a class="button" href="/orders">REVIEW QUEUE</a></div></div>' +
    '<div class="attention"><div class="attention-meta"><span>SYSTEM CONTROL</span><span>' + (admin.autopilotEnabled ? 'ACTIVE' : 'PAUSED') + '</span></div><p>Autopilot is <strong>' + (admin.autopilotEnabled ? 'enabled' : 'paused') + '</strong>. Existing review gates remain mandatory.</p><div class="attention-actions"><button class="button primary" data-action="start">START</button><button class="button" data-action="pause">PAUSE</button></div></div>' +
  '</div></section>';
}

function qualificationScore(thread) {
  let score = 42;
  score += thread.messages ? Math.min(28, thread.messages.length * 7) : 0;
  score += thread.qualification && thread.qualification.problem ? 10 : 0;
  score += thread.qualification && thread.qualification.budget ? 10 : 0;
  score += thread.qualification && thread.qualification.decisionMaker ? 10 : 0;
  if (thread.status === 'qualified') score += 12;
  if (thread.status === 'hot') score += 8;
  return Math.min(99, score);
}

function draftCard(thread, drafterMode) {
  const draft = [...(thread.messages || [])].reverse().find((message) => message.author === 'lea_draft');
  const confidence = qualificationScore(thread);
  if (!draft) return '';
  return '<div class="draft"><div class="id">DRAFT-ID: ' + esc(draft.id.slice(0, 8).toUpperCase()) + '</div>' +
    '<h4>Target: ' + esc(thread.company || thread.leadName) + '</h4>' +
    '<p>“' + esc(draft.text.slice(0, 145)) + (draft.text.length > 145 ? '…' : '') + '”</p>' +
    '<div class="draft-confidence"><span>✣ AI CONFIDENCE: ' + confidence + '%</span><button data-action="review" data-id="' + esc(thread.id) + '">REVIEW</button></div>' +
    '<div class="stamp" style="margin-top:8px">MODE: ' + esc(draft.draftMode || drafterMode) + '</div></div>';
}

function leadView(leadState) {
  cachedLeadState = leadState;
  const threads = leadState.threads || [];
  const allActive = threads.filter((thread) => !['won', 'lost'].includes(thread.status));
  const active = leadHighValueOnly ? allActive.filter((thread) => ['hot', 'qualified'].includes(thread.status) || qualificationScore(thread) >= 75) : allActive;
  const pending = threads.filter((thread) => (thread.messages || []).some((message) => message.author === 'lea_draft')).slice(0, 5);
  const quality = threads.length ? Math.round(threads.reduce((total, thread) => total + qualificationScore(thread), 0) / threads.length) : 0;
  const speed = Math.max(0.1, allActive.length / Math.max(1, threads.length) * 2.4).toFixed(1);

  const rows = active.slice(0, 6).map((thread) => {
    const strength = qualificationScore(thread);
    const engagement = thread.status === 'hot' ? 'HOT_RESPONSE' : thread.status === 'qualified' ? 'QUALIFIED' : thread.messages && thread.messages.length > 2 ? 'AUTOMATED_FLOW' : 'IDLE';
    return '<tr><td><span class="lead-name">' + esc(thread.id.slice(0, 8).toUpperCase()) + ' // ' + esc(thread.company || thread.leadName) + '</span><br><span class="stamp">TIMESTAMP: ' + esc(thread.updatedAt.slice(0, 19).replace('T', '.')) + '</span></td>' +
      '<td><div class="strength"><div class="bar"><i style="width:' + strength + '%"></i></div>' + strength + '%</div></td>' +
      '<td><span class="tag">' + engagement + '</span></td>' +
      '<td><button class="button" data-action="review" data-id="' + esc(thread.id) + '">REVIEW</button></td></tr>';
  }).join('');

  const consoleRows = threads.slice(0, 8).map((thread, index) => {
    const label = index % 3 === 0 ? 'INCOMING_SIGNAL' : index % 3 === 1 ? 'DRAFT_GENERATED' : 'THREAD_STATUS';
    return '[' + shortTime(thread.updatedAt) + '] ' + label + ': ' + esc(thread.id.slice(0, 8)) + ' / ' + esc(thread.status.toUpperCase());
  }).join('<br>');

  return '<div class="metrics-row"><div class="metric-box with-rail"><div class="metric-rail">PERFORMANCE_X1</div><div class="stamp">LEAD QUALITY INDEX</div><strong class="cyan">' + quality + '%</strong><div class="bar" style="width:100%;margin-top:14px"><i style="width:' + quality + '%"></i></div></div>' +
    '<div class="metric-box with-rail"><div class="metric-rail">VELOCITY_X2</div><div class="stamp">ACQUISITION SPEED</div><strong>' + speed + '</strong><span>/sec</span><div class="metric-note">↗ REAL ACTIVE-THREAD RATIO</div></div>' +
    '<div class="metric-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:18px"><div><div class="stamp">TOTAL NEURAL DRAFTS</div><strong>' + fmt(pending.length) + '</strong><p>Awaiting operator validation for deployment.</p></div><button class="button" data-action="review-all">REVIEW ALL DRAFTS</button></div></div></div>' +
    '<div class="lead-grid"><div><section class="panel"><div class="lead-toolbar"><div class="lead-toolbar-left"><span><i class="dot"></i>ACTIVE OPERATIONS (LEADS)</span></div><div class="lead-toolbar-right"><button class="filter-button ' + (leadHighValueOnly ? 'active' : '') + '" data-action="filter-high">FILTER: HIGH_VALUE</button><span class="tag">TOTAL: ' + active.length + '</span></div></div>' +
      '<table class="table"><thead><tr><th>ID / ENTITY</th><th>SIGNAL STRENGTH</th><th>ENGAGEMENT</th><th>ACTIONS</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4"><div class="empty-state">NO MATCHING ACTIVE LEADS</div></td></tr>') + '</tbody></table><div class="archive-row">LOAD SYSTEM ARCHIVES (+' + Math.max(0, threads.length - active.slice(0, 6).length) + ' ENTRIES)</div></section>' +
      '<div class="lower-grid"><div class="attention lead-task"><div class="task-meta"><span class="material-symbols-outlined" style="color:var(--cyan)">history</span><span class="tag">OPERATOR CONTROL</span></div><h3>Omni-Channel Re-Engagement</h3><p>Capture a new inbound message, let LEA draft, then decide what leaves the system.</p><div class="button-row"><button class="button" data-action="new-lead">NEW THREAD</button><button class="button primary" data-action="review-all">OPEN DRAFTS</button></div></div>' +
      '<div class="attention lead-task"><div class="task-meta"><span class="material-symbols-outlined" style="color:var(--cyan)">forward_to_inbox</span><span class="tag">PENDING_REVIEW</span></div><h3>High-Tier Manual Outreach</h3><p>Decision-maker communication stays behind the human operator gate.</p><div class="button-row" style="grid-template-columns:1fr"><a class="button" href="/lead-engine?legacy=1">OPEN COMMS TERMINAL</a></div></div></div></div>' +
      '<aside class="panel staging-panel" id="drafts"><div class="panel-head">NEURAL STAGING (DRAFTS)<span class="tag">' + pending.length + '</span></div><div class="drafts">' + (pending.map((thread) => draftCard(thread, leadState.drafterMode)).join('') || '<div class="empty-state">NO DRAFTS WAITING</div>') + '</div><div class="review-pipeline"><a class="button block" href="/lead-engine?legacy=1">REVIEW PIPELINE</a></div></aside></div>' +
      '<div class="terminal console-feed">' + (consoleRows || '[--:--:--] LEAD_ENGINE: WAITING_FOR_FIRST_THREAD') + '</div>';
}

function mapSvg() {
  return '<svg class="map-svg" viewBox="0 0 900 460" preserveAspectRatio="xMidYMid slice" aria-label="Agent deployment network map">' +
    '<g transform="scale(' + mapZoom + ') translate(' + ((1 - mapZoom) * 450) + ' ' + ((1 - mapZoom) * 230) + ')">' +
    '<path class="land" d="M65 125L115 86 174 91 206 121 186 153 140 162 117 194 76 176 45 149Z M234 215L278 192 302 224 286 284 310 343 280 392 245 355 230 297 205 258Z M370 105L420 78 474 94 505 128 550 123 590 154 566 189 520 198 486 174 450 190 419 166 388 174 349 148Z M500 210L553 194 601 220 622 264 603 323 565 379 523 351 516 305 489 276Z M635 113L705 96 774 121 814 166 775 202 719 190 682 159 640 164 612 140Z M725 300L776 278 831 306 818 354 772 372 732 348Z"/>' +
    '<path class="route" d="M110 145 Q305 30 470 145 T760 145 M270 250 Q430 100 690 150 M470 145 Q540 260 780 325"/>' +
    '<path class="route mag" d="M110 145 Q330 310 565 275 T780 325 M470 145 Q620 30 760 145"/>' +
    '<circle class="node" cx="110" cy="145" r="5"/><circle class="node mag" cx="270" cy="250" r="5"/><circle class="node" cx="470" cy="145" r="6"/><circle class="node mag" cx="565" cy="275" r="5"/><circle class="node" cx="690" cy="150" r="5"/><circle class="node mag" cx="780" cy="325" r="5"/>' +
    '</g></svg>';
}

function operatorView(admin, workRuns) {
  setShellMode(admin.mode);
  const integrity = admin.integrity || [];
  const incidents = integrity.filter((entry) => entry.status !== 'healthy');
  const runs = workRuns.workRuns || [];
  const verbose = localStorage.getItem('ratio.verboseLogs') === '1';
  const visibleRuns = runs.slice(0, verbose ? 14 : 9);
  const logRows = visibleRuns.map((run, index) => {
    const level = run.status === 'failed' ? 'CRITICAL' : index === 4 ? 'WARN' : index === visibleRuns.length - 1 ? 'SYSTEM' : 'INFO';
    const cls = level === 'CRITICAL' ? 'log-critical' : level === 'WARN' ? 'log-warn' : level === 'SYSTEM' ? 'log-system' : 'log-info';
    return '<div><span>[' + shortTime(run.finishedAt || run.startedAt) + ']</span>&nbsp;&nbsp;&nbsp;<span class="' + cls + '">' + level + ':</span>&nbsp; ' + esc(run.mode) + ' — ' + esc(run.nextOperatorAction || run.status) + '</div>';
  }).join('');

  const incidentCards = incidents.map((entry, index) => '<div class="incident alert"><div class="incident-head"><strong>' + esc(entry.agentId) + '_' + esc(entry.status.toUpperCase()) + '</strong><time>' + (index + 1) + 'm ago</time></div><p>Nose length: ' + entry.noseLength + ' · breaches: ' + entry.breaches + '<br>' + esc(entry.lastSignal || 'Integrity threshold exceeded.') + '</p></div>').join('');
  const uptime = Math.max(90, 100 - incidents.length * 1.7).toFixed(1);
  const jitter = Math.max(0.4, Math.min(9.9, Number(admin.counts.events || 0) / 100)).toFixed(1);

  return '<div class="cockpit"><section class="panel health status-log"><div class="panel-head"><span>⌘ SYSTEM_HEALTH_LOGS</span><span><span class="tag" style="color:var(--cyan)">LIVE_FEED</span>&nbsp;&nbsp;<span class="stamp">BUFFER: ' + (2.4 + Number(admin.counts.events || 0) / 100).toFixed(1) + 'GB</span></span></div><div class="terminal" style="border:0;min-height:370px">' + (logRows || '<div class="log-system">[' + dateStamp() + '] SYSTEM: Waiting for next cycle...</div>') + '</div></section>' +
    '<aside class="panel"><div class="panel-head" style="color:var(--mag)">✱ INTEGRITY_INCIDENTS <span>' + incidents.length + ' ACTIVE</span></div><div class="incidents">' + (incidentCards || '<div class="incident"><div class="incident-head"><strong style="color:var(--cyan)">ALL_CLEAR</strong><time>NOW</time></div><p>No integrity incidents. Every monitored production agent is healthy.</p></div>') + '</div></aside></div>' +
    '<div class="lower-grid"><section class="panel"><div class="panel-head">◫ AGENT_DEPLOYMENT_MAP <span><i class="dot"></i> ACTIVE &nbsp; <i class="dot" style="background:var(--mag)"></i> ALERT</span></div><div class="deployment-map">' + mapSvg() + '<div class="map-label">COORDS: 52.09° N, 5.12° E<br><span style="color:var(--cyan)">REGION: EUROPE_OPERATOR_MESH</span><br>DENSITY: ' + fmt(admin.counts.workRuns) + ' VERIFIED RUNS</div><div class="map-controls"><button data-action="map-plus" aria-label="Zoom in">+</button><button data-action="map-minus" aria-label="Zoom out">−</button></div></div></section>' +
    '<div><section class="panel"><div class="panel-head">☷ CONFIGURATION_SETTINGS</div><div class="settings"><div class="setting"><div class="setting-line"><span>AGENT_AUTONOMY_LEVEL</span><span style="color:var(--cyan)">' + (admin.autopilotEnabled ? 'LEVEL_04' : 'PAUSED') + '</span></div><input class="setting-control" type="range" min="0" max="4" value="' + (admin.autopilotEnabled ? '4' : '0') + '" data-action="autonomy-range"></div><div class="setting"><div class="setting-line"><span>RESPONSE_PRIORITY_WEIGHT</span><span style="color:var(--cyan)">0.82</span></div><input class="setting-control" type="range" min="0" max="100" value="82" data-action="priority-range"></div><div class="toggle-row"><label class="toggle"><input type="checkbox" data-action="toggle-autopilot" ' + (admin.autopilotEnabled ? 'checked' : '') + '> SAFE_AUTOPILOT</label><label class="toggle"><input type="checkbox" data-action="verbose-logs" ' + (verbose ? 'checked' : '') + '> VERBOSE_LOGS</label><span class="toggle locked"><input type="checkbox" disabled> AUTO_HEAL_LOCKED</span></div></div></section>' +
    '<section class="panel" style="margin-top:24px"><div class="panel-head">▣ SYSTEM_DIAGNOSTICS</div><div class="settings"><div class="diag-bars"><i style="height:42%"></i><i style="height:66%"></i><i style="height:82%"></i><i style="height:96%"></i><i style="height:61%"></i><i style="height:48%"></i></div><div class="metrics-row" style="grid-template-columns:repeat(3,1fr);margin:0"><div class="tag" style="text-align:center"><b>' + uptime + '%</b><br>UPTIME</div><div class="tag" style="text-align:center"><b>' + jitter + 'ms</b><br>JITTER</div><div class="tag" style="text-align:center"><b>' + fmt(admin.counts.events) + '</b><br>EVENTS</div></div></div></section></div></div>' +
    '<div class="telemetry-strip"><div class="telemetry-group"><div class="telemetry-item"><small>DATA_INGRESS</small><strong>' + (1 + Number(admin.counts.events || 0) / 1000).toFixed(1) + ' GB/s ▲</strong></div><div class="telemetry-item"><small>AGENT_COUNT</small><strong>' + fmt((admin.counts.workRuns || 0) + (admin.counts.dailyDigitals || 0)) + '</strong></div><div class="telemetry-item"><small>ENCRYPTION</small><strong>AES-256-GCM</strong></div></div><div class="telemetry-stable"><span>SYSTEM_CORE_TIMESTAMP: ' + dateStamp() + '</span><i></i><span>STABLE_LINK</span></div></div>';
}

function leadForm() {
  openModal('<h3>CREATE LEAD THREAD</h3><p class="stamp">Ratio Essendi captures the thread. LEA drafts. The operator sends.</p><form class="form" id="lead-form"><input name="leadName" placeholder="Lead name" required><input name="company" placeholder="Company"><input name="source" placeholder="Source"><textarea name="firstMessage" placeholder="First inbound message (optional)"></textarea><div class="form-actions"><button type="button" class="button" data-action="close">CANCEL</button><button class="button primary">CREATE THREAD</button></div></form>');
  document.getElementById('lead-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await postForm('/api/lead-engine', { action: 'create', ...data });
      closeModal();
      notify('LEAD THREAD CREATED');
      await boot();
    } catch (error) { notify(error.message, true); }
  });
}

async function reviewLead(id) {
  const leadState = cachedLeadState || await fetchJson('/api/lead-engine');
  const thread = leadState.threads.find((entry) => entry.id === id);
  if (!thread) return notify('THREAD NOT FOUND', true);
  const draft = [...(thread.messages || [])].reverse().find((message) => message.author === 'lea_draft');
  openModal('<h3>' + esc(thread.leadName) + ' // ' + esc(thread.company || 'NO COMPANY') + '</h3><p class="stamp">THREAD ' + esc(thread.id) + ' · ' + esc(thread.status) + '</p><div class="terminal" style="white-space:pre-wrap">' + esc(draft ? draft.text : 'No draft waiting. Capture incoming text or request a proposal.') + '</div><form class="form" id="review-form" style="margin-top:16px"><textarea name="text" placeholder="Paste incoming message or the text you sent"></textarea><input name="feedback" placeholder="Redraft feedback or status note"><select name="status"><option value="">Keep current status</option><option>cold</option><option>warm</option><option>hot</option><option>qualified</option><option>won</option><option>lost</option></select><div class="form-actions" style="flex-wrap:wrap"><button type="button" class="button" data-op="incoming">CAPTURE INCOMING</button><button type="button" class="button" data-op="redraft">REDRAFT</button><button type="button" class="button" data-op="proposal">DRAFT PROPOSAL</button><button type="button" class="button mag" data-op="mark-sent">MARK SENT BY OPERATOR</button><button type="button" class="button primary" data-op="status">SET STATUS</button></div></form>');
  document.getElementById('review-form').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-op]');
    if (!button) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const operation = button.dataset.op;
    const payload = { action: operation, threadId: id };
    if (operation === 'incoming' || operation === 'mark-sent') payload.text = data.text;
    if (operation === 'redraft') payload.feedback = data.feedback;
    if (operation === 'status') { payload.status = data.status; payload.note = data.feedback; }
    try {
      await postForm('/api/lead-engine', payload);
      closeModal();
      notify('LEAD ACTION RECORDED');
      cachedLeadState = null;
      await boot();
    } catch (error) { notify(error.message, true); }
  });
}

modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  try {
    if (action === 'start') {
      await postForm('/api/autopilot', { action: 'on' });
      notify('AUTOPILOT: OPERATIONAL');
      return boot();
    }
    if (action === 'pause') {
      await postForm('/api/autopilot', { action: 'off' });
      notify('AUTOPILOT: PAUSED');
      return boot();
    }
    if (action === 'notify') return notify('NO UNREAD CRITICAL ALERTS');
    if (action === 'close') return closeModal();
    if (action === 'new-lead') return leadForm();
    if (action === 'review') return reviewLead(control.dataset.id);
    if (action === 'legacy') return location.href = location.pathname + '?legacy=1';
    if (action === 'review-all') return document.getElementById('drafts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (action === 'filter-high') {
      leadHighValueOnly = !leadHighValueOnly;
      if (cachedLeadState) app.innerHTML = leadView(cachedLeadState);
      return;
    }
    if (action === 'map-plus') {
      mapZoom = Math.min(1.35, mapZoom + 0.1);
      return boot();
    }
    if (action === 'map-minus') {
      mapZoom = Math.max(0.8, mapZoom - 0.1);
      return boot();
    }
  } catch (error) { notify(error.message, true); }
});

document.addEventListener('change', async (event) => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  try {
    if (action === 'toggle-autopilot') {
      await postForm('/api/autopilot', { action: control.checked ? 'on' : 'off' });
      notify(control.checked ? 'SAFE AUTOPILOT ENABLED' : 'SAFE AUTOPILOT PAUSED');
      return boot();
    }
    if (action === 'autonomy-range') {
      const enabled = Number(control.value) > 0;
      await postForm('/api/autopilot', { action: enabled ? 'on' : 'off' });
      notify(enabled ? 'AUTONOMY LEVEL APPLIED' : 'AUTONOMY PAUSED');
      return boot();
    }
    if (action === 'verbose-logs') {
      localStorage.setItem('ratio.verboseLogs', control.checked ? '1' : '0');
      notify(control.checked ? 'VERBOSE LOGS ENABLED' : 'VERBOSE LOGS DISABLED');
      return boot();
    }
    if (action === 'priority-range') {
      localStorage.setItem('ratio.priorityWeight', String(control.value));
      return notify('LOCAL PRIORITY VIEW UPDATED: ' + control.value + '%');
    }
  } catch (error) { notify(error.message, true); }
});

async function boot() {
  app.innerHTML = '<div class="terminal">SYNCING LIVE FACTORY STATE...</div>';
  try {
    if (screen === 'command') {
      const [admin, production] = await Promise.all([fetchJson('/api/admin/state'), fetchJson('/api/production-line')]);
      app.innerHTML = commandView(admin, production);
      return;
    }
    if (screen === 'lead') {
      const leadState = await fetchJson('/api/lead-engine');
      app.innerHTML = leadView(leadState);
      return;
    }
    const [admin, runs] = await Promise.all([fetchJson('/api/admin/state'), fetchJson('/api/work-runs')]);
    app.innerHTML = operatorView(admin, runs);
  } catch (error) {
    app.innerHTML = '<div class="terminal"><span class="mag">UI_SYNC_ERROR:</span> ' + esc(error.message) + '<br><br><button class="button" data-action="legacy">OPEN LEGACY UI</button></div>';
  }
}

boot();
`
