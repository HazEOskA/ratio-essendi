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
const fmt = (value) => new Intl.NumberFormat('pl-PL').format(Number(value || 0));
const shortTime = (value) => {
  try { return new Date(value).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '--:--:--'; }
};
const dateStamp = () => new Date().toISOString().slice(11, 19);

const MODE_LABELS = {
  CLIENT_MODE: 'TRYB KLIENTA',
  REWORK_MODE: 'TRYB POPRAWEK',
  NO_CLIENT_TRAINING_MODE: 'TRYB TRENINGOWY',
  IDLE: 'BEZCZYNNY',
};
const STATUS_LABELS = {
  healthy: 'zdrowy', failed: 'nieudany', quarantined: 'kwarantanna', watch: 'obserwacja',
  active: 'aktywny', inactive: 'nieaktywny', pending: 'oczekujące', waiting_review: 'czeka na przegląd',
  ready_for_review: 'gotowe do przeglądu', ready_for_operator: 'czeka na operatora', completed: 'zakończone',
  rejected: 'odrzucone', approved: 'zatwierdzone', blocked: 'zablokowane', queued: 'w kolejce',
  draft: 'szkic', draft_ready: 'szkic gotowy', warm: 'ciepły', hot: 'gorący', cold: 'zimny',
  qualified: 'zakwalifikowany', won: 'wygrany', lost: 'przegrany', warning: 'ostrzeżenie',
  degraded: 'pogorszony', under_review: 'w przeglądzie', succession_required: 'wymaga następcy',
};
const plMode = (value) => MODE_LABELS[String(value)] || String(value || 'BEZCZYNNY').replaceAll('_', ' ');
const plStatus = (value) => STATUS_LABELS[String(value)] || String(value || 'nieznany').replaceAll('_', ' ');

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
  if (slot) slot.textContent = plMode(mode);
}

