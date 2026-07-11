export const STITCH_PRODUCT_CLIENT = String.raw`
const screen = document.body.dataset.screen;
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modal-card');
const toast = document.getElementById('toast');
let cachedLegacyHtml = '';

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const fmt = (value) => new Intl.NumberFormat('en-US').format(Number(value || 0));
const shortTime = (value) => {
  try { return new Date(value).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '--:--:--'; }
};
const shortDate = (value) => {
  try { return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return String(value || '—'); }
};
const routePath = () => location.pathname.length > 1 && location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { accept: 'text/html' } });
  if (!response.ok) throw new Error(await response.text());
  return response.text();
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
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function setShellMode(mode) {
  const slot = document.getElementById('shell-mode');
  if (slot) slot.textContent = String(mode || 'IDLE').replaceAll('_', ' ');
}

function statusClass(value) {
  const v = String(value || '').toLowerCase();
  if (/failed|rejected|blocked|quarantined|lost/.test(v)) return 'mag';
  if (/ready|waiting|review|watch|rework|draft/.test(v)) return 'yellow';
  return 'cyan';
}

function tag(value, extra) {
  return '<span class="tag ' + (extra || '') + '">' + esc(value) + '</span>';
}

function statusCell(label, value, cls) {
  return '<div class="product-status"><small>' + esc(label) + '</small><strong class="' + (cls || '') + '">' + esc(value) + '</strong></div>';
}

function hero(meta, admin) {
  const controls = meta.controls || '';
  return '<section class="product-hero" data-icon="' + esc(meta.icon) + '">' +
    '<div class="product-kicker">' + esc(meta.code) + '</div>' +
    '<h1>' + esc(meta.title) + '</h1>' +
    '<p>' + esc(meta.description) + '</p>' +
    '<div class="product-hero-actions">' + controls + '<a class="button" href="' + routePath() + '?legacy=1">LEGACY ROLLBACK</a></div>' +
  '</section>' +
  '<div class="product-status-strip">' +
    statusCell('CURRENT MODE', admin.mode || 'IDLE', 'cyan') +
    statusCell('AUTOPILOT', admin.autopilotEnabled ? 'OPERATIONAL' : 'PAUSED', admin.autopilotEnabled ? 'cyan' : 'yellow') +
    statusCell('OPERATOR GATES', Number(admin.businessLoop.ordersReadyForReview || 0) + Number(admin.leadEngine.awaitingSend || 0), 'mag') +
    statusCell('PERSISTED EVENTS', fmt(admin.counts.events), '') +
  '</div>';
}

function legacyBridge(html, title, note) {
  cachedLegacyHtml = html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('.wrap') || doc.body;
  root.querySelectorAll('script,style').forEach((node) => node.remove());
  const nav = root.querySelector('.nav');
  if (nav) nav.remove();
  const firstTitle = root.querySelector('h1');
  if (firstTitle) firstTitle.remove();
  const firstSub = root.querySelector('.sub');
  if (firstSub) firstSub.remove();
  root.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('/') && !href.includes('legacy=1')) link.setAttribute('href', href);
  });
  return '<section class="product-section route-anchor" id="operational-evidence">' +
    '<div class="product-section-head"><div><h2>' + esc(title) + '</h2><p>' + esc(note || 'Live controls and evidence from the authoritative factory runtime.') + '</p></div>' +
    '<a class="button" href="' + routePath() + '?legacy=1">OPEN RAW VIEW</a></div>' +
    '<div class="legacy-bridge"><div class="bridge-note">The visual shell is new. Every form below still calls the original audited backend action.</div>' + root.innerHTML + '</div>' +
  '</section>';
}

function runRow(run) {
  return '<tr><td>' + esc(run.id || '—') + '</td><td>' + esc(run.mode || 'IDLE') + '</td><td>' + tag(run.status || 'unknown', statusClass(run.status)) + '</td><td>' + esc(run.trigger || '—') + '</td><td>' + shortDate(run.finishedAt || run.startedAt) + '</td></tr>';
}

function factoryRunView(admin, production, runs, legacy) {
  setShellMode(admin.mode);
  const latest = (runs.workRuns || [])[0] || admin.latestWorkRun;
  const steps = latest && latest.steps ? latest.steps : [];
  const gateCount = Number(admin.businessLoop.ordersReadyForReview || 0) + Number(admin.leadEngine.awaitingSend || 0) + (admin.integrity || []).filter((item) => item.status !== 'healthy').length;
  const controls = '<button class="button primary" data-op="cycle">START CONTROLLED CYCLE</button><button class="button" data-op="autopilot-off">EMERGENCY PAUSE</button>';
  const meta = { icon: 'rocket_launch', code: 'MISSION_CONTROL / FACTORY_RUN', title: 'Start the operating day.', description: 'One bounded production cycle. Client work first, rework second, training only when the line is clear. Every output stops at the operator gate.', controls };
  const stepHtml = steps.length ? steps.map((step, index) => '<div class="step-card"><div class="step-index">' + String(index + 1).padStart(2, '0') + '</div><div class="step-agent"><strong>' + esc(step.agentId || 'AGENT') + '</strong><small>' + esc(step.agentName || step.jobType || 'Production node') + '</small></div><div class="step-copy"><strong>' + esc(step.inputSummary || step.jobType || 'No input summary') + '</strong><small>' + esc(step.outputSummary || 'No output produced in this step.') + '</small></div>' + tag(step.status || 'unknown', statusClass(step.status)) + '</div>').join('') : '<div class="empty-product">NO WORK RUN STEPS YET — START A CONTROLLED CYCLE.</div>';
  const previous = (runs.workRuns || []).slice(0, 5);
  return '<div class="product-page">' + hero(meta, admin) +
    '<div class="product-grid"><section class="mission-card primary product-col-8"><div class="stamp">CURRENT MISSION BRIEF</div><h3>' + esc(admin.nextOperatorAction.title || 'Factory standing by') + '</h3><p>' + esc(admin.nextOperatorAction.detail || admin.standingStill || 'The system is waiting for an explicit operator action.') + '</p><div class="source-chain"><span>MODE ' + esc(admin.mode) + '</span><i>→</i><span>TRAINING ' + esc(admin.businessLoop.trainingToday) + '</span><i>→</i><span>' + fmt(admin.businessLoop.activeOrders) + ' ACTIVE ORDERS</span></div><div class="button-row"><button class="button primary" data-op="cycle">RUN NOW</button><a class="button" href="#operational-evidence">OPEN CONTROLS</a></div></section>' +
    '<aside class="mission-card gate product-col-4"><div class="stamp">OPERATOR GATE</div><div class="operator-gate-number">' + gateCount + '</div><h3>decisions waiting</h3><p>No external action leaves the system without the human operator.</p><div class="button-row"><a class="button mag" href="/orders">REVIEW ORDERS</a><a class="button" href="/lead-engine">REVIEW LEADS</a></div></aside></div>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Agent execution sequence</h2><p>Intake → Research → Strategy → Production → QA → Packaging → Operator Review</p></div>' + (latest ? tag(latest.status || 'unknown', statusClass(latest.status)) : tag('NO RUN', '')) + '</div><div class="product-section-body step-timeline">' + stepHtml + '</div></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Previous work runs</h2><p>Latest five persisted cycles.</p></div><a class="button" href="/events">OPEN FULL LOG</a></div><div class="product-section-body"><table class="run-table"><thead><tr><th>ID</th><th>Mode</th><th>Status</th><th>Trigger</th><th>Finished</th></tr></thead><tbody>' + (previous.length ? previous.map(runRow).join('') : '<tr><td colspan="5">No persisted work runs.</td></tr>') + '</tbody></table></div></section>' +
    legacyBridge(legacy, 'Mission controls and production evidence', 'Create orders, run training, inspect outputs and operate the existing safety gates.') + '</div>';
}

function stationCard(station, index) {
  const icons = ['input_circle','search','strategy','edit_note','local_shipping','verified','inventory_2','approval'];
  const last = station.lastTask || {};
  return '<article class="station-card"><span class="material-symbols-outlined station-icon">' + icons[index % icons.length] + '</span><div class="stamp">STATION_' + String(index + 1).padStart(2, '0') + '</div><h3>' + esc(station.name || station.id || 'Station') + '</h3><p>' + esc(station.agentId || 'UNASSIGNED') + ' · ' + esc(last.title || 'No last output') + '</p><div class="station-meta"><span>' + esc(station.status || 'idle') + '</span><b>' + fmt(station.taskCount) + ' TASKS</b></div></article>';
}

function taskCard(task) {
  const title = task.title || task.taskTitle || task.id || 'Production task';
  const status = task.status || task.stationStatus || 'queued';
  const source = task.source || task.sourceType || task.kind || 'factory';
  return '<article class="task-card"><div class="task-meta"><span>' + esc(source) + '</span><span>' + esc(task.id || '') + '</span></div><h4>' + esc(title) + '</h4><p>' + esc(task.nextOperatorAction || task.lastOutput || task.outputSummary || 'Awaiting the next production transition.') + '</p><div class="task-meta"><span>' + esc(task.clientName || task.client || task.department || '') + '</span><span>' + esc(status) + '</span></div></article>';
}

function lane(title, key, tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  return '<section class="swimlane" data-lane="' + key + '"><div class="swimlane-head"><span>' + esc(title) + '</span><b>' + list.length + ' TASKS</b></div><div class="task-grid">' + (list.length ? list.map(taskCard).join('') : '<div class="empty-product">NO TASKS IN THIS LANE</div>') + '</div></section>';
}

function productionLineView(admin, production, legacy) {
  setShellMode(admin.mode);
  const controls = '<button class="button primary" data-op="cycle">RUN PRODUCTION CYCLE</button><a class="button" href="#operational-evidence">CREATE DEMO RUN</a>';
  const meta = { icon: 'conveyor_belt', code: 'LOGISTICS_FLOOR / PRODUCTION_LINE', title: 'See where every task lives.', description: 'Eight physical stations, four work lanes and one human approval boundary. Bottlenecks are visible instead of hidden in logs.', controls };
  const bottleneck = production.bottleneck || production.nextOperatorAction || admin.nextOperatorAction.detail;
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Eight-station factory floor</h2><p>Each station shows its assigned agent, status, task count and last output.</p></div>' + tag(production.autopilotEnabled ? 'AUTOPILOT ON' : 'AUTOPILOT PAUSED', production.autopilotEnabled ? 'cyan' : 'yellow') + '</div><div class="product-section-body station-grid">' + (production.stations || []).map(stationCard).join('') + '</div></section>' +
    '<section class="mission-card warn"><div class="stamp">CURRENT BOTTLENECK</div><h3>' + esc(bottleneck || 'No blocking bottleneck detected') + '</h3><p>Operator-review and blocked tasks are the only acceptable reasons for the line to stop.</p></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Production swimlanes</h2><p>Filter the floor without losing the full evidence chain.</p></div><div class="filter-row"><button class="button active" data-op="lane-filter" data-filter="all">ALL</button><button class="button" data-op="lane-filter" data-filter="client">CLIENT</button><button class="button" data-op="lane-filter" data-filter="training">TRAINING</button><button class="button" data-op="lane-filter" data-filter="rework">REWORK</button><button class="button" data-op="lane-filter" data-filter="delivery">DELIVERY</button></div></div><div class="product-section-body swimlanes">' +
      lane('Client Work', 'client', production.clientLine) + lane('Training', 'training', production.trainingLine) + lane('Rework', 'rework', production.reworkLine) + lane('Delivery Packs', 'delivery', production.deliveryPackLine) +
    '</div></section>' + legacyBridge(legacy, 'Production controls and task drill-down', 'Use the real demo-order, cycle and review controls below. No decorative actions.') + '</div>';
}

function orderColumn(title, key, orders) {
  const list = orders.filter((order) => key.includes(order.status));
  return '<section class="order-column"><div class="order-column-head"><span>' + esc(title) + '</span><span>' + list.length + '</span></div><div class="order-list">' + (list.length ? list.map((order) => '<article class="order-card"><div class="task-meta"><span>' + esc(order.department || 'delivery') + '</span><span>REV ' + fmt(order.revisionCount) + '</span></div><h4>' + esc(order.clientName || order.id) + '</h4><p>' + esc(order.taskType || 'Client deliverable') + '</p><p class="stamp">' + esc(order.id) + '</p><a class="button block" href="#operational-evidence">OPEN DECISION GATE</a></article>').join('') : '<div class="empty-product">EMPTY</div>') + '</div></section>';
}

function ordersView(admin, legacy) {
  setShellMode(admin.mode);
  const orders = admin.orders || [];
  const controls = '<a class="button primary" href="#operational-evidence">ADD CLIENT ORDER</a><button class="button" data-op="cycle">RUN QUEUE</button>';
  const meta = { icon: 'receipt_long', code: 'CLIENT_ORDERS / APPROVAL_GATES', title: 'Real work enters here.', description: 'Receive client work, inspect the generated deliverable and make one explicit human decision. The system never sends automatically.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Order pipeline</h2><p>NEW → IN PRODUCTION → READY FOR REVIEW → APPROVED / REJECTED / CLOSED</p></div>' + tag(orders.length + ' TOTAL', 'cyan') + '</div><div class="product-section-body order-board">' +
    orderColumn('NEW / PRODUCTION', ['new','in_production'], orders) + orderColumn('READY FOR REVIEW', ['ready_for_review'], orders) + orderColumn('DECIDED / CLOSED', ['approved','rejected','closed'], orders) +
    '</div></section>' +
    '<section class="mission-card gate"><div class="stamp">HARD SAFETY RULE</div><h3>Operator delivery only.</h3><p>Approve to warehouse, create a delivery pack, request rework or reject. Feedback is mandatory for rework and rejection.</p></section>' +
    legacyBridge(legacy, 'Order intake, deliverable previews and real decision forms', 'The forms below are the authoritative order and approval controls.') + '</div>';
}

function packCard(pack) {
  return '<article class="pack-card"><div class="task-meta"><span>' + esc(pack.status || 'draft') + '</span><span>' + shortTime(pack.updatedAt || pack.createdAt) + '</span></div><h3>' + esc(pack.title || pack.clientName || pack.id || 'Delivery pack') + '</h3><p>' + esc(pack.executiveSummary || pack.summary || 'Client-ready package assembled from an approved output.') + '</p><div class="source-chain"><span>ORDER</span><i>→</i><span>OUTPUT</span><i>→</i><span>PACK</span><i>→</i><span>CASE</span></div><a class="button block" href="#operational-evidence">OPEN PACK GATE</a></article>';
}

function deliveryView(admin, delivery, legacy) {
  setShellMode(admin.mode);
  const packs = delivery.packs || [];
  const controls = '<a class="button primary" href="#operational-evidence">CREATE / APPROVE PACK</a><a class="button" href="/warehouse">OPEN WAREHOUSE</a>';
  const meta = { icon: 'local_shipping', code: 'DELIVERY_PACK_CENTER', title: 'Package approved work.', description: 'Create a client-ready artifact without sending it automatically. The operator delivers through an external channel.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="mission-card primary"><div class="stamp">DELIVERY BOUNDARY</div><h3>OPERATOR DELIVERS THROUGH EXTERNAL CHANNEL</h3><p>Ratio Essendi prepares, approves, warehouses and records. It does not impersonate the operator or silently send client work.</p></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Delivery packs</h2><p>Draft, approved and warehouse-ready artifacts.</p></div>' + tag(packs.length + ' PACKS', 'cyan') + '</div><div class="product-section-body pack-grid">' + (packs.length ? packs.map(packCard).join('') : '<div class="empty-product">NO DELIVERY PACKS YET</div>') + '</div></section>' +
    legacyBridge(legacy, 'Pack preview, revision history and approval controls', 'Create, approve, warehouse and export using the audited delivery actions below.') + '</div>';
}

function warehouseView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<a class="button primary" href="#operational-evidence">SEARCH ASSETS</a><a class="button" href="/delivery">OPEN DELIVERY CENTER</a>';
  const meta = { icon: 'database', code: 'WAREHOUSE / INSTITUTIONAL_MEMORY', title: 'Keep approved evidence reusable.', description: 'Approved outputs, delivery packs and closed case records live here. Reuse is allowed; silent evidence deletion is not.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Memory inventory</h2><p>Search-first access to approved work and proof chains.</p></div></div><div class="product-section-body evidence-grid">' +
    '<article class="evidence-card"><div class="stamp">APPROVED OUTPUTS</div><h3>' + fmt(admin.counts.warehouseAssets) + ' reusable assets</h3><p>Operator-approved deliverables stored for controlled reuse.</p></article>' +
    '<article class="evidence-card"><div class="stamp">DELIVERY PACKS</div><h3>' + fmt(admin.businessLoop.deliveryPacks.warehouseReady) + ' warehouse ready</h3><p>Client-ready packages with evidence timestamps.</p></article>' +
    '<article class="evidence-card"><div class="stamp">CASE RECORDS</div><h3>' + fmt(admin.businessLoop.caseRecords) + ' closed cases</h3><p>Source chains connecting order, output, pack and operator decision.</p></article>' +
    '</div></section>' + legacyBridge(legacy, 'Approved assets and complete evidence chains', 'Open, export, archive or reuse through the real warehouse view below.') + '</div>';
}

function eventsView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<button class="button primary" data-op="export-json">EXPORT JSON</button><button class="button" data-op="export-csv">EXPORT CSV</button>';
  const meta = { icon: 'terminal', code: 'AUDIT_LOG / EVIDENCE_TIMELINE', title: 'Prove what happened.', description: 'Immutable chronological evidence: timestamp, actor, event type, target and summary. Operator actions remain visually distinct.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="mission-card primary"><div class="stamp">PERSISTENCE STATUS</div><h3>' + fmt(admin.counts.events) + ' recorded events</h3><p>System timestamp: ' + shortDate(admin.generatedAt) + '. Export reads the visible authoritative event table.</p><div class="button-row export-row"><button class="button primary" data-op="export-json">EXPORT JSON</button><button class="button" data-op="export-csv">EXPORT CSV</button></div></section>' +
    legacyBridge(legacy, 'Immutable event timeline', 'No edit controls are exposed. This surface is evidence, not narration.') + '</div>';
}

function dailyReviewView(admin, legacy) {
  setShellMode(admin.mode);
  const current = Number(String(admin.businessLoop.trainingToday || '0/5').split('/')[0] || 0);
  const departments = ['Marketing','Sales','Delivery','Research','QA'];
  const controls = '<button class="button primary" data-op="cycle">RUN TRAINING CYCLE</button><a class="button" href="#operational-evidence">REVIEW OUTPUTS</a>';
  const meta = { icon: 'fact_check', code: 'DAILY_PRODUCTION_REVIEW', title: 'Train only when client work is clear.', description: 'Five bounded internal outputs. Every item is marked TRAINING / NOT CLIENT WORK and requires an operator decision.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Daily progress</h2><p>' + current + '/5 outputs created today.</p></div>' + tag(current + '/5', current >= 5 ? 'cyan' : 'yellow') + '</div><div class="product-section-body"><div class="progress-track"><i style="width:' + Math.min(100, current * 20) + '%"></i></div><div class="daily-departments" style="margin-top:16px">' + departments.map((department, index) => '<article class="department-card"><strong>' + department + '</strong><small>' + (index < current ? 'OUTPUT READY FOR REVIEW' : 'WAITING FOR CYCLE') + '</small></article>').join('') + '</div></div></section>' +
    '<section class="mission-card warn"><div class="stamp">TRAINING / NOT CLIENT WORK</div><h3>Accept, request rework, reject or move to warehouse.</h3><p>Training assets must never be confused with active client deliverables.</p></section>' + legacyBridge(legacy, 'Training outputs and operator decisions', 'Review each department output with the original accept, rework, reject and warehouse actions.') + '</div>';
}

function trashView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<a class="button primary" href="#operational-evidence">OPEN FAILED WORK</a><a class="button" href="/events">OPEN AUDIT LOG</a>';
  const meta = { icon: 'delete_sweep', code: 'REJECTED / FAILED_WORK', title: 'Nothing disappears silently.', description: 'Rejected outputs, failed runs and quarantined incidents remain visible with reason, actor, timestamp and source.', controls };
  const integrityIncidents = (admin.integrity || []).filter((entry) => entry.status !== 'healthy').length;
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section danger-zone"><div class="product-section-head"><div><h2>Failure evidence summary</h2><p>Retry only as a new controlled run. Never restore or resend silently.</p></div></div><div class="product-section-body evidence-grid">' +
    '<article class="evidence-card"><div class="stamp">TRASH ITEMS</div><h3>' + fmt(admin.counts.trash) + ' rejected assets</h3><p>Rejected offers and outputs with retained reasons.</p></article>' +
    '<article class="evidence-card"><div class="stamp">FAILED RUNS</div><h3>' + fmt((admin.workRunsSummary || []).filter((run) => run.status === 'failed').length) + ' recent failures</h3><p>Work-run evidence remains in the immutable event stream.</p></article>' +
    '<article class="evidence-card"><div class="stamp">INTEGRITY INCIDENTS</div><h3>' + integrityIncidents + ' active incidents</h3><p>Quarantine and reset decisions remain operator-controlled.</p></article>' +
    '</div></section>' + legacyBridge(legacy, 'Rejected, failed and quarantined work', 'Open evidence, archive or retry through the existing controlled actions below.') + '</div>';
}

function productMeta() {
  return {
    'factory-run': { needs: ['admin','production','runs','legacy'] },
    'production-line': { needs: ['admin','production','legacy'] },
    'orders': { needs: ['admin','legacy'] },
    'delivery': { needs: ['admin','delivery','legacy'] },
    'warehouse': { needs: ['admin','legacy'] },
    'events': { needs: ['admin','legacy'] },
    'daily-review': { needs: ['admin','legacy'] },
    'trash': { needs: ['admin','legacy'] },
  }[screen];
}

function renderScreen(data) {
  if (screen === 'factory-run') return factoryRunView(data.admin, data.production, data.runs, data.legacy);
  if (screen === 'production-line') return productionLineView(data.admin, data.production, data.legacy);
  if (screen === 'orders') return ordersView(data.admin, data.legacy);
  if (screen === 'delivery') return deliveryView(data.admin, data.delivery, data.legacy);
  if (screen === 'warehouse') return warehouseView(data.admin, data.legacy);
  if (screen === 'events') return eventsView(data.admin, data.legacy);
  if (screen === 'daily-review') return dailyReviewView(data.admin, data.legacy);
  if (screen === 'trash') return trashView(data.admin, data.legacy);
  return '<div class="terminal"><span class="mag">UNKNOWN_PRODUCT_SCREEN:</span> ' + esc(screen) + '</div>';
}

function tableRows() {
  const table = app.querySelector('.legacy-bridge table');
  if (!table) return [];
  const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent.trim());
  return Array.from(table.querySelectorAll('tbody tr')).map((row) => {
    const cells = Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent.trim());
    const item = {};
    cells.forEach((value, index) => { item[headers[index] || 'column_' + index] = value; });
    return item;
  });
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportEvents(format) {
  const rows = tableRows();
  if (!rows.length) return notify('NO EVENT TABLE TO EXPORT', true);
  if (format === 'json') {
    downloadText('ratio-essendi-events.json', JSON.stringify(rows, null, 2), 'application/json');
    return notify('EVENT JSON EXPORTED');
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => '"' + String(row[header] || '').replaceAll('"', '""') + '"').join(','))].join('\n');
  downloadText('ratio-essendi-events.csv', csv, 'text/csv');
  notify('EVENT CSV EXPORTED');
}

async function boot() {
  app.innerHTML = '<div class="screen-loading">SYNCING LIVE FACTORY STATE...</div>';
  try {
    const meta = productMeta();
    if (!meta) throw new Error('Unknown UI route: ' + screen);
    const data = {};
    const jobs = [];
    if (meta.needs.includes('admin')) jobs.push(fetchJson('/api/admin/state').then((value) => { data.admin = value; }));
    if (meta.needs.includes('production')) jobs.push(fetchJson('/api/production-line').then((value) => { data.production = value; }));
    if (meta.needs.includes('runs')) jobs.push(fetchJson('/api/work-runs').then((value) => { data.runs = value; }));
    if (meta.needs.includes('delivery')) jobs.push(fetchJson('/api/delivery-packs').then((value) => { data.delivery = value; }));
    if (meta.needs.includes('legacy')) jobs.push(fetchText(routePath() + '?legacy=1').then((value) => { data.legacy = value; }));
    await Promise.all(jobs);
    app.innerHTML = renderScreen(data);
  } catch (error) {
    app.innerHTML = '<div class="terminal"><span class="mag">UI_SYNC_ERROR:</span> ' + esc(error.message) + '<br><br><a class="button" href="' + routePath() + '?legacy=1">OPEN LEGACY UI</a></div>';
  }
}

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-op]');
  if (!control) return;
  const op = control.dataset.op;
  try {
    if (op === 'cycle') {
      control.disabled = true;
      await postForm('/api/daily', { action: 'run', returnTo: routePath() });
      notify('CONTROLLED CYCLE COMPLETED');
      return boot();
    }
    if (op === 'autopilot-on') {
      await postForm('/api/autopilot', { action: 'on', returnTo: routePath() });
      notify('AUTOPILOT OPERATIONAL');
      return boot();
    }
    if (op === 'autopilot-off') {
      await postForm('/api/autopilot', { action: 'off', returnTo: routePath() });
      notify('AUTOPILOT PAUSED');
      return boot();
    }
    if (op === 'lane-filter') {
      document.querySelectorAll('[data-op="lane-filter"]').forEach((button) => button.classList.remove('active'));
      control.classList.add('active');
      const filter = control.dataset.filter;
      document.querySelectorAll('[data-lane]').forEach((laneNode) => laneNode.classList.toggle('is-hidden', filter !== 'all' && laneNode.dataset.lane !== filter));
      return;
    }
    if (op === 'export-json') return exportEvents('json');
    if (op === 'export-csv') return exportEvents('csv');
  } catch (error) {
    control.disabled = false;
    notify(error.message, true);
  }
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('#app form');
  if (!form) return;
  const method = String(form.getAttribute('method') || 'GET').toUpperCase();
  const action = form.getAttribute('action') || routePath();
  if (method !== 'POST' || !action.startsWith('/api/')) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submitter = event.submitter;
  if (submitter) submitter.disabled = true;
  const params = new URLSearchParams();
  new FormData(form).forEach((value, key) => params.append(key, String(value)));
  try {
    const response = await fetch(action, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' }, body: params });
    if (!response.ok) throw new Error(await response.text());
    notify('OPERATOR ACTION RECORDED');
    await boot();
  } catch (error) {
    if (submitter) submitter.disabled = false;
    notify(error.message, true);
  }
});

modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
boot();
`
