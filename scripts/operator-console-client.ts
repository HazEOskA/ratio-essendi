export const OPERATOR_CONSOLE_CLIENT = String.raw`
const app = document.getElementById('app');
const toast = document.getElementById('toast');

const fmt = (value) => new Intl.NumberFormat('pl-PL').format(Number(value || 0));
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function notify(message, bad = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.style.borderColor = bad ? 'var(--danger)' : 'var(--cyan)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function installOperatorStyles() {
  if (document.getElementById('operator-console-styles')) return;
  const style = document.createElement('style');
  style.id = 'operator-console-styles';
  style.textContent = [
    '.operator-console{display:grid;gap:22px;max-width:1180px;margin:0 auto}',
    '.operator-welcome{border:1px solid var(--line);background:linear-gradient(135deg,#171919,#111 68%,#092020);padding:34px;display:flex;align-items:center;justify-content:space-between;gap:24px}',
    '.operator-welcome h1{font:800 clamp(34px,5vw,58px)/1.05 "Plus Jakarta Sans";margin:8px 0 12px}',
    '.operator-welcome p{margin:0;color:#b9c4c3;max-width:650px;font-size:15px;line-height:1.55}',
    '.operator-welcome-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}',
    '.operator-state{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}',
    '.operator-stat{border:1px solid var(--line);background:#171919;padding:22px;min-height:145px;display:flex;flex-direction:column}',
    '.operator-stat small{font:700 9px "JetBrains Mono";letter-spacing:.1em;color:var(--muted);text-transform:uppercase}',
    '.operator-stat strong{font:800 42px "Plus Jakarta Sans";margin-top:12px}',
    '.operator-stat span{margin-top:auto;color:#aeb9b8;font-size:12px}',
    '.operator-stat.attention{border-color:#76556f;box-shadow:inset 4px 0 0 var(--mag)}',
    '.operator-stat.good{border-color:#267a63;box-shadow:inset 4px 0 0 #46d99b}',
    '.operator-decision{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.8fr);gap:18px}',
    '.operator-panel{border:1px solid var(--line);background:#151616}',
    '.operator-panel-head{padding:18px 20px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;align-items:center}',
    '.operator-panel-head h2{font:700 22px "Plus Jakarta Sans";margin:0}',
    '.operator-panel-body{padding:22px}',
    '.operator-next{font:700 28px/1.25 "Plus Jakarta Sans";margin:0 0 14px}',
    '.operator-copy{color:#bac4c3;line-height:1.55;margin:0 0 22px}',
    '.operator-actions{display:flex;gap:10px;flex-wrap:wrap}',
    '.operator-summary{display:grid;gap:12px}',
    '.operator-summary-row{display:flex;justify-content:space-between;gap:16px;padding:13px 0;border-bottom:1px solid #303b3a;font:600 11px "JetBrains Mono"}',
    '.operator-summary-row:last-child{border-bottom:0}',
    '.operator-summary-row b{color:var(--cyan)}',
    '.operator-advanced{display:flex;align-items:center;justify-content:space-between;gap:18px;border:1px dashed #3b4a49;padding:18px 20px;color:#9eaaa9}',
    '.operator-advanced p{margin:0;font-size:12px;line-height:1.45}',
    '@media(max-width:900px){.operator-state{grid-template-columns:repeat(2,1fr)}.operator-decision{grid-template-columns:1fr}.operator-welcome{align-items:flex-start;flex-direction:column}.operator-welcome-actions{justify-content:flex-start}}',
    '@media(max-width:720px){.operator-console{gap:16px}.operator-welcome{padding:26px 24px;border-radius:16px}.operator-welcome h1{font-size:38px}.operator-welcome-actions{width:100%}.operator-welcome-actions .button{flex:1}.operator-state{grid-template-columns:1fr 1fr;gap:10px}.operator-stat{min-height:126px;padding:17px;border-radius:12px}.operator-stat strong{font-size:34px}.operator-panel{border-radius:14px;overflow:hidden}.operator-panel-body{padding:18px}.operator-next{font-size:24px}.operator-actions{display:grid;grid-template-columns:1fr}.operator-advanced{align-items:flex-start;flex-direction:column;border-radius:12px}.operator-advanced .button{width:100%}}'
  ].join('');
  document.head.appendChild(style);
}

function renderOperatorConsole(admin) {
  const active = Number(admin.businessLoop?.activeOrders || 0);
  const waiting = Number(admin.businessLoop?.ordersReadyForReview || 0) + Number(admin.leadEngine?.awaitingSend || 0);
  const completed = Number(admin.businessLoop?.deliveryPacks?.warehouseReady || 0);
  const failures = (admin.integrity || []).filter((entry) => entry.status !== 'healthy').length;
  const workStatus = waiting > 0 ? 'CZEKA NA TWOJĄ DECYZJĘ' : active > 0 ? 'PRACA W TOKU' : completed > 0 ? 'ZROBIONE' : 'BRAK NOWEJ PRACY';
  const nextDetail = admin.nextOperatorAction?.detail || 'Brak decyzji wymagających reakcji operatora.';

  app.innerHTML = '<main class="operator-console">' +
    '<section class="operator-welcome">' +
      '<div><div class="eyebrow">PANEL OPERATORA</div><h1>' + esc(workStatus) + '</h1><p>Widzisz tylko projekty, wynik i decyzje. Logika agentów działa w osobnym obszarze i nie zaśmieca tego ekranu.</p></div>' +
      '<div class="operator-welcome-actions"><a class="button primary" href="/orders?legacy=1"><span class="material-symbols-outlined">add</span> NOWY PROJEKT</a><a class="button" href="/orders">OTWÓRZ PROJEKTY</a></div>' +
    '</section>' +
    '<section class="operator-state">' +
      '<article class="operator-stat"><small>W REALIZACJI</small><strong>' + fmt(active) + '</strong><span>Aktywne projekty wykonywane przez system.</span></article>' +
      '<article class="operator-stat attention"><small>DO DECYZJI</small><strong>' + fmt(waiting) + '</strong><span>Prace czekające na przyjęcie, odrzucenie lub poprawkę.</span></article>' +
      '<article class="operator-stat good"><small>ZAKOŃCZONE / GOTOWE</small><strong>' + fmt(completed) + '</strong><span>Wyniki gotowe do odebrania lub wydania.</span></article>' +
      '<article class="operator-stat"><small>BŁĘDY / BLOKADY</small><strong>' + fmt(failures) + '</strong><span>Elementy wymagające sprawdzenia technicznego.</span></article>' +
    '</section>' +
    '<section class="operator-decision">' +
      '<article class="operator-panel"><div class="operator-panel-head"><h2>Co wymaga Twojej uwagi</h2><span class="tag">' + fmt(waiting) + ' OTWARTYCH</span></div><div class="operator-panel-body"><p class="operator-next">' + esc(waiting > 0 ? 'Masz pracę do zatwierdzenia.' : 'Na ten moment nic nie wymaga decyzji.') + '</p><p class="operator-copy">' + esc(nextDetail) + '</p><div class="operator-actions"><a class="button mag" href="/orders">PRZYJMIJ / ODRZUĆ / POPRAW</a><a class="button" href="/delivery">OTWÓRZ WYNIKI</a><a class="button" href="/events">ZOBACZ DOWODY</a></div></div></article>' +
      '<aside class="operator-panel"><div class="operator-panel-head"><h2>Zestawienie</h2><span class="tag">TERAZ</span></div><div class="operator-panel-body operator-summary">' +
        '<div class="operator-summary-row"><span>Aktywne projekty</span><b>' + fmt(active) + '</b></div>' +
        '<div class="operator-summary-row"><span>Decyzje oczekujące</span><b>' + fmt(waiting) + '</b></div>' +
        '<div class="operator-summary-row"><span>Gotowe wyniki</span><b>' + fmt(completed) + '</b></div>' +
        '<div class="operator-summary-row"><span>Przebiegi systemu</span><b>' + fmt(admin.counts?.workRuns || 0) + '</b></div>' +
        '<div class="operator-summary-row"><span>Leady aktywne</span><b>' + fmt(admin.leadEngine?.active || 0) + '</b></div>' +
      '</div></aside>' +
    '</section>' +
    '<section class="operator-advanced"><p><strong>Agent Workspace</strong><br>Silnik leadów, logistyka, agenci, logi i ustawienia są schowane tutaj. Wchodzisz tylko wtedy, gdy chcesz zobaczyć maszynownię.</p><a class="button" href="/operator">OTWÓRZ ZAAWANSOWANE</a></section>' +
  '</main>';
}

async function boot() {
  installOperatorStyles();
  app.innerHTML = '<div class="terminal">ŁADOWANIE PANELU OPERATORA...</div>';
  try {
    const admin = await fetchJson('/api/admin/state');
    renderOperatorConsole(admin);
  } catch (error) {
    app.innerHTML = '<div class="terminal"><span class="mag">BŁĄD PANELU OPERATORA:</span> ' + esc(error.message) + '<br><br><a class="button" href="/admin?legacy=1">OTWÓRZ WIDOK AWARYJNY</a></div>';
    notify('NIE UDAŁO SIĘ WCZYTAĆ STANU', true);
  }
}

boot();
`;