function mobileStats(admin) {
  const cpu = Math.min(99, 12 + Number(admin.counts.workRuns || 0));
  const memory = (2.4 + Number(admin.counts.events || 0) / 100).toFixed(1);
  const up = Math.max(1, Number(admin.counts.workRuns || 0));
  return '<div class="mobile-metrics" style="display:none">' +
    '<span>CPU: ' + cpu + '%</span>' +
    '<span>PAMIĘĆ: ' + memory + ' GB</span>' +
    '<span>PRZEBIEGI: ' + up + '</span>' +
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
    { icon: 'rocket_launch', code: 'SILNIK_LEADÓW', title: 'Silnik Leadów', description: 'Wątki leadów, kwalifikacja i szkice odpowiedzi kontrolowane przez operatora.', metric: fmt(admin.leadEngine.active) + ' aktywnych', status: 'Operacyjny', href: '/lead-engine', action: 'Otwórz konsolę leadów' },
    { icon: 'factory', code: 'PRZEPŁYW_PRODUKCJI', title: 'Linia Produkcyjna', description: 'Praca klienta, trening, poprawki i pakowanie wyników.', metric: fmt(admin.businessLoop.activeOrders) + ' aktywnych', status: 'Operacyjna', href: '/production-line', action: 'Otwórz fabrykę' },
    { icon: 'receipt_long', code: 'ZLECENIA', title: 'Zlecenia Klientów', description: 'Przyjęcie zleceń i bramki decyzyjne operatora.', metric: fmt(admin.businessLoop.ordersReadyForReview) + ' krytycznych', status: attentionCount ? 'Wymaga uwagi' : 'Czysto', attention: attentionCount > 0, href: '/orders', action: 'Otwórz zlecenia' },
    { icon: 'local_shipping', code: 'DOSTAWY', title: 'Centrum Dostaw', description: 'Pakowanie zatwierdzonych wyników i przygotowanie przekazania klientowi.', metric: fmt(admin.businessLoop.deliveryPacks.warehouseReady) + ' gotowych', status: 'Operacyjne', href: '/delivery', action: 'Otwórz dostawy' },
    { icon: 'smart_toy', code: 'OPERACJE_AGENTÓW', title: 'Operacje Agentów', description: 'Stan stacji produkcyjnych i rozkład zadań.', metric: fmt(stations.length) + ' węzłów', status: 'Stabilne', href: '/production-line', action: 'Otwórz sieć agentów' },
    { icon: 'sensors', code: 'POKÓJ_SYGNAŁÓW', title: 'Pokój Sygnałów', description: 'Przyjęcie sygnału, kwalifikacja i dowody pozyskania oferty.', metric: fmt(admin.counts.events) + ' zdarzeń', status: 'Nasłuchuje', href: '/?legacy=1', action: 'Otwórz radio' },
    { icon: 'database', code: 'MAGAZYN_DANYCH', title: 'Magazyn', description: 'Zatwierdzone zasoby i pamięć realizacji.', metric: fmt(admin.counts.warehouseAssets) + ' zasobów', status: 'Zindeksowany', href: '/warehouse', action: 'Otwórz magazyn' },
    { icon: 'shield', code: 'BEZPIECZEŃSTWO', title: 'Integralność Systemu', description: 'Rejestry integralności agentów i granice bezpieczeństwa produkcji.', metric: unhealthy ? fmt(unhealthy) + ' alarmów' : '100% zdrowia', status: unhealthy ? 'Wymaga uwagi' : 'Bezpieczny', attention: unhealthy > 0, href: '/operator', action: 'Otwórz zabezpieczenia' },
  ];

  const eventRows = recentRuns.slice(0, 4).map((run, index) => {
    const isMag = run.status === 'failed' || index === 1;
    const icon = run.status === 'failed' ? 'priority_high' : index === 2 ? 'send' : 'check_circle';
    return '<div class="event' + (isMag ? ' mag' : '') + '">' +
      '<i class="dot"></i><time>' + shortTime(run.finishedAt || run.startedAt) + '</time>' +
      '<span>[' + esc(plMode(run.mode)) + '] ' + esc(run.nextOperatorAction || plStatus(run.status)) + '</span>' +
      '<span class="material-symbols-outlined event-icon">' + icon + '</span>' +
    '</div>';
  }).join('');

  return '<section class="hero">' +
    '<div class="eyebrow">STAN_SYSTEMU_ALFA</div>' +
    '<h1>Twoja firma działa.</h1>' +
    '<p>Agenci przetwarzają <span class="hero-copy-strong">' + fmt(activeWorkstreams) + ' aktywnych strumieni pracy</span> we wszystkich podłączonych modułach. Wyliczona integralność operacyjna wynosi <span class="hero-copy-strong">' + efficiency + '%</span>.</p>' +
    '<div class="system-summary"><span><i></i>TRYB ' + esc(plMode(admin.mode)) + '</span><span><i></i>AUTOPILOT ' + (admin.autopilotEnabled ? 'WŁĄCZONY' : 'WSTRZYMANY') + '</span><span><i></i>TRENING ' + esc(admin.businessLoop.trainingToday) + '</span></div>' +
    mobileStats(admin) +
    '<div class="hero-actions"><a class="button primary" href="/factory-run">KONTYNUUJ OPERACJĘ <span class="material-symbols-outlined">arrow_forward</span></a><a class="button" href="/events">ZOBACZ LOGI NA ŻYWO</a></div>' +
  '</section>' +
  '<div class="section-head"><div><div class="stamp">MODUŁY_RDZENIA_08</div><h2>Infrastruktura systemu</h2></div><div class="tag system-green"><span class="dot"></span>' + (unhealthy ? 'WYMAGANA UWAGA' : 'WSZYSTKIE SYSTEMY ZIELONE') + '</div></div>' +
  '<section class="cards">' + modules.map(moduleCard).join('') + '</section>' +
  '<section class="split"><div><div class="section-head" style="margin-top:0"><h2 style="font-size:23px">Ostatnie zdarzenia fabryki</h2><a class="stamp" href="/events" style="color:var(--cyan)">EKSPORTUJ LOGI</a></div><div class="panel events">' + (eventRows || '<div class="empty-state">BRAK ZDARZEŃ PRZEBIEGU PRACY</div>') + '</div></div>' +
  '<div><h2 style="font:700 23px Plus Jakarta Sans">Wymagana uwaga</h2>' +
    '<div class="attention urgent"><div class="attention-meta"><span>DECYZJA OPERATORA</span><span>' + fmt(attentionCount) + ' OTWARTYCH</span></div><p>' + esc(admin.nextOperatorAction.detail) + '</p><div class="attention-actions"><a class="button mag" href="/admin?legacy=1">OTWÓRZ BRAMKĘ</a><a class="button" href="/orders">PRZEJRZYJ KOLEJKĘ</a></div></div>' +
    '<div class="attention"><div class="attention-meta"><span>STEROWANIE SYSTEMEM</span><span>' + (admin.autopilotEnabled ? 'AKTYWNE' : 'WSTRZYMANE') + '</span></div><p>Autopilot jest <strong>' + (admin.autopilotEnabled ? 'włączony' : 'wstrzymany') + '</strong>. Istniejące bramki przeglądu pozostają obowiązkowe.</p><div class="attention-actions"><button class="button primary" data-action="start">URUCHOM</button><button class="button" data-action="pause">WSTRZYMAJ</button></div></div>' +
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
  return '<div class="draft"><div class="id">ID-SZKICU: ' + esc(draft.id.slice(0, 8).toUpperCase()) + '</div>' +
    '<h4>Cel: ' + esc(thread.company || thread.leadName) + '</h4>' +
    '<p>“' + esc(draft.text.slice(0, 145)) + (draft.text.length > 145 ? '…' : '') + '”</p>' +
    '<div class="draft-confidence"><span>✣ PEWNOŚĆ AI: ' + confidence + '%</span><button data-action="review" data-id="' + esc(thread.id) + '">PRZEJRZYJ</button></div>' +
    '<div class="stamp" style="margin-top:8px">TRYB: ' + esc(draft.draftMode || drafterMode) + '</div></div>';
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
    const engagement = thread.status === 'hot' ? 'GORĄCA_ODPOWIEDŹ' : thread.status === 'qualified' ? 'ZAKWALIFIKOWANY' : thread.messages && thread.messages.length > 2 ? 'PRZEPŁYW_AUTOMATYCZNY' : 'BEZCZYNNY';
    return '<tr><td><span class="lead-name">' + esc(thread.id.slice(0, 8).toUpperCase()) + ' // ' + esc(thread.company || thread.leadName) + '</span><br><span class="stamp">ZNACZNIK_CZASU: ' + esc(thread.updatedAt.slice(0, 19).replace('T', '.')) + '</span></td>' +
      '<td><div class="strength"><div class="bar"><i style="width:' + strength + '%"></i></div>' + strength + '%</div></td>' +
      '<td><span class="tag">' + engagement + '</span></td>' +
      '<td><button class="button" data-action="review" data-id="' + esc(thread.id) + '">PRZEJRZYJ</button></td></tr>';
  }).join('');

  const consoleRows = threads.slice(0, 8).map((thread, index) => {
    const label = index % 3 === 0 ? 'SYGNAŁ_PRZYCHODZĄCY' : index % 3 === 1 ? 'SZKIC_WYGENEROWANY' : 'STATUS_WĄTKU';
    return '[' + shortTime(thread.updatedAt) + '] ' + label + ': ' + esc(thread.id.slice(0, 8)) + ' / ' + esc(plStatus(thread.status).toUpperCase());
  }).join('<br>');

  return '<div class="metrics-row"><div class="metric-box with-rail"><div class="metric-rail">WYDAJNOŚĆ_X1</div><div class="stamp">WSKAŹNIK JAKOŚCI LEADÓW</div><strong class="cyan">' + quality + '%</strong><div class="bar" style="width:100%;margin-top:14px"><i style="width:' + quality + '%"></i></div></div>' +
    '<div class="metric-box with-rail"><div class="metric-rail">PRĘDKOŚĆ_X2</div><div class="stamp">PRĘDKOŚĆ POZYSKANIA</div><strong>' + speed + '</strong><span>/s</span><div class="metric-note">↗ RZECZYWISTY UDZIAŁ AKTYWNYCH WĄTKÓW</div></div>' +
    '<div class="metric-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:18px"><div><div class="stamp">ŁĄCZNA LICZBA SZKICÓW AI</div><strong>' + fmt(pending.length) + '</strong><p>Czekają na weryfikację operatora przed użyciem.</p></div><button class="button" data-action="review-all">PRZEJRZYJ WSZYSTKIE SZKICE</button></div></div></div>' +
    '<div class="lead-grid"><div><section class="panel"><div class="lead-toolbar"><div class="lead-toolbar-left"><span><i class="dot"></i>AKTYWNE OPERACJE (LEADY)</span></div><div class="lead-toolbar-right"><button class="filter-button ' + (leadHighValueOnly ? 'active' : '') + '" data-action="filter-high">FILTR: WYSOKA_WARTOŚĆ</button><span class="tag">RAZEM: ' + active.length + '</span></div></div>' +
      '<table class="table"><thead><tr><th>ID / PODMIOT</th><th>SIŁA SYGNAŁU</th><th>ZAANGAŻOWANIE</th><th>AKCJE</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4"><div class="empty-state">BRAK PASUJĄCYCH AKTYWNYCH LEADÓW</div></td></tr>') + '</tbody></table><div class="archive-row">WCZYTAJ ARCHIWUM SYSTEMU (+' + Math.max(0, threads.length - active.slice(0, 6).length) + ' WPISÓW)</div></section>' +
      '<div class="lower-grid"><div class="attention lead-task"><div class="task-meta"><span class="material-symbols-outlined" style="color:var(--cyan)">history</span><span class="tag">KONTROLA OPERATORA</span></div><h3>Ponowne zaangażowanie wielokanałowe</h3><p>Przechwyć nową wiadomość przychodzącą, pozwól LEA przygotować szkic i zdecyduj, co opuszcza system.</p><div class="button-row"><button class="button" data-action="new-lead">NOWY WĄTEK</button><button class="button primary" data-action="review-all">OTWÓRZ SZKICE</button></div></div>' +
      '<div class="attention lead-task"><div class="task-meta"><span class="material-symbols-outlined" style="color:var(--cyan)">forward_to_inbox</span><span class="tag">CZEKA_NA_PRZEGLĄD</span></div><h3>Ręczny kontakt wysokiego poziomu</h3><p>Komunikacja z decydentem pozostaje za bramką ludzkiego operatora.</p><div class="button-row" style="grid-template-columns:1fr"><a class="button" href="/lead-engine?legacy=1">OTWÓRZ TERMINAL KOMUNIKACJI</a></div></div></div></div>' +
      '<aside class="panel staging-panel" id="drafts"><div class="panel-head">STREFA SZKICÓW AI <span class="tag">' + pending.length + '</span></div><div class="drafts">' + (pending.map((thread) => draftCard(thread, leadState.drafterMode)).join('') || '<div class="empty-state">BRAK SZKICÓW OCZEKUJĄCYCH</div>') + '</div><div class="review-pipeline"><a class="button block" href="/lead-engine?legacy=1">PRZEJRZYJ POTOK</a></div></aside></div>' +
      '<div class="terminal console-feed">' + (consoleRows || '[--:--:--] SILNIK_LEADÓW: OCZEKIWANIE_NA_PIERWSZY_WĄTEK') + '</div>';
}

