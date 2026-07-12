import { STITCH_CSS } from "./stitch-ui-styles.js"
import { STITCH_REFINEMENT_CSS } from "./stitch-ui-refinement.js"
import { STITCH_PRODUCT_CSS } from "./stitch-ui-product-styles.js"
import { STITCH_NEON_UPGRADE_CSS } from "./stitch-ui-neon-upgrade.js"
import { STITCH_CLIENT_V2 } from "./stitch-ui-client-v2.js"
import { STITCH_PRODUCT_CLIENT } from "./stitch-ui-product-client.js"

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
  return screen === "command" || screen === "lead" || screen === "operator"
}

function navKey(screen: Screen): string {
  if (screen === "lead") return "lead"
  if (screen === "production-line" || screen === "delivery" || screen === "warehouse") return "logistics"
  if (screen === "orders") return "personnel"
  if (screen === "operator" || screen === "events" || screen === "trash") return "operator"
  return "command"
}

const nav = (active: string): string => [
  ["/admin", "dashboard", "Command", "command"],
  ["/lead-engine", "psychology", "Intelligence", "lead"],
  ["/production-line", "conveyor_belt", "Logistics", "logistics"],
  ["/orders", "group", "Personnel", "personnel"],
  ["/operator", "settings_input_component", "System", "operator"],
].map(([href, icon, label, key]) => `<a href="${href}" class="nav-link ${active === key ? "active" : ""}"><span class="material-symbols-outlined">${icon}</span><span>${label}</span></a>`).join("")

function brandLockup(): string {
  return `<div class="osa-lockup"><span class="osa-emblem" aria-hidden="true"><i></i></span><div><div class="osa-wordmark"><b>Ratio</b> Essendi</div><div class="osa-submark">OsaTechGPT // Agentic System</div></div></div>`
}

function sidebarHeader(screen: Screen): string {
  if (screen === "lead") {
    return `<div class="side-brand-block"><div class="stamp">SYSTEM IDENTIFIER</div>${brandLockup()}</div>`
  }
  if (screen === "operator" || screen === "events" || screen === "trash") {
    return `<div class="side-brand-block"><div class="stamp">SYSTEM CONTROL</div>${brandLockup()}${operatorCard()}</div>`
  }
  return `<div class="identity"><div class="stamp">SYSTEM IDENT</div>${brandLockup()}${operatorCard()}</div>`
}

function operatorCard(): string {
  return `<div class="operator"><div class="operator-icon"><span class="material-symbols-outlined">shield_person</span></div><div><strong>OPERATOR-01</strong><small>● STATUS: OPERATIONAL</small></div></div>`
}

function sideSystemCard(): string {
  return `<div class="side-system-card"><div class="side-system-head"><span>Runtime link</span><span class="side-system-live"><i></i>Live</span></div><div class="side-system-wave" aria-hidden="true"><i style="height:35%"></i><i style="height:72%"></i><i style="height:48%"></i><i style="height:88%"></i><i style="height:62%"></i><i style="height:94%"></i><i style="height:55%"></i><i style="height:78%"></i><i style="height:42%"></i><i style="height:84%"></i><i style="height:58%"></i><i style="height:96%"></i></div></div>`
}

function notificationControl(screen: Screen, mobile = false): string {
  const cls = mobile ? "icon-button" : "shell-icon"
  if (usesLegacyClient(screen)) {
    return `<button class="${cls}" data-action="notify" aria-label="Notifications"><span class="material-symbols-outlined">notifications_active</span><i></i></button>`
  }
  return `<a class="${cls}" href="/events" aria-label="Open notifications and audit events"><span class="material-symbols-outlined">notifications_active</span><i></i></a>`
}

function topTab(path: string, href: string): string {
  const active = path === href || (href === "/admin" && path === "/")
  return `<a class="${active ? "active" : ""}" href="${href}">`
}

