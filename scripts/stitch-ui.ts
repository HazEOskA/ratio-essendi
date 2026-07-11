import { STITCH_CSS } from "./stitch-ui-styles.js"
import { STITCH_CLIENT } from "./stitch-ui-client.js"

type RequestLike = { url?: string; method?: string }

const UI_ROUTES = new Set(["/", "/admin", "/operator", "/lead-engine"])

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

function screenFor(path: string): "command" | "lead" | "operator" {
  if (path === "/lead-engine") return "lead"
  if (path === "/operator") return "operator"
  return "command"
}

const nav = (active: string) => [
  ["/admin", "dashboard", "Command", "command"],
  ["/lead-engine", "psychology", "Intelligence", "lead"],
  ["/production-line", "conveyor_belt", "Logistics", "logistics"],
  ["/orders", "group", "Personnel", "personnel"],
  ["/operator", "settings_input_component", "System", "operator"],
].map(([href, icon, label, key]) => `<a href="${href}" class="nav-link ${active === key ? "active" : ""}"><span class="material-symbols-outlined">${icon}</span><span>${label}</span></a>`).join("")

export function renderStitchUi(req: RequestLike): string {
  const { path } = resolveRequestPath(req)
  const screen = screenFor(path)
  const active = screen === "lead" ? "lead" : screen === "operator" ? "operator" : "command"
  return `<!doctype html><html lang="pl" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>RATIO ESSENDI</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,400,0,0&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet"><style>${STITCH_CSS}</style></head><body data-screen="${screen}"><aside class="sidebar"><div class="identity"><div class="stamp">SYSTEM IDENTIFIER</div><div class="operator"><div class="operator-icon"><span class="material-symbols-outlined">shield_person</span></div><div><strong>OPERATOR-01</strong><small>● STATUS: OPERATIONAL</small></div></div></div><nav class="nav">${nav(active)}</nav><div class="side-bottom"><a class="button primary block" href="/factory-run">DEPLOY AGENT</a><div style="height:20px"></div><a class="nav-link" href="/events"><span class="material-symbols-outlined">terminal</span>Logs</a><a class="nav-link" href="/admin?legacy=1"><span class="material-symbols-outlined">help</span>Legacy tools</a></div></aside><main class="shell"><header class="mobile-top"><div class="brand">RATIO ESSENDI</div><div class="top-actions"><button class="icon-button" data-action="notify"><span class="material-symbols-outlined">notifications_active</span></button><a class="operator-icon" href="/operator"><span class="material-symbols-outlined">account_circle</span></a></div></header><header class="topbar"><div class="brand">${screen === "lead" ? "LEAD<br>ENGINE" : "RATIO<br>ESSENDI"}</div><nav class="topnav"><a class="active" href="${path}">Dashboard</a><a href="/factory-run">Missions</a><a href="/warehouse">Inventory</a><a href="/production-line">Agents</a><a href="/events">Logs</a></nav><div class="top-actions"><a class="button" href="/events">DIAGNOSTICS</a><button class="button primary" data-action="start">START OPERATION</button></div></header><div class="content" id="app"><div class="terminal">LOADING RATIO ESSENDI STATE...</div></div><button class="mobile-fab" data-action="start"><span class="material-symbols-outlined" style="font-size:34px">rocket_launch</span></button><nav class="mobile-bottom"><a href="/admin" class="${active === "command" ? "active" : ""}"><span class="material-symbols-outlined">dashboard</span>COMMAND</a><a href="/lead-engine" class="${active === "lead" ? "active" : ""}"><span class="material-symbols-outlined">psychology</span>INTEL</a><a href="/production-line"><span class="material-symbols-outlined">conveyor_belt</span>LOGISTICS</a><a href="/orders"><span class="material-symbols-outlined">group</span>PERSONNEL</a><a href="/operator" class="${active === "operator" ? "active" : ""}"><span class="material-symbols-outlined">tune</span>SYSTEM</a></nav></main><div class="modal" id="modal"><div class="modal-card" id="modal-card"></div></div><div class="toast" id="toast"></div><script>${STITCH_CLIENT}</script></body></html>`
}
