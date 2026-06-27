import type { AgentContract, SystemCell, SystemEvent } from "@ratio-essendi/shared"
import type { DashboardSnapshot } from "./snapshot.js"

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type Tone = "ok" | "warn" | "bad" | "muted" | "info"

function healthTone(status: SystemCell["healthStatus"]): Tone {
  switch (status) {
    case "healthy":
      return "ok"
    case "degraded":
    case "recovering":
      return "warn"
    case "failed":
      return "bad"
    case "quarantined":
      return "muted"
  }
}

function agentTone(status: AgentContract["status"]): Tone {
  switch (status) {
    case "active":
      return "ok"
    case "created":
      return "info"
    case "warning":
    case "under_review":
    case "succession_required":
      return "warn"
    case "degraded":
    case "disabled":
      return "bad"
    case "archived":
    case "replaced":
      return "muted"
  }
}

function eventTone(eventType: string): Tone {
  if (/fail|drift|degraded|quarantined|conflict|blocked|disabled/.test(eventType)) return "bad"
  if (/succession|under_review|warning|shadow_prepared/.test(eventType)) return "warn"
  if (/approval|recovered|shadow_promoted|activated|successor|replaced/.test(eventType)) return "ok"
  return "info"
}

function badge(text: string, tone: Tone): string {
  return `<span class="badge ${tone}">${esc(text)}</span>`
}

function cellRow(cell: SystemCell): string {
  return `<tr>
    <td class="mono">${esc(cell.id)}</td>
    <td>${esc(cell.name)}</td>
    <td>${esc(cell.domain)}</td>
    <td>${badge(cell.healthStatus, healthTone(cell.healthStatus))}</td>
    <td>${cell.activeController ? badge("active controller", "ok") : badge("standby", "muted")}</td>
  </tr>`
}

function agentRow(agent: AgentContract): string {
  const lineage = agent.lineage.createdFrom
    ? `from ${esc(agent.lineage.createdFrom)}`
    : agent.lineage.successorId
      ? `→ ${esc(agent.lineage.successorId)}`
      : "—"
  return `<tr>
    <td class="mono">${esc(agent.id)}</td>
    <td>${esc(agent.name)} <span class="dim">${esc(agent.version)}</span></td>
    <td>${esc(agent.role)}</td>
    <td>${badge(agent.status, agentTone(agent.status))}</td>
    <td>${esc(agent.kpis.join(", "))}</td>
    <td class="mono dim">${lineage}</td>
  </tr>`
}

function eventRow(event: SystemEvent, index: number): string {
  const transition =
    event.previousState || event.nextState
      ? `${esc(event.previousState ?? "∅")} → ${esc(event.nextState ?? "∅")}`
      : ""
  return `<tr class="evt ${eventTone(event.eventType)}">
    <td class="dim">${String(index + 1).padStart(2, "0")}</td>
    <td>${badge(event.eventType, eventTone(event.eventType))}</td>
    <td class="mono">${esc(event.entityId)}</td>
    <td class="mono dim">${transition}</td>
    <td>${esc(event.reason ?? "")}</td>
  </tr>`
}

/** Render a complete, self-contained HTML dashboard (no external assets). */
export function renderDashboard(snapshot: DashboardSnapshot): string {
  const activeAgents = snapshot.agents.filter((a) => a.status === "active").length
  const replaced = snapshot.agents.filter((a) => a.status === "replaced").length

  const activeByDomain = new Map<string, number>()
  for (const c of snapshot.cells) {
    if (c.activeController) activeByDomain.set(c.domain, (activeByDomain.get(c.domain) ?? 0) + 1)
  }
  const splitBrain = [...activeByDomain.values()].some((n) => n > 1)

  const stat = (label: string, value: string | number, tone: Tone = "info"): string =>
    `<div class="stat"><div class="v ${tone}">${esc(String(value))}</div><div class="l">${esc(label)}</div></div>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ratio Essendi — Operations</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d1117; color: #e6edf3; font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 28px 20px 60px; }
  h1 { font-size: 22px; margin: 0 0 2px; letter-spacing: .3px; }
  .sub { color: #8b949e; margin: 0 0 22px; font-size: 13px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .8px; color: #8b949e; margin: 28px 0 10px; }
  .stats { display: flex; flex-wrap: wrap; gap: 12px; }
  .stat { background: #161b22; border: 1px solid #21262d; border-radius: 10px; padding: 12px 16px; min-width: 120px; }
  .stat .v { font-size: 22px; font-weight: 600; }
  .stat .l { font-size: 11px; color: #8b949e; text-transform: uppercase; letter-spacing: .6px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border: 1px solid #21262d; border-radius: 10px; overflow: hidden; }
  th, td { text-align: left; padding: 9px 12px; border-bottom: 1px solid #21262d; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: #8b949e; background: #11161d; }
  tr:last-child td { border-bottom: none; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12.5px; }
  .dim { color: #8b949e; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 600; border: 1px solid transparent; white-space: nowrap; }
  .badge.ok    { background: #11321f; color: #3fb950; border-color: #234b2e; }
  .badge.warn  { background: #34270a; color: #d29922; border-color: #4d3c14; }
  .badge.bad   { background: #3a1418; color: #f85149; border-color: #5a1e23; }
  .badge.muted { background: #21262d; color: #8b949e; border-color: #30363d; }
  .badge.info  { background: #0f2740; color: #58a6ff; border-color: #1c3a5e; }
  tr.evt.bad td  { background: rgba(248,81,73,.05); }
  tr.evt.ok td   { background: rgba(63,185,80,.05); }
  tr.evt.warn td { background: rgba(210,153,34,.05); }
  .foot { margin-top: 26px; color: #8b949e; font-size: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Ratio Essendi — Operations</h1>
  <p class="sub">Read-only view of cells, agents and decisions · generated ${esc(snapshot.generatedAt)}</p>

  <div class="stats">
    ${stat("Cells", snapshot.cells.length)}
    ${stat("Agents", snapshot.agents.length)}
    ${stat("Active agents", activeAgents, "ok")}
    ${stat("Replaced", replaced, "muted")}
    ${stat("Decisions", snapshot.events.length)}
    ${stat("Split-brain", splitBrain ? "YES" : "none", splitBrain ? "bad" : "ok")}
  </div>

  <h2>System cells</h2>
  <table>
    <thead><tr><th>ID</th><th>Name</th><th>Domain</th><th>Health</th><th>Control</th></tr></thead>
    <tbody>${snapshot.cells.map(cellRow).join("")}</tbody>
  </table>

  <h2>Agents</h2>
  <table>
    <thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Status</th><th>KPIs</th><th>Lineage</th></tr></thead>
    <tbody>${snapshot.agents.map(agentRow).join("")}</tbody>
  </table>

  <h2>Decision log</h2>
  <table>
    <thead><tr><th>#</th><th>Event</th><th>Entity</th><th>Transition</th><th>Reason</th></tr></thead>
    <tbody>${snapshot.events.map(eventRow).join("")}</tbody>
  </table>

  <p class="foot">Ratio Essendi · operational events only — no metaphysical actors (docs/08). No external action is taken from this view.</p>
</div>
</body>
</html>
`
}