function desktopTopbar(screen: Screen, path: string): string {
  const titles: Record<Screen, string> = {
    command: "RATIO<br>ESSENDI",
    lead: "LEAD<br>ENGINE",
    operator: "SYSTEM<br>CORE",
    "factory-run": "MISSION<br>CONTROL",
    "production-line": "PRODUCTION<br>LINE",
    orders: "CLIENT<br>ORDERS",
    delivery: "DELIVERY<br>CENTER",
    warehouse: "WAREHOUSE<br>MEMORY",
    events: "AUDIT<br>LOG",
    "daily-review": "DAILY<br>REVIEW",
    trash: "FAILED<br>WORK",
  }
  const commandMeta = `<div class="command-meta"><span>Mode:<b id="shell-mode">Syncing</b></span><span>Status:<b class="cyan">Operational</b></span><span>Operator:<b>God-Boss</b></span></div>`
  const tabs = `<nav class="topnav">${topTab(path, "/admin")}Dashboard</a>${topTab(path, "/factory-run")}Missions</a>${topTab(path, "/warehouse")}Inventory</a>${topTab(path, "/production-line")}Agents</a>${topTab(path, "/events")}Logs</a></nav>`
  const center = screen === "command" ? commandMeta : tabs
  return `<header class="topbar"><div class="brand">${titles[screen]}</div>${center}<div class="top-actions"><a class="shell-icon" href="/events" aria-label="Open logs"><span class="material-symbols-outlined">terminal</span></a>${notificationControl(screen)}<a class="shell-icon" href="/operator" aria-label="System settings"><span class="material-symbols-outlined">settings</span></a><span class="top-divider"></span>${screen === "command" ? "" : '<a class="button" href="/events">DIAGNOSTICS</a>'}<button class="button primary" data-action="start" data-op="autopilot-on">START OPERATION</button></div></header>`
}

export function renderStitchUi(req: RequestLike): string {
  const { path } = resolveRequestPath(req)
  const screen = screenFor(path)
  const active = navKey(screen)
  const bottomOperator = screen === "lead" ? `<div class="sidebar-operator-bottom">${operatorCard()}</div>` : ""
  const client = usesLegacyClient(screen) ? STITCH_CLIENT_V2 : STITCH_PRODUCT_CLIENT

  return `<!doctype html><html lang="pl" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Ratio Essendi — OsaTechGPT</title><meta name="theme-color" content="#020708"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${STITCH_CSS}${STITCH_REFINEMENT_CSS}${STITCH_PRODUCT_CSS}${STITCH_NEON_UPGRADE_CSS}</style></head><body data-screen="${screen}"><aside class="sidebar">${sidebarHeader(screen)}<nav class="nav">${nav(active)}</nav><div class="side-bottom">${bottomOperator}${sideSystemCard()}<a class="button primary block" href="/factory-run">DEPLOY AGENT</a><div class="side-powered">Built with <b>OsaTechGPT</b><br>Ratio Essendi Control Layer</div><div class="side-utility"><a class="nav-link" href="/events"><span class="material-symbols-outlined">terminal</span>Logs</a><a class="nav-link" href="${path}?legacy=1"><span class="material-symbols-outlined">help</span>Legacy tools</a></div></div></aside><main class="shell"><header class="mobile-top"><div class="mobile-wordmark"><span class="material-symbols-outlined">hub</span><strong>RATIO</strong> ESSENDI</div><div class="top-actions">${notificationControl(screen, true)}<a class="mobile-avatar" href="/operator" aria-label="Operator cockpit"><span class="material-symbols-outlined">account_circle</span></a></div></header>${desktopTopbar(screen, path)}<div class="content" id="app"><div class="terminal">LOADING RATIO ESSENDI STATE...</div></div><button class="mobile-fab" data-action="start" data-op="autopilot-on" aria-label="Start operation"><span class="material-symbols-outlined">rocket_launch</span></button><nav class="mobile-bottom"><a href="/admin" class="${active === "command" ? "active" : ""}"><span class="material-symbols-outlined">dashboard</span>COMMAND</a><a href="/lead-engine" class="${active === "lead" ? "active" : ""}"><span class="material-symbols-outlined">psychology</span>INTEL</a><a href="/production-line" class="${active === "logistics" ? "active" : ""}"><span class="material-symbols-outlined">conveyor_belt</span>LOGISTICS</a><a href="/orders" class="${active === "personnel" ? "active" : ""}"><span class="material-symbols-outlined">group</span>PERSONNEL</a><a href="/operator" class="${active === "operator" ? "active" : ""}"><span class="material-symbols-outlined">tune</span>SYSTEM</a></nav></main><div class="modal" id="modal" aria-hidden="true"><div class="modal-card" id="modal-card" role="dialog" aria-modal="true"></div></div><div class="toast" id="toast" role="status"></div><script>${client}</script></body></html>`
}