function mapSvg() {
  return '<svg class="map-svg" viewBox="0 0 900 460" preserveAspectRatio="xMidYMid slice" aria-label="Mapa sieci wdrożonych agentów">' +
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
    const levelKey = run.status === 'failed' ? 'CRITICAL' : index === 4 ? 'WARN' : index === visibleRuns.length - 1 ? 'SYSTEM' : 'INFO';
    const level = levelKey === 'CRITICAL' ? 'KRYTYCZNY' : levelKey === 'WARN' ? 'OSTRZEŻENIE' : levelKey === 'SYSTEM' ? 'SYSTEM' : 'INFORMACJA';
    const cls = levelKey === 'CRITICAL' ? 'log-critical' : levelKey === 'WARN' ? 'log-warn' : levelKey === 'SYSTEM' ? 'log-system' : 'log-info';
    return '<div><span>[' + shortTime(run.finishedAt || run.startedAt) + ']</span>&nbsp;&nbsp;&nbsp;<span class="' + cls + '">' + level + ':</span>&nbsp; ' + esc(plMode(run.mode)) + ' — ' + esc(run.nextOperatorAction || plStatus(run.status)) + '</div>';
  }).join('');

  const incidentCards = incidents.map((entry, index) => '<div class="incident alert"><div class="incident-head"><strong>' + esc(entry.agentId) + '_' + esc(plStatus(entry.status).toUpperCase()) + '</strong><time>' + (index + 1) + ' min temu</time></div><p>Długość nosa: ' + entry.noseLength + ' · naruszenia: ' + entry.breaches + '<br>' + esc(entry.lastSignal || 'Przekroczono próg integralności.') + '</p></div>').join('');
  const uptime = Math.max(90, 100 - incidents.length * 1.7).toFixed(1);
  const jitter = Math.max(0.4, Math.min(9.9, Number(admin.counts.events || 0) / 100)).toFixed(1);

  return '<div class="cockpit"><section class="panel health status-log"><div class="panel-head"><span>⌘ DZIENNIK_ZDROWIA_SYSTEMU</span><span><span class="tag" style="color:var(--cyan)">PRZEKAZ_NA_ŻYWO</span>&nbsp;&nbsp;<span class="stamp">BUFOR: ' + (2.4 + Number(admin.counts.events || 0) / 100).toFixed(1) + ' GB</span></span></div><div class="terminal" style="border:0;min-height:370px">' + (logRows || '<div class="log-system">[' + dateStamp() + '] SYSTEM: Oczekiwanie na następny cykl...</div>') + '</div></section>' +
    '<aside class="panel"><div class="panel-head" style="color:var(--mag)">✱ INCYDENTY_INTEGRALNOŚCI <span>' + incidents.length + ' AKTYWNYCH</span></div><div class="incidents">' + (incidentCards || '<div class="incident"><div class="incident-head"><strong style="color:var(--cyan)">WSZYSTKO_CZYSTE</strong><time>TERAZ</time></div><p>Brak incydentów integralności. Wszyscy monitorowani agenci produkcyjni są zdrowi.</p></div>') + '</div></aside></div>' +
    '<div class="lower-grid"><section class="panel"><div class="panel-head">◫ MAPA_WDROŻENIA_AGENTÓW <span><i class="dot"></i> AKTYWNY &nbsp; <i class="dot" style="background:var(--mag)"></i> ALARM</span></div><div class="deployment-map">' + mapSvg() + '<div class="map-label">WSPÓŁRZĘDNE: 52.09° N, 5.12° E<br><span style="color:var(--cyan)">REGION: EUROPEJSKA_SIEĆ_OPERATORA</span><br>GĘSTOŚĆ: ' + fmt(admin.counts.workRuns) + ' ZWERYFIKOWANYCH PRZEBIEGÓW</div><div class="map-controls"><button data-action="map-plus" aria-label="Powiększ">+</button><button data-action="map-minus" aria-label="Pomniejsz">−</button></div></div></section>' +
    '<div><section class="panel"><div class="panel-head">☷ USTAWIENIA_KONFIGURACJI</div><div class="settings"><div class="setting"><div class="setting-line"><span>POZIOM_AUTONOMII_AGENTÓW</span><span style="color:var(--cyan)">' + (admin.autopilotEnabled ? 'POZIOM_04' : 'WSTRZYMANY') + '</span></div><input class="setting-control" type="range" min="0" max="4" value="' + (admin.autopilotEnabled ? '4' : '0') + '" data-action="autonomy-range"></div><div class="setting"><div class="setting-line"><span>WAGA_PRIORYTETU_ODPOWIEDZI</span><span style="color:var(--cyan)">0.82</span></div><input class="setting-control" type="range" min="0" max="100" value="82" data-action="priority-range"></div><div class="toggle-row"><label class="toggle"><input type="checkbox" data-action="toggle-autopilot" ' + (admin.autopilotEnabled ? 'checked' : '') + '> BEZPIECZNY_AUTOPILOT</label><label class="toggle"><input type="checkbox" data-action="verbose-logs" ' + (verbose ? 'checked' : '') + '> SZCZEGÓŁOWE_LOGI</label><span class="toggle locked"><input type="checkbox" disabled> AUTONAPRAWA_ZABLOKOWANA</span></div></div></section>' +
    '<section class="panel" style="margin-top:24px"><div class="panel-head">▣ DIAGNOSTYKA_SYSTEMU</div><div class="settings"><div class="diag-bars"><i style="height:42%"></i><i style="height:66%"></i><i style="height:82%"></i><i style="height:96%"></i><i style="height:61%"></i><i style="height:48%"></i></div><div class="metrics-row" style="grid-template-columns:repeat(3,1fr);margin:0"><div class="tag" style="text-align:center"><b>' + uptime + '%</b><br>CZAS PRACY</div><div class="tag" style="text-align:center"><b>' + jitter + ' ms</b><br>WAHANIA</div><div class="tag" style="text-align:center"><b>' + fmt(admin.counts.events) + '</b><br>ZDARZENIA</div></div></div></section></div></div>' +
    '<div class="telemetry-strip"><div class="telemetry-group"><div class="telemetry-item"><small>WEJŚCIE_DANYCH</small><strong>' + (1 + Number(admin.counts.events || 0) / 1000).toFixed(1) + ' GB/s ▲</strong></div><div class="telemetry-item"><small>LICZBA_AGENTÓW</small><strong>' + fmt((admin.counts.workRuns || 0) + (admin.counts.dailyDigitals || 0)) + '</strong></div><div class="telemetry-item"><small>SZYFROWANIE</small><strong>AES-256-GCM</strong></div></div><div class="telemetry-stable"><span>ZNACZNIK_CZASU_RDZENIA: ' + dateStamp() + '</span><i></i><span>STABILNE_POŁĄCZENIE</span></div></div>';
}

