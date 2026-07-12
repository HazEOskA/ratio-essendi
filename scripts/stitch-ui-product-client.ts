export const STITCH_PRODUCT_CLIENT = String.raw`
const screen = document.body.dataset.screen;
const app = document.getElementById('app');
const modal = document.getElementById('modal');
const toast = document.getElementById('toast');

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const fmt = (value) => new Intl.NumberFormat('pl-PL').format(Number(value || 0));
const shortTime = (value) => {
  try { return new Date(value).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '--:--:--'; }
};
const shortDate = (value) => {
  try { return new Date(value).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return String(value || '—'); }
};
const routePath = () => location.pathname.length > 1 && location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;

const MODE_LABELS = {
  CLIENT_MODE: 'TRYB KLIENTA',
  REWORK_MODE: 'TRYB POPRAWEK',
  NO_CLIENT_TRAINING_MODE: 'TRYB TRENINGOWY',
  IDLE: 'BEZCZYNNY',
};
const STATUS_LABELS = {
  new: 'nowe', in_production: 'w produkcji', ready_for_review: 'gotowe do przeglądu',
  approved: 'zatwierdzone', rejected: 'odrzucone', closed: 'zamknięte', draft: 'szkic',
  warehouse_ready: 'gotowe do magazynu', warehoused: 'zmagazynowane', failed: 'nieudane',
  completed: 'zakończone', waiting_review: 'czeka na przegląd', ready_for_operator: 'czeka na operatora',
  blocked: 'zablokowane', queued: 'w kolejce', skipped: 'pominięte', idle: 'bezczynne',
  active: 'aktywne', healthy: 'zdrowy', watch: 'obserwacja', quarantined: 'kwarantanna',
  draft_ready: 'szkic gotowy', accepted: 'zaakceptowane', needs_rework: 'wymaga poprawek',
  pending: 'oczekujące', cold: 'zimny', warm: 'ciepły', hot: 'gorący', qualified: 'zakwalifikowany',
  won: 'wygrany', lost: 'przegrany', operational: 'operacyjny', paused: 'wstrzymany',
};
const STATION_LABELS = {
  intake: 'Przyjęcie', research: 'Badania', strategy: 'Strategia', content: 'Treść',
  delivery: 'Realizacja', qa: 'Kontrola jakości', packaging: 'Pakowanie', operator_review: 'Przegląd operatora',
};
const DEPARTMENT_LABELS = {
  marketing: 'Marketing', sales: 'Sprzedaż', delivery: 'Realizacja', research: 'Badania', qa: 'Kontrola jakości',
};
const SOURCE_LABELS = {
  client: 'klient', training: 'trening', rework: 'poprawka', delivery_pack: 'pakiet dostawy',
  factory: 'fabryka', order: 'zlecenie', output: 'wynik', pack: 'pakiet', case: 'sprawa',
};
const plMode = (value) => MODE_LABELS[String(value)] || String(value || 'BEZCZYNNY').replaceAll('_', ' ');
const plStatus = (value) => STATUS_LABELS[String(value)] || String(value || 'nieznany').replaceAll('_', ' ');
const plStation = (value) => STATION_LABELS[String(value)] || String(value || 'Stacja').replaceAll('_', ' ');
const plDepartment = (value) => DEPARTMENT_LABELS[String(value)] || String(value || '').replaceAll('_', ' ');
const plSource = (value) => SOURCE_LABELS[String(value)] || String(value || '').replaceAll('_', ' ');

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
  if (slot) slot.textContent = plMode(mode);
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
    '<div class="product-hero-actions">' + controls + '<a class="button" href="' + routePath() + '?legacy=1">WIDOK AWARYJNY</a></div>' +
  '</section>' +
  '<div class="product-status-strip">' +
    statusCell('BIEŻĄCY TRYB', plMode(admin.mode), 'cyan') +
    statusCell('AUTOPILOT', admin.autopilotEnabled ? 'OPERACYJNY' : 'WSTRZYMANY', admin.autopilotEnabled ? 'cyan' : 'yellow') +
    statusCell('BRAMKI OPERATORA', Number(admin.businessLoop.ordersReadyForReview || 0) + Number(admin.leadEngine.awaitingSend || 0), 'mag') +
    statusCell('ZAPISANE ZDARZENIA', fmt(admin.counts.events), '') +
  '</div>';
}

function legacyBridge(html, title, note) {
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
    '<div class="product-section-head"><div><h2>' + esc(title) + '</h2><p>' + esc(note || 'Kontrole na żywo i dowody z nadrzędnego środowiska fabryki.') + '</p></div>' +
    '<a class="button" href="' + routePath() + '?legacy=1">OTWÓRZ SUROWY WIDOK</a></div>' +
    '<div class="legacy-bridge"><div class="bridge-note">Warstwa wizualna jest nowa. Każdy formularz poniżej nadal wywołuje oryginalną, audytowaną akcję backendu.</div>' + root.innerHTML + '</div>' +
  '</section>';
}

function runRow(run) {
  return '<tr><td>' + esc(run.id || '—') + '</td><td>' + esc(plMode(run.mode)) + '</td><td>' + tag(plStatus(run.status), statusClass(run.status)) + '</td><td>' + esc(String(run.trigger || '—').replaceAll('_', ' ')) + '</td><td>' + shortDate(run.finishedAt || run.startedAt) + '</td></tr>';
}

function factoryRunView(admin, production, runs, legacy) {
  setShellMode(admin.mode);
  const latest = (runs.workRuns || [])[0] || admin.latestWorkRun;
  const steps = latest && latest.steps ? latest.steps : [];
  const gateCount = Number(admin.businessLoop.ordersReadyForReview || 0) + Number(admin.leadEngine.awaitingSend || 0) + (admin.integrity || []).filter((item) => item.status !== 'healthy').length;
  const controls = '<button class="button primary" data-op="cycle">URUCHOM KONTROLOWANY CYKL</button><button class="button" data-op="autopilot-off">AWARYJNE WSTRZYMANIE</button>';
  const meta = { icon: 'rocket_launch', code: 'CENTRUM_MISJI / PRZEBIEG_FABRYKI', title: 'Rozpocznij dzień operacyjny.', description: 'Jeden ograniczony cykl produkcyjny. Najpierw praca klienta, potem poprawki, a trening tylko wtedy, gdy linia jest wolna. Każdy wynik zatrzymuje się na bramce operatora.', controls };
  const stepHtml = steps.length ? steps.map((step, index) => '<div class="step-card"><div class="step-index">' + String(index + 1).padStart(2, '0') + '</div><div class="step-agent"><strong>' + esc(step.agentId || 'AGENT') + '</strong><small>' + esc(step.agentName || String(step.jobType || 'Węzeł produkcyjny').replaceAll('_', ' ')) + '</small></div><div class="step-copy"><strong>' + esc(step.inputSummary || String(step.jobType || 'Brak opisu wejścia').replaceAll('_', ' ')) + '</strong><small>' + esc(step.outputSummary || 'Ten krok nie utworzył wyniku.') + '</small></div>' + tag(plStatus(step.status), statusClass(step.status)) + '</div>').join('') : '<div class="empty-product">BRAK KROKÓW PRZEBIEGU — URUCHOM KONTROLOWANY CYKL.</div>';
  const previous = (runs.workRuns || []).slice(0, 5);
  return '<div class="product-page">' + hero(meta, admin) +
    '<div class="product-grid"><section class="mission-card primary product-col-8"><div class="stamp">BIEŻĄCA MISJA</div><h3>' + esc(admin.nextOperatorAction.title || 'Fabryka czeka') + '</h3><p>' + esc(admin.nextOperatorAction.detail || admin.standingStill || 'System czeka na jawną akcję operatora.') + '</p><div class="source-chain"><span>TRYB ' + esc(plMode(admin.mode)) + '</span><i>→</i><span>TRENING ' + esc(admin.businessLoop.trainingToday) + '</span><i>→</i><span>' + fmt(admin.businessLoop.activeOrders) + ' AKTYWNYCH ZLECEŃ</span></div><div class="button-row"><button class="button primary" data-op="cycle">URUCHOM TERAZ</button><a class="button" href="#operational-evidence">OTWÓRZ KONTROLE</a></div></section>' +
    '<aside class="mission-card gate product-col-4"><div class="stamp">BRAMKA OPERATORA</div><div class="operator-gate-number">' + gateCount + '</div><h3>decyzji oczekuje</h3><p>Żadna akcja zewnętrzna nie opuszcza systemu bez człowieka.</p><div class="button-row"><a class="button mag" href="/orders">PRZEJRZYJ ZLECENIA</a><a class="button" href="/lead-engine">PRZEJRZYJ LEADY</a></div></aside></div>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Sekwencja wykonania agentów</h2><p>Przyjęcie → Badania → Strategia → Produkcja → Kontrola jakości → Pakowanie → Przegląd operatora</p></div>' + (latest ? tag(plStatus(latest.status), statusClass(latest.status)) : tag('BRAK PRZEBIEGU', '')) + '</div><div class="product-section-body step-timeline">' + stepHtml + '</div></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Poprzednie przebiegi pracy</h2><p>Pięć ostatnich zapisanych cykli.</p></div><a class="button" href="/events">OTWÓRZ PEŁNY DZIENNIK</a></div><div class="product-section-body"><table class="run-table"><thead><tr><th>ID</th><th>Tryb</th><th>Status</th><th>Wyzwalacz</th><th>Zakończono</th></tr></thead><tbody>' + (previous.length ? previous.map(runRow).join('') : '<tr><td colspan="5">Brak zapisanych przebiegów pracy.</td></tr>') + '</tbody></table></div></section>' +
    legacyBridge(legacy, 'Kontrole misji i dowody produkcyjne', 'Twórz zlecenia, uruchamiaj trening, sprawdzaj wyniki i obsługuj istniejące bramki bezpieczeństwa.') + '</div>';
}

function stationCard(station, index) {
  const icons = ['input_circle','search','strategy','edit_note','local_shipping','verified','inventory_2','approval'];
  const last = station.lastTask || {};
  return '<article class="station-card"><span class="material-symbols-outlined station-icon">' + icons[index % icons.length] + '</span><div class="stamp">STACJA_' + String(index + 1).padStart(2, '0') + '</div><h3>' + esc(station.name || plStation(station.id)) + '</h3><p>' + esc(station.agentId || 'NIEPRZYDZIELONY') + ' · ' + esc(last.title || 'Brak ostatniego wyniku') + '</p><div class="station-meta"><span>' + esc(plStatus(station.status)) + '</span><b>' + fmt(station.taskCount) + ' ZADAŃ</b></div></article>';
}

function taskCard(task) {
  const title = task.title || task.taskTitle || task.id || 'Zadanie produkcyjne';
  const status = task.status || task.stationStatus || 'queued';
  const source = task.source || task.sourceType || task.kind || 'factory';
  return '<article class="task-card"><div class="task-meta"><span>' + esc(plSource(source)) + '</span><span>' + esc(task.id || '') + '</span></div><h4>' + esc(title) + '</h4><p>' + esc(task.nextOperatorAction || task.lastOutput || task.outputSummary || 'Oczekuje na następne przejście produkcyjne.') + '</p><div class="task-meta"><span>' + esc(task.clientName || task.client || plDepartment(task.department) || '') + '</span><span>' + esc(plStatus(status)) + '</span></div></article>';
}

function lane(title, key, tasks) {
  const list = Array.isArray(tasks) ? tasks : [];
  return '<section class="swimlane" data-lane="' + key + '"><div class="swimlane-head"><span>' + esc(title) + '</span><b>' + list.length + ' ZADAŃ</b></div><div class="task-grid">' + (list.length ? list.map(taskCard).join('') : '<div class="empty-product">BRAK ZADAŃ W TEJ LINII</div>') + '</div></section>';
}

function productionLineView(admin, production, legacy) {
  setShellMode(admin.mode);
  const controls = '<button class="button primary" data-op="cycle">URUCHOM CYKL PRODUKCYJNY</button><a class="button" href="#operational-evidence">UTWÓRZ PRZEBIEG DEMO</a>';
  const meta = { icon: 'conveyor_belt', code: 'HALA_LOGISTYCZNA / LINIA_PRODUKCYJNA', title: 'Zobacz, gdzie znajduje się każde zadanie.', description: 'Osiem fizycznych stacji, cztery linie pracy i jedna ludzka granica zatwierdzenia. Wąskie gardła są widoczne zamiast ukryte w logach.', controls };
  const bottleneck = production.bottleneck || production.nextOperatorAction || admin.nextOperatorAction.detail;
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Osiem stacji hali produkcyjnej</h2><p>Każda stacja pokazuje przypisanego agenta, status, liczbę zadań i ostatni wynik.</p></div>' + tag(production.autopilotEnabled ? 'AUTOPILOT WŁĄCZONY' : 'AUTOPILOT WSTRZYMANY', production.autopilotEnabled ? 'cyan' : 'yellow') + '</div><div class="product-section-body station-grid">' + (production.stations || []).map(stationCard).join('') + '</div></section>' +
    '<section class="mission-card warn"><div class="stamp">BIEŻĄCE WĄSKIE GARDŁO</div><h3>' + esc(bottleneck || 'Nie wykryto blokującego wąskiego gardła') + '</h3><p>Przegląd operatora i zadania zablokowane są jedynymi akceptowalnymi powodami zatrzymania linii.</p></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Linie przepływu produkcji</h2><p>Filtruj halę bez utraty pełnego łańcucha dowodów.</p></div><div class="filter-row"><button class="button active" data-op="lane-filter" data-filter="all">WSZYSTKO</button><button class="button" data-op="lane-filter" data-filter="client">KLIENT</button><button class="button" data-op="lane-filter" data-filter="training">TRENING</button><button class="button" data-op="lane-filter" data-filter="rework">POPRAWKI</button><button class="button" data-op="lane-filter" data-filter="delivery">DOSTAWY</button></div></div><div class="product-section-body swimlanes">' +
      lane('Praca klienta', 'client', production.clientLine) + lane('Trening', 'training', production.trainingLine) + lane('Poprawki', 'rework', production.reworkLine) + lane('Pakiety dostawy', 'delivery', production.deliveryPackLine) +
    '</div></section>' + legacyBridge(legacy, 'Kontrole produkcji i szczegóły zadań', 'Używaj prawdziwych kontrolek przebiegu demo, cyklu i przeglądu. Bez ozdobnych akcji.') + '</div>';
}

function orderColumn(title, key, orders) {
  const list = orders.filter((order) => key.includes(order.status));
  return '<section class="order-column"><div class="order-column-head"><span>' + esc(title) + '</span><span>' + list.length + '</span></div><div class="order-list">' + (list.length ? list.map((order) => '<article class="order-card"><div class="task-meta"><span>' + esc(plDepartment(order.department) || 'Realizacja') + '</span><span>REWIZJA ' + fmt(order.revisionCount) + '</span></div><h4>' + esc(order.clientName || order.id) + '</h4><p>' + esc(String(order.taskType || 'Wynik dla klienta').replaceAll('_', ' ')) + '</p><p class="stamp">' + esc(order.id) + '</p><a class="button block" href="#operational-evidence">OTWÓRZ BRAMKĘ DECYZYJNĄ</a></article>').join('') : '<div class="empty-product">PUSTO</div>') + '</div></section>';
}

function ordersView(admin, legacy) {
  setShellMode(admin.mode);
  const orders = admin.orders || [];
  const controls = '<a class="button primary" href="#operational-evidence">DODAJ ZLECENIE KLIENTA</a><button class="button" data-op="cycle">URUCHOM KOLEJKĘ</button>';
  const meta = { icon: 'receipt_long', code: 'ZLECENIA_KLIENTÓW / BRAMKI_ZATWIERDZENIA', title: 'Tutaj wchodzi prawdziwa praca.', description: 'Przyjmij zlecenie klienta, sprawdź wygenerowany wynik i podejmij jedną jawną decyzję człowieka. System nigdy nie wysyła automatycznie.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Potok zleceń</h2><p>NOWE → W PRODUKCJI → GOTOWE DO PRZEGLĄDU → ZATWIERDZONE / ODRZUCONE / ZAMKNIĘTE</p></div>' + tag(orders.length + ' ŁĄCZNIE', 'cyan') + '</div><div class="product-section-body order-board">' +
    orderColumn('NOWE / W PRODUKCJI', ['new','in_production'], orders) + orderColumn('GOTOWE DO PRZEGLĄDU', ['ready_for_review'], orders) + orderColumn('ZDECYDOWANE / ZAMKNIĘTE', ['approved','rejected','closed'], orders) +
    '</div></section>' +
    '<section class="mission-card gate"><div class="stamp">TWARDA ZASADA BEZPIECZEŃSTWA</div><h3>Dostarcza wyłącznie operator.</h3><p>Zatwierdź do magazynu, utwórz pakiet dostawy, zażądaj poprawki albo odrzuć. Informacja zwrotna jest obowiązkowa przy poprawkach i odrzuceniu.</p></section>' +
    legacyBridge(legacy, 'Przyjęcie zlecenia, podgląd wyników i prawdziwe formularze decyzji', 'Formularze poniżej są nadrzędnymi kontrolami zleceń i zatwierdzeń.') + '</div>';
}

function packCard(pack) {
  return '<article class="pack-card"><div class="task-meta"><span>' + esc(plStatus(pack.status || 'draft')) + '</span><span>' + shortTime(pack.updatedAt || pack.createdAt) + '</span></div><h3>' + esc(pack.title || pack.clientName || pack.id || 'Pakiet dostawy') + '</h3><p>' + esc(pack.executiveSummary || pack.summary || 'Pakiet gotowy dla klienta, utworzony z zatwierdzonego wyniku.') + '</p><div class="source-chain"><span>ZLECENIE</span><i>→</i><span>WYNIK</span><i>→</i><span>PAKIET</span><i>→</i><span>SPRAWA</span></div><a class="button block" href="#operational-evidence">OTWÓRZ BRAMKĘ PAKIETU</a></article>';
}

function deliveryView(admin, delivery, legacy) {
  setShellMode(admin.mode);
  const packs = delivery.packs || [];
  const controls = '<a class="button primary" href="#operational-evidence">UTWÓRZ / ZATWIERDŹ PAKIET</a><a class="button" href="/warehouse">OTWÓRZ MAGAZYN</a>';
  const meta = { icon: 'local_shipping', code: 'CENTRUM_PAKIETÓW_DOSTAWY', title: 'Pakuj zatwierdzone prace.', description: 'Utwórz materiał gotowy dla klienta bez automatycznego wysyłania. Operator dostarcza go kanałem zewnętrznym.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="mission-card primary"><div class="stamp">GRANICA DOSTAWY</div><h3>OPERATOR DOSTARCZA PRZEZ KANAŁ ZEWNĘTRZNY</h3><p>Ratio Essendi przygotowuje, zatwierdza, magazynuje i rejestruje. Nie podszywa się pod operatora i nie wysyła cicho pracy klienta.</p></section>' +
    '<section class="product-section"><div class="product-section-head"><div><h2>Pakiety dostawy</h2><p>Szkice, zatwierdzone i gotowe do magazynu materiały.</p></div>' + tag(packs.length + ' PAKIETÓW', 'cyan') + '</div><div class="product-section-body pack-grid">' + (packs.length ? packs.map(packCard).join('') : '<div class="empty-product">BRAK PAKIETÓW DOSTAWY</div>') + '</div></section>' +
    legacyBridge(legacy, 'Podgląd pakietu, historia rewizji i kontrole zatwierdzenia', 'Twórz, zatwierdzaj, magazynuj i eksportuj przez audytowane akcje dostawy poniżej.') + '</div>';
}

function warehouseView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<a class="button primary" href="#operational-evidence">PRZESZUKAJ ZASOBY</a><a class="button" href="/delivery">OTWÓRZ CENTRUM DOSTAW</a>';
  const meta = { icon: 'database', code: 'MAGAZYN / PAMIĘĆ_INSTYTUCJONALNA', title: 'Zachowaj zatwierdzone dowody do ponownego użycia.', description: 'Zatwierdzone wyniki, pakiety dostawy i zamknięte sprawy żyją tutaj. Ponowne użycie jest dozwolone; ciche usuwanie dowodów nie.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Inwentarz pamięci</h2><p>Najpierw wyszukiwanie, potem dostęp do zatwierdzonych prac i łańcuchów dowodów.</p></div></div><div class="product-section-body evidence-grid">' +
    '<article class="evidence-card"><div class="stamp">ZATWIERDZONE WYNIKI</div><h3>' + fmt(admin.counts.warehouseAssets) + ' zasobów wielokrotnego użycia</h3><p>Wyniki zatwierdzone przez operatora, zapisane do kontrolowanego ponownego wykorzystania.</p></article>' +
    '<article class="evidence-card"><div class="stamp">PAKIETY DOSTAWY</div><h3>' + fmt(admin.businessLoop.deliveryPacks.warehouseReady) + ' gotowych do magazynu</h3><p>Materiały gotowe dla klienta ze znacznikami czasu dowodów.</p></article>' +
    '<article class="evidence-card"><div class="stamp">REJESTRY SPRAW</div><h3>' + fmt(admin.businessLoop.caseRecords) + ' zamkniętych spraw</h3><p>Łańcuchy źródeł łączące zlecenie, wynik, pakiet i decyzję operatora.</p></article>' +
    '</div></section>' + legacyBridge(legacy, 'Zatwierdzone zasoby i pełne łańcuchy dowodów', 'Otwieraj, eksportuj, archiwizuj lub używaj ponownie przez prawdziwy widok magazynu poniżej.') + '</div>';
}

function eventsView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<button class="button primary" data-op="export-json">EKSPORTUJ JSON</button><button class="button" data-op="export-csv">EKSPORTUJ CSV</button>';
  const meta = { icon: 'terminal', code: 'DZIENNIK_AUDYTU / OŚ_DOWODÓW', title: 'Udowodnij, co się wydarzyło.', description: 'Niezmienny chronologiczny dowód: czas, wykonawca, typ zdarzenia, cel i podsumowanie. Akcje operatora pozostają wyraźnie oddzielone.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="mission-card primary"><div class="stamp">STATUS ZAPISU</div><h3>' + fmt(admin.counts.events) + ' zapisanych zdarzeń</h3><p>Czas systemowy: ' + shortDate(admin.generatedAt) + '. Eksport odczytuje widoczną, nadrzędną tabelę zdarzeń.</p><div class="button-row export-row"><button class="button primary" data-op="export-json">EKSPORTUJ JSON</button><button class="button" data-op="export-csv">EKSPORTUJ CSV</button></div></section>' +
    legacyBridge(legacy, 'Niezmienna oś zdarzeń', 'Brak kontrolek edycji. Ten ekran przechowuje dowody, a nie narrację.') + '</div>';
}

function dailyReviewView(admin, legacy) {
  setShellMode(admin.mode);
  const current = Number(String(admin.businessLoop.trainingToday || '0/5').split('/')[0] || 0);
  const departments = ['Marketing','Sprzedaż','Realizacja','Badania','Kontrola jakości'];
  const controls = '<button class="button primary" data-op="cycle">URUCHOM CYKL TRENINGOWY</button><a class="button" href="#operational-evidence">PRZEJRZYJ WYNIKI</a>';
  const meta = { icon: 'fact_check', code: 'DZIENNY_PRZEGLĄD_PRODUKCJI', title: 'Trenuj tylko wtedy, gdy praca klienta jest czysta.', description: 'Pięć ograniczonych wyników wewnętrznych. Każdy element jest oznaczony jako TRENING / NIE DLA KLIENTA i wymaga decyzji operatora.', controls };
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section"><div class="product-section-head"><div><h2>Postęp dzienny</h2><p>' + current + '/5 wyników utworzonych dzisiaj.</p></div>' + tag(current + '/5', current >= 5 ? 'cyan' : 'yellow') + '</div><div class="product-section-body"><div class="progress-track"><i style="width:' + Math.min(100, current * 20) + '%"></i></div><div class="daily-departments" style="margin-top:16px">' + departments.map((department, index) => '<article class="department-card"><strong>' + department + '</strong><small>' + (index < current ? 'WYNIK GOTOWY DO PRZEGLĄDU' : 'OCZEKIWANIE NA CYKL') + '</small></article>').join('') + '</div></div></section>' +
    '<section class="mission-card warn"><div class="stamp">TRENING / NIE DLA KLIENTA</div><h3>Zaakceptuj, zażądaj poprawki, odrzuć albo przenieś do magazynu.</h3><p>Zasoby treningowe nigdy nie mogą być mylone z aktywnymi wynikami klienta.</p></section>' + legacyBridge(legacy, 'Wyniki treningowe i decyzje operatora', 'Przejrzyj wynik każdego działu przez oryginalne akcje akceptacji, poprawki, odrzucenia i magazynowania.') + '</div>';
}

function trashView(admin, legacy) {
  setShellMode(admin.mode);
  const controls = '<a class="button primary" href="#operational-evidence">OTWÓRZ BŁĘDNE PRACE</a><a class="button" href="/events">OTWÓRZ DZIENNIK AUDYTU</a>';
  const meta = { icon: 'delete_sweep', code: 'ODRZUCONE / BŁĘDNE_PRACE', title: 'Nic nie znika po cichu.', description: 'Odrzucone wyniki, nieudane przebiegi i incydenty kwarantanny pozostają widoczne wraz z powodem, wykonawcą, czasem i źródłem.', controls };
  const integrityIncidents = (admin.integrity || []).filter((entry) => entry.status !== 'healthy').length;
  return '<div class="product-page">' + hero(meta, admin) +
    '<section class="product-section danger-zone"><div class="product-section-head"><div><h2>Podsumowanie dowodów niepowodzeń</h2><p>Ponawiaj wyłącznie jako nowy kontrolowany przebieg. Nigdy nie przywracaj ani nie wysyłaj ponownie po cichu.</p></div></div><div class="product-section-body evidence-grid">' +
    '<article class="evidence-card"><div class="stamp">ELEMENTY KOSZA</div><h3>' + fmt(admin.counts.trash) + ' odrzuconych zasobów</h3><p>Odrzucone oferty i wyniki z zachowanymi powodami.</p></article>' +
    '<article class="evidence-card"><div class="stamp">NIEUDANE PRZEBIEGI</div><h3>' + fmt((admin.workRunsSummary || []).filter((run) => run.status === 'failed').length) + ' ostatnich niepowodzeń</h3><p>Dowody przebiegów pracy pozostają w niezmiennym strumieniu zdarzeń.</p></article>' +
    '<article class="evidence-card"><div class="stamp">INCYDENTY INTEGRALNOŚCI</div><h3>' + integrityIncidents + ' aktywnych incydentów</h3><p>Decyzje o kwarantannie i resecie pozostają pod kontrolą operatora.</p></article>' +
    '</div></section>' + legacyBridge(legacy, 'Odrzucone, nieudane i poddane kwarantannie prace', 'Otwieraj dowody, archiwizuj lub ponawiaj przez istniejące kontrolowane akcje poniżej.') + '</div>';
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
  return '<div class="terminal"><span class="mag">NIEZNANY_EKRAN_PRODUKTU:</span> ' + esc(screen) + '</div>';
}

function tableRows() {
  const table = app.querySelector('.legacy-bridge table');
  if (!table) return [];
  const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => cell.textContent.trim());
  return Array.from(table.querySelectorAll('tbody tr')).map((row) => {
    const cells = Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent.trim());
    const item = {};
    cells.forEach((value, index) => { item[headers[index] || 'kolumna_' + index] = value; });
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
  if (!rows.length) return notify('BRAK TABELI ZDARZEŃ DO EKSPORTU', true);
  if (format === 'json') {
    downloadText('ratio-essendi-zdarzenia.json', JSON.stringify(rows, null, 2), 'application/json');
    return notify('ZDARZENIA WYEKSPORTOWANE DO JSON');
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => '"' + String(row[header] || '').replaceAll('"', '""') + '"').join(','))].join('\n');
  downloadText('ratio-essendi-zdarzenia.csv', csv, 'text/csv');
  notify('ZDARZENIA WYEKSPORTOWANE DO CSV');
}

async function boot() {
  app.innerHTML = '<div class="screen-loading">SYNCHRONIZACJA STANU FABRYKI...</div>';
  try {
    const meta = productMeta();
    if (!meta) throw new Error('Nieznana trasa interfejsu: ' + screen);
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
    app.innerHTML = '<div class="terminal"><span class="mag">BŁĄD_SYNCHRONIZACJI_UI:</span> ' + esc(error.message) + '<br><br><a class="button" href="' + routePath() + '?legacy=1">OTWÓRZ WIDOK AWARYJNY</a></div>';
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
      notify('KONTROLOWANY CYKL ZAKOŃCZONY');
      return boot();
    }
    if (op === 'autopilot-on') {
      await postForm('/api/autopilot', { action: 'on', returnTo: routePath() });
      notify('AUTOPILOT OPERACYJNY');
      return boot();
    }
    if (op === 'autopilot-off') {
      await postForm('/api/autopilot', { action: 'off', returnTo: routePath() });
      notify('AUTOPILOT WSTRZYMANY');
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
    notify('AKCJA OPERATORA ZAPISANA');
    await boot();
  } catch (error) {
    if (submitter) submitter.disabled = false;
    notify(error.message, true);
  }
});

modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('open'); });
boot();
`
