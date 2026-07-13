import { STITCH_CSS } from "./stitch-ui-styles.js"
import { STITCH_REFINEMENT_CSS } from "./stitch-ui-refinement.js"
import { STITCH_PRODUCT_CSS } from "./stitch-ui-product-styles.js"
import { STITCH_CLIENT_V2 } from "./stitch-ui-client-v2.js"
import { STITCH_PRODUCT_CLIENT } from "./stitch-ui-product-client.js"
import { OPERATOR_CONSOLE_CLIENT } from "./operator-console-client.js"

type RequestLike = { url?: string; method?: string }
type Screen =
  | "command"
  | "lead"
  | "operator"
  | "factory-run"
  | "production-line"
  | "orders"
  | "delivery"
  | "warehouse"
  | "events"
  | "daily-review"
  | "trash"

const UI_ROUTES = new Set([
  "/",
  "/admin",
  "/operator",
  "/lead-engine",
  "/factory-run",
  "/production-line",
  "/orders",
  "/delivery",
  "/warehouse",
  "/events",
  "/daily-review",
  "/trash",
])

export function resolveRequestPath(req: RequestLike): { path: string; legacy: boolean } {
  const parsed = new URL(req.url ?? "/", "http://internal")
  let path = parsed.pathname
  if (path === "/api/index") {
    const original = parsed.searchParams.get("__path") ?? "/"
    path = original.startsWith("/") ? original : `/${original}`
  }
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
  return { path, legacy: parsed.searchParams.get("legacy") === "1" }
}

export function shouldRenderStitchUi(req: RequestLike): boolean {
  if ((req.method ?? "GET") !== "GET") return false
  const { path, legacy } = resolveRequestPath(req)
  return !legacy && UI_ROUTES.has(path)
}

function screenFor(path: string): Screen {
  if (path === "/lead-engine") return "lead"
  if (path === "/operator") return "operator"
  if (path === "/factory-run") return "factory-run"
  if (path === "/production-line") return "production-line"
  if (path === "/orders") return "orders"
  if (path === "/delivery") return "delivery"
  if (path === "/warehouse") return "warehouse"
  if (path === "/events") return "events"
  if (path === "/daily-review") return "daily-review"
  if (path === "/trash") return "trash"
  return "command"
}

function usesLegacyClient(screen: Screen): boolean {
  return screen === "lead" || screen === "operator"
}

function navKey(screen: Screen): string {
  if (screen === "lead") return "lead"
  if (screen === "production-line" || screen === "delivery" || screen === "warehouse") return "logistics"
  if (screen === "orders") return "personnel"
  if (screen === "operator" || screen === "events" || screen === "trash") return "operator"
  return "command"
}

const machineNav = (active: string): string => [
  ["/admin", "dashboard", "Kokpit", "command"],
  ["/lead-engine", "psychology", "Wywiad", "lead"],
  ["/production-line", "conveyor_belt", "Logistyka", "logistics"],
  ["/orders", "group", "Projekty", "personnel"],
  ["/operator", "settings_input_component", "System", "operator"],
].map(([href, icon, label, key]) => `<a href="${href}" class="nav-link ${active === key ? "active" : ""}"><span class="material-symbols-outlined">${icon}</span><span>${label}</span></a>`).join("")

const operatorNav = (): string => [
  ["/admin", "dashboard", "Kokpit"],
  ["/orders", "folder_open", "Projekty"],
  ["/orders", "approval", "Do decyzji"],
  ["/delivery", "task_alt", "Wyniki"],
  ["/events", "monitoring", "Raporty"],
].map(([href, icon, label], index) => `<a href="${href}" class="nav-link ${index === 0 ? "active" : ""}"><span class="material-symbols-outlined">${icon}</span><span>${label}</span></a>`).join("")