function leadForm() {
  openModal('<h3>UTWÓRZ WĄTEK LEADA</h3><p class="stamp">Ratio Essendi zapisuje wątek. LEA tworzy szkic. Operator wysyła.</p><form class="form" id="lead-form"><input name="leadName" placeholder="Nazwa leada" required><input name="company" placeholder="Firma"><input name="source" placeholder="Źródło"><textarea name="firstMessage" placeholder="Pierwsza wiadomość przychodząca (opcjonalnie)"></textarea><div class="form-actions"><button type="button" class="button" data-action="close">ANULUJ</button><button class="button primary">UTWÓRZ WĄTEK</button></div></form>');
  document.getElementById('lead-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await postForm('/api/lead-engine', { action: 'create', ...data });
      closeModal();
      notify('WĄTEK LEADA UTWORZONY');
      await boot();
    } catch (error) { notify(error.message, true); }
  });
}

async function reviewLead(id) {
  const leadState = cachedLeadState || await fetchJson('/api/lead-engine');
  const thread = leadState.threads.find((entry) => entry.id === id);
  if (!thread) return notify('NIE ZNALEZIONO WĄTKU', true);
  const draft = [...(thread.messages || [])].reverse().find((message) => message.author === 'lea_draft');
  openModal('<h3>' + esc(thread.leadName) + ' // ' + esc(thread.company || 'BRAK FIRMY') + '</h3><p class="stamp">WĄTEK ' + esc(thread.id) + ' · ' + esc(plStatus(thread.status)) + '</p><div class="terminal" style="white-space:pre-wrap">' + esc(draft ? draft.text : 'Brak oczekującego szkicu. Dodaj wiadomość przychodzącą albo poproś o szkic oferty.') + '</div><form class="form" id="review-form" style="margin-top:16px"><textarea name="text" placeholder="Wklej wiadomość przychodzącą albo treść, którą wysłałeś"></textarea><input name="feedback" placeholder="Uwagi do przeredagowania lub notatka statusu"><select name="status"><option value="">Zachowaj obecny status</option><option value="cold">zimny</option><option value="warm">ciepły</option><option value="hot">gorący</option><option value="qualified">zakwalifikowany</option><option value="won">wygrany</option><option value="lost">przegrany</option></select><div class="form-actions" style="flex-wrap:wrap"><button type="button" class="button" data-op="incoming">DODAJ PRZYCHODZĄCĄ</button><button type="button" class="button" data-op="redraft">PRZEREDAGUJ</button><button type="button" class="button" data-op="proposal">SZKIC OFERTY</button><button type="button" class="button mag" data-op="mark-sent">OZNACZ JAKO WYSŁANE PRZEZ OPERATORA</button><button type="button" class="button primary" data-op="status">USTAW STATUS</button></div></form>');
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
      notify('AKCJA LEADA ZAPISANA');
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
      notify('AUTOPILOT: OPERACYJNY');
      return boot();
    }
    if (action === 'pause') {
      await postForm('/api/autopilot', { action: 'off' });
      notify('AUTOPILOT: WSTRZYMANY');
      return boot();
    }
    if (action === 'notify') return notify('BRAK NIEPRZECZYTANYCH KRYTYCZNYCH ALARMÓW');
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
      notify(control.checked ? 'BEZPIECZNY AUTOPILOT WŁĄCZONY' : 'BEZPIECZNY AUTOPILOT WSTRZYMANY');
      return boot();
    }
    if (action === 'autonomy-range') {
      const enabled = Number(control.value) > 0;
      await postForm('/api/autopilot', { action: enabled ? 'on' : 'off' });
      notify(enabled ? 'POZIOM AUTONOMII ZASTOSOWANY' : 'AUTONOMIA WSTRZYMANA');
      return boot();
    }
    if (action === 'verbose-logs') {
      localStorage.setItem('ratio.verboseLogs', control.checked ? '1' : '0');
      notify(control.checked ? 'SZCZEGÓŁOWE LOGI WŁĄCZONE' : 'SZCZEGÓŁOWE LOGI WYŁĄCZONE');
      return boot();
    }
    if (action === 'priority-range') {
      localStorage.setItem('ratio.priorityWeight', String(control.value));
      return notify('LOKALNY PRIORYTET WIDOKU ZMIENIONY: ' + control.value + '%');
    }
  } catch (error) { notify(error.message, true); }
});

async function boot() {
  app.innerHTML = '<div class="terminal">SYNCHRONIZACJA STANU FABRYKI...</div>';
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
    app.innerHTML = '<div class="terminal"><span class="mag">BŁĄD_SYNCHRONIZACJI_UI:</span> ' + esc(error.message) + '<br><br><button class="button" data-action="legacy">OTWÓRZ WIDOK AWARYJNY</button></div>';
  }
}

boot();
`