function sidebarHeader(screen: Screen): string {
  if (screen === "lead") {
    return `<div class="side-brand-block"><div class="stamp">IDENTYFIKATOR SYSTEMU</div><div class="side-wordmark">RATIO ESSENDI</div></div>`
  }
  if (screen === "operator" || screen === "events" || screen === "trash") {
    return `<div class="side-brand-block"><div class="stamp">RATIO ESSENDI</div>${operatorCard()}</div>`
  }
  return `<div class="identity"><div class="stamp">IDENTYFIKATOR SYSTEMU</div>${operatorCard()}</div>`
}

function operatorCard(): string {
  return `<div class="operator"><div class="operator-icon"><span class="material-symbols-outlined">shield_person</span></div><div><strong>OPERATOR-01</strong><small>● STATUS: OPERACYJNY</small></div></div>`
}

function notificationControl(screen: Screen, mobile = false): string {
  const cls = mobile ? "icon-button" : "shell-icon"
  if (usesLegacyClient(screen)) {
    return `<button class="${cls}" data-action="notify" aria-label="Powiadomienia"><span class="material-symbols-outlined">notifications_active</span><i></i></button>`
  }
  return `<a class="${cls}" href="/events" aria-label="Otwórz powiadomienia i zdarzenia audytowe"><span class="material-symbols-outlined">notifications_active</span><i></i></a>`
}

function topTab(path: string, href: string): string {
  const active = path === href || (href === "/admin" && path === "/")
  return `<a class="${active ? "active" : ""}" href="${href}">`
}

function desktopTopbar(screen: Screen, path: string): string {
  const titles: Record<Screen, string> = {
    command: "RATIO<br>ESSENDI",
    lead: "SILNIK<br>LEADÓW",
    operator: "RDZEŃ<br>SYSTEMU",
    "factory-run": "CENTRUM<br>MISJI",
    "production-line": "LINIA<br>PRODUKCYJNA",
    orders: "ZLECENIA<br>KLIENTÓW",
    delivery: "CENTRUM<br>DOSTAW",
    warehouse: "MAGAZYN<br>WIEDZY",
    events: "DZIENNIK<br>AUDYTU",
    "daily-review": "PRZEGLĄD<br>DZIENNY",
    trash: "BŁĘDNE<br>PRACE",
  }
  const commandMeta = `<div class="command-meta"><span>Widok:<b id="shell-mode">Operator</b></span><span>Status:<b class="cyan">Operacyjny</b></span><span>Rola:<b>Decyzje</b></span></div>`
  const tabs = `<nav class="topnav">${topTab(path, "/admin")}Kokpit</a>${topTab(path, "/factory-run")}Misje</a>${topTab(path, "/warehouse")}Magazyn</a>${topTab(path, "/production-line")}Agenci</a>${topTab(path, "/events")}Logi</a></nav>`
  const center = screen === "command" ? commandMeta : tabs
  const actions = screen === "command"
    ? `<a class="button" href="/operator">ZAAWANSOWANE</a><a class="button primary" href="/orders?legacy=1">NOWY PROJEKT</a>`
    : `<a class="button" href="/events">DIAGNOSTYKA</a><button class="button primary" data-action="start" data-op="autopilot-on">URUCHOM OPERACJĘ</button>`
  return `<header class="topbar"><div class="brand">${titles[screen]}</div>${center}<div class="top-actions"><a class="shell-icon" href="/events" aria-label="Otwórz logi"><span class="material-symbols-outlined">terminal</span></a>${notificationControl(screen)}<a class="shell-icon" href="/operator" aria-label="Ustawienia systemu"><span class="material-symbols-outlined">settings</span></a><span class="top-divider"></span>${actions}</div></header>`
}

function mobileBottom(screen: Screen, active: string): string {
  if (screen === "command") {
    return `<nav class="mobile-bottom"><a href="/admin" class="active"><span class="material-symbols-outlined">dashboard</span>KOKPIT</a><a href="/orders"><span class="material-symbols-outlined">folder_open</span>PROJEKTY</a><a href="/orders"><span class="material-symbols-outlined">approval</span>DECYZJE</a><a href="/delivery"><span class="material-symbols-outlined">task_alt</span>WYNIKI</a><a href="/operator"><span class="material-symbols-outlined">more_horiz</span>WIĘCEJ</a></nav>`
  }
  return `<nav class="mobile-bottom"><a href="/admin" class="${active === "command" ? "active" : ""}"><span class="material-symbols-outlined">dashboard</span>KOKPIT</a><a href="/lead-engine" class="${active === "lead" ? "active" : ""}"><span class="material-symbols-outlined">psychology</span>WYWIAD</a><a href="/production-line" class="${active === "logistics" ? "active" : ""}"><span class="material-symbols-outlined">conveyor_belt</span>LOGISTYKA</a><a href="/orders" class="${active === "personnel" ? "active" : ""}"><span class="material-symbols-outlined">group</span>PROJEKTY</a><a href="/operator" class="${active === "operator" ? "active" : ""}"><span class="material-symbols-outlined">tune</span>SYSTEM</a></nav>`
}

export function renderStitchUi(req: RequestLike): string {
  const { path } = resolveRequestPath(req)
  const screen = screenFor(path)
  const active = navKey(screen)
  const bottomOperator = screen === "lead" ? `<div class="sidebar-operator-bottom">${operatorCard()}</div>` : ""
  const client = screen === "command" ? OPERATOR_CONSOLE_CLIENT : usesLegacyClient(screen) ? STITCH_CLIENT_V2 : STITCH_PRODUCT_CLIENT
  const sidebar = screen === "command" ? operatorNav() : machineNav(active)
  const primarySidebarAction = screen === "command"
    ? `<a class="button primary block" href="/orders?legacy=1">NOWY PROJEKT</a>`
    : `<a class="button primary block" href="/factory-run">WDROŻ AGENTA</a>`
  const utility = screen === "command"
    ? `<a class="nav-link" href="/operator"><span class="material-symbols-outlined">hub</span>Agent Workspace</a>`
    : `<a class="nav-link" href="/events"><span class="material-symbols-outlined">terminal</span>Logi</a>`
  const fab = screen === "command"
    ? `<a class="mobile-fab" href="/orders?legacy=1" aria-label="Nowy projekt"><span class="material-symbols-outlined">add</span></a>`
    : `<button class="mobile-fab" data-action="start" data-op="autopilot-on" aria-label="Uruchom operację"><span class="material-symbols-outlined">rocket_launch</span></button>`

  return `<!doctype html><html lang="pl" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>RATIO ESSENDI</title><meta name="theme-color" content="#0a0a0a"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${STITCH_CSS}${STITCH_REFINEMENT_CSS}${STITCH_PRODUCT_CSS}</style></head><body data-screen="${screen}"><aside class="sidebar">${sidebarHeader(screen)}<nav class="nav">${sidebar}</nav><div class="side-bottom">${bottomOperator}${primarySidebarAction}<div class="side-utility">${utility}<a class="nav-link" href="${path}?legacy=1"><span class="material-symbols-outlined">help</span>Widok awaryjny</a></div></div></aside><main class="shell"><header class="mobile-top"><div class="mobile-wordmark"><span class="material-symbols-outlined">terminal</span><strong>RATIO</strong> ESSENDI</div><div class="top-actions">${notificationControl(screen, true)}<a class="mobile-avatar" href="/operator" aria-label="Kokpit operatora"><span class="material-symbols-outlined">account_circle</span></a></div></header>${desktopTopbar(screen, path)}<div class="content" id="app"><div class="terminal">ŁADOWANIE STANU RATIO ESSENDI...</div></div>${fab}${mobileBottom(screen, active)}</main><div class="modal" id="modal" aria-hidden="true"><div class="modal-card" id="modal-card" role="dialog" aria-modal="true"></div></div><div class="toast" id="toast" role="status"></div><script>${client}</script></body></html>`
}
