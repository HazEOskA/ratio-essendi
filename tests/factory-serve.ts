/**
 * Factory Core v0.1 — Operator Dashboard (port 7778)
 *
 * Pages:
 *   GET /              → /factory       — pipeline overview + signal input form
 *   GET /leads         → qualified leads
 *   GET /warehouse     → approved offers
 *   GET /trash         → rejected / failed items
 *   GET /events        → full event log
 *   GET /daily-review  → NO_CLIENT_TRAINING_MODE daily production review
 *
 * API:
 *   POST /api/signal  { raw: string }                   → run pipeline
 *   POST /api/action  { action: string, id: string }    → approve / reject
 *   POST /api/daily   { action, id?, feedback?, date? } → daily mission actions
 */
import { createServer } from "node:http"
import { join } from "node:path"
import { mkdirSync, existsSync } from "node:fs"
import {
  FactoryStore,
  runOfferAcquisitionForSignal,
  agentI,
  acceptDigital,
  reworkDigital,
  rejectDigital,
  warehouseDigital,
  createOrder,
  runAutonomousCycle,
} from "@ratio-essendi/factory-core"
import type {
  FactoryState,
  PipelineResult,
  DailyDigital,
  DailyDigitalDepartment,
  ClientOrder,
} from "@ratio-essendi/factory-core"
import { randomUUID } from "node:crypto"

// PORT is env-overridable so the HTTP test suite can run on a free port.
const PORT = Number(process.env["PORT"] ?? 7778)
const DATA_DIR = join(process.cwd(), ".factory-data")
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const store = new FactoryStore(DATA_DIR)

// Autopilot: bounded autonomous cycle (client orders → reworks → daily training).
// Everything it produces still stops at the operator review gate.
// The enabled flag persists in the store (settings.json) so a paused autopilot
// stays paused across restarts. lastCycleSummary is display-only diagnostics —
// intentionally runtime-only, a persisted value would be stale after restart.
let autopilotEnabled = store.getAutopilotEnabled()
let lastCycleSummary = "not run yet"

const VALID_DEPARTMENTS: readonly DailyDigitalDepartment[] = ["marketing", "sales", "delivery", "research", "qa"]

// --- HTML helpers ---

const E = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const badge = (text: string, cls: string): string =>
  `<span class="badge ${cls}">${E(text)}</span>`

const nav = (active: string): string => {
  const links: [string, string][] = [
    ["/", "Factory"],
    ["/orders", "Orders"],
    ["/leads", "Leads"],
    ["/warehouse", "Warehouse"],
    ["/trash", "Trash"],
    ["/events", "Events"],
    ["/daily-review", "Daily Review"],
  ]
  return `<nav class="nav">${links.map(([href, label]) => `<a href="${href}" class="${active === href ? "active" : ""}">${label}</a>`).join("")}</nav>`
}

const layout = (title: string, activePath: string, body: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factory Core — ${E(title)}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px 60px}
.nav{display:flex;gap:4px;margin-bottom:24px;border-bottom:1px solid #21262d;padding-bottom:8px}
.nav a{color:#8b949e;text-decoration:none;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:500}
.nav a:hover,.nav a.active{background:#21262d;color:#e6edf3}
h1{font-size:20px;font-weight:600;margin-bottom:4px}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#8b949e;margin:22px 0 8px}
.sub{color:#8b949e;font-size:13px;margin-bottom:18px}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.stat{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:8px 14px;min-width:90px}
.stat .v{font-size:18px;font-weight:600}
.stat .l{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e}
table{width:100%;border-collapse:collapse;background:#161b22;border:1px solid #21262d;border-radius:8px;overflow:hidden;margin-bottom:16px}
th,td{text-align:left;padding:7px 11px;border-bottom:1px solid #21262d;vertical-align:top}
th{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e;background:#11161d}
tr:last-child td{border-bottom:none}
.mono{font-family:ui-monospace,monospace;font-size:12px}
.dim{color:#8b949e}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid transparent}
.badge.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
.badge.warn{background:#34270a;color:#d29922;border-color:#4d3c14}
.badge.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.badge.muted{background:#21262d;color:#8b949e;border-color:#30363d}
.badge.info{background:#0f2740;color:#58a6ff;border-color:#1c3a5e}
.v.ok{color:#3fb950}.v.warn{color:#d29922}.v.bad{color:#f85149}.v.info{color:#58a6ff}
.form-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:18px}
.form-card label{display:block;font-size:12px;color:#8b949e;margin-bottom:4px}
textarea{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px/1.5 ui-sans-serif,system-ui,sans-serif;padding:8px 10px;resize:vertical;min-height:80px}
button{cursor:pointer;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;padding:5px 14px;font-size:13px;font-weight:600}
button.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
button.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.offer-pre{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:8px;font-size:12px;color:#c9d1d9;max-height:200px;overflow-y:auto;margin:4px 0}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.flash{background:#11321f;border:1px solid #234b2e;border-radius:6px;padding:10px 14px;margin-bottom:14px;color:#3fb950;font-size:13px}
.flash.bad{background:#3a1418;border-color:#5a1e23;color:#f85149}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:16px}
.agent-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:10px 12px}
.daily-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:14px}
.daily-card.draft{border-left:3px solid #58a6ff}
.daily-card.accepted{border-left:3px solid #3fb950}
.daily-card.needs_rework{border-left:3px solid #d29922}
.daily-card.rejected{border-left:3px solid #f85149}
.daily-card.archived{border-left:3px solid #8b949e}
.daily-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.daily-title{font-weight:600;font-size:14px}
.daily-content{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:10px;font-size:12px;color:#c9d1d9;max-height:320px;overflow-y:auto;margin:8px 0 10px}
.daily-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.feedback-area{display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px}
.score-bar{display:inline-block;width:60px;height:6px;border-radius:3px;background:#21262d;vertical-align:middle;margin-left:4px;overflow:hidden}
.score-fill{height:100%;border-radius:3px}
.agent-card .aid{font-weight:700;font-size:15px;color:#58a6ff;margin-right:6px}
.agent-card .aname{font-weight:600;font-size:13px}
.agent-card .arole{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.agent-card .afield{font-size:11.5px;color:#8b949e;margin-top:2px}
.agent-card .afield span{color:#c9d1d9}
</style>
</head>
<body>
<div class="wrap">
${nav(activePath)}
${body}
</div>
</body>
</html>`

// --- Page renderers ---

function renderFactory(state: FactoryState, flash?: string): string {
  const pending = state.approvalQueue.filter((a) => a.status === "pending")
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""

  const agentRows = [
    ["A", "Signal Intake Officer", "intake", "JobQueue signals", "IntakeBrief"],
    ["B", "ICP Qualifier", "qualification", "IntakeBriefs", "QualifiedLead / Trash"],
    ["C", "Lead Enricher", "enrichment", "QualifiedLeads", "EnrichedLead"],
    ["D", "Offer Strategist", "strategy", "EnrichedLeads", "OfferStrategy"],
    ["E", "Offer Builder", "offer-builder", "OfferStrategies", "DraftOffer"],
    ["F", "Offer Evaluator", "evaluation", "DraftOffers", "ScoredOffer"],
    ["G", "Offer Editor", "editing", "Failed ScoredOffers", "Revised DraftOffer"],
    ["H", "Approval Gatekeeper", "approval-gate", "Passed ScoredOffers", "ApprovalItem (pending)"],
    ["I", "Approval Monitor", "routing", "Approved items", "WarehouseItem"],
    ["J", "Succession Watcher", "succession", "All agents", "SuccessionFlag"],
    ["K", "Lineage Tracker", "lineage", "SuccessionFlags", "SuccessionBrief"],
    ["L", "Quality Auditor", "quality", "WarehouseItems", "QualityMetric"],
    ["M", "Performance Reporter", "reporting", "QualityMetrics", "Scorecard"],
    ["N", "Factory Director", "direction", "All stages", "CorrectionBrief"],
  ]

  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length
  const mode = openOrders > 0 ? "CLIENT_MODE" : "NO_CLIENT_TRAINING_MODE"

  return layout("Factory", "/", `
<h1>Factory Core v0.2</h1>
<p class="sub">
  Offer Acquisition Line + Client Orders + Daily Training — operator approval required before anything leaves ·
  ${badge(mode, openOrders > 0 ? "warn" : "info")} ·
  ${badge(autopilotEnabled ? "autopilot ON" : "autopilot OFF", autopilotEnabled ? "ok" : "muted")}
  <span class="dim" style="font-size:11px">last cycle: ${E(lastCycleSummary)}</span>
</p>
<form method="POST" action="/api/autopilot" style="margin-bottom:14px">
  <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
  <button type="submit">${autopilotEnabled ? "Pause Autopilot" : "Resume Autopilot"}</button>
</form>
${flashHtml}
<div class="stats">
  <div class="stat"><div class="v info">${state.signals.length}</div><div class="l">Signals</div></div>
  <div class="stat"><div class="v ok">${state.leads.filter((l) => l.qualified).length}</div><div class="l">Qualified</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Pending</div></div>
  <div class="stat"><div class="v ok">${state.warehouse.length}</div><div class="l">Warehouse</div></div>
  <div class="stat"><div class="v muted">${state.trash.length}</div><div class="l">Trash</div></div>
  <div class="stat"><div class="v info">${state.events.length}</div><div class="l">Events</div></div>
</div>

<div class="form-card">
  <label>Submit a Signal — describe the prospect or business problem (operator input only)</label>
  <form method="POST" action="/api/signal">
    <textarea name="raw" placeholder="e.g. B2B SaaS founder, seed stage, pipeline weak, MRR stuck at $30K. Need outbound offer." required></textarea>
    <div style="margin-top:8px"><button type="submit">Run Pipeline →</button></div>
  </form>
</div>

<h2>Approval Queue (${pending.length} pending)</h2>
${pending.length === 0 ? '<p class="dim">No offers awaiting approval.</p>' : pending.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge("pending", "warn")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">signal: ${E(item.signalId)} · score: ${item.finalOffer.score} · iterations: ${item.finalOffer.iterations}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div class="actions" style="margin-top:8px">
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="approve"><input type="hidden" name="id" value="${E(item.id)}"><button class="ok" type="submit">Approve → Warehouse</button></form>
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="reject"><input type="hidden" name="id" value="${E(item.id)}"><button class="bad" type="submit">Reject</button></form>
  </div>
</div>`).join("")}

<h2>Agent Registry</h2>
<div class="agents-grid">
${agentRows.map(([id, name, role, watch, next]) => `
<div class="agent-card">
  <div><span class="aid">${E(id)}</span><span class="aname">${E(name)}</span></div>
  <div class="arole">${E(role)}</div>
  <div class="afield">Watch: <span>${E(watch)}</span></div>
  <div class="afield">Next: <span>${E(next)}</span></div>
</div>`).join("")}
</div>`)
}

function renderLeads(state: FactoryState): string {
  const leads = state.leads.filter((l) => l.qualified)
  return layout("Leads", "/leads", `
<h1>Qualified Leads</h1>
<p class="sub">${leads.length} leads passed ICP qualification</p>
${leads.length === 0 ? '<p class="dim">No qualified leads yet. Submit a signal on the Factory page.</p>' : `
<table>
<thead><tr><th>Signal ID</th><th>Category</th><th>ICP Signals</th><th>Fit Score</th><th>Reasons</th></tr></thead>
<tbody>
${leads.map((l) => `<tr>
  <td class="mono">${E(l.signalId)}</td>
  <td>${E(l.brief.category)}</td>
  <td class="dim">${E(l.brief.icpSignals.join(", ") || "—")}</td>
  <td>${badge(String(l.fitScore), l.fitScore >= 0.75 ? "ok" : "warn")}</td>
  <td class="dim" style="font-size:12px">${E(l.qualificationReasons.join(" · "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`)
}

function renderWarehouse(state: FactoryState): string {
  const digitalAssets = state.dailyDigitals.filter((d) => d.location === "warehouse")
  return layout("Warehouse", "/warehouse", `
<h1>Warehouse — Approved Output</h1>
<p class="sub">${state.warehouse.length} offers + ${digitalAssets.length} digital assets approved by operator · <strong style="color:#f85149">sent: false — no auto-send</strong></p>

<h2>Approved Offers (${state.warehouse.length})</h2>
${state.warehouse.length === 0 ? '<p class="dim">No approved offers yet.</p>' : state.warehouse.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge("approved", "ok")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">signal: ${E(item.signalId)} · score: ${item.qualityScore} · approved: ${E(item.approvedAt.slice(0, 16).replace("T", " "))}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div style="margin-top:6px;font-size:12px;color:#8b949e">Agent I routed to warehouse. Operator action required to use this offer externally.</div>
</div>`).join("")}

<h2>Digital Assets (${digitalAssets.length})</h2>
${digitalAssets.length === 0 ? '<p class="dim">No digital assets in warehouse yet.</p>' : digitalAssets.map((d) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(d.department, "info")} ${badge(d.orderId ? "client order" : "training", d.orderId ? "warn" : "muted")}
    <strong>${E(d.title)}</strong>
    <span class="dim" style="font-size:12px;margin-left:8px">score: ${d.qualityScore} · rev ${d.revisionCount} · ${E(d.date)}</span>
  </div>
  <div class="offer-pre">${E(d.content)}</div>
</div>`).join("")}`)
}

function renderTrash(state: FactoryState): string {
  const trashedDigitals = state.dailyDigitals.filter((d) => d.location === "trash")
  return layout("Trash", "/trash", `
<h1>Trash — Disqualified &amp; Failed</h1>
<p class="sub">${state.trash.length} pipeline items + ${trashedDigitals.length} rejected digital assets</p>

<h2>Pipeline Items (${state.trash.length})</h2>
${state.trash.length === 0 ? '<p class="dim">No trash yet.</p>' : `
<table>
<thead><tr><th>ID</th><th>Signal ID</th><th>Reason</th><th>Trashed At</th></tr></thead>
<tbody>
${state.trash.map((t) => `<tr>
  <td class="mono">${E(t.id)}</td>
  <td class="mono">${E(t.signalId)}</td>
  <td>${E(t.reason)}</td>
  <td class="dim">${E(t.trashedAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}

<h2>Rejected Digital Assets (${trashedDigitals.length})</h2>
${trashedDigitals.length === 0 ? '<p class="dim">No rejected assets.</p>' : `
<table>
<thead><tr><th>ID</th><th>Dept</th><th>Title</th><th>Feedback</th><th>Date</th></tr></thead>
<tbody>
${trashedDigitals.map((d) => `<tr>
  <td class="mono">${E(d.id)}</td>
  <td>${badge(d.department, "muted")}</td>
  <td>${E(d.title)}</td>
  <td class="dim" style="font-size:12px">${E(d.operatorFeedback ?? "—")}</td>
  <td class="dim">${E(d.date)}</td>
</tr>`).join("")}
</tbody>
</table>`}`)
}

function renderDailyReview(state: FactoryState, flash?: string): string {
  const today = new Date().toISOString().slice(0, 10)
  // Training assets only — client-order deliverables are reviewed on /orders
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId)
  const todayItems = trainingItems.filter((d) => d.date === today)
  const pending = todayItems.filter((d) => d.status === "draft_ready" || d.status === "needs_rework")
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""

  const statusBadgeCls = (s: string): string => {
    if (s === "accepted") return "ok"
    if (s === "needs_rework") return "warn"
    if (s === "rejected") return "bad"
    if (s === "draft_ready") return "info"
    return "muted"
  }

  const deptBadgeCls = (d: string): string => {
    const m: Record<string, string> = { marketing: "info", sales: "ok", delivery: "warn", research: "muted", qa: "bad" }
    return m[d] ?? "muted"
  }

  const scoreColor = (s: number): string => s >= 0.75 ? "#3fb950" : s >= 0.5 ? "#d29922" : "#f85149"

  const renderCard = (item: DailyDigital): string => {
    const isActionable = item.status === "draft_ready" || item.status === "needs_rework"
    const scoreBar = `<span class="score-bar"><span class="score-fill" style="width:${Math.round(item.qualityScore * 100)}%;background:${scoreColor(item.qualityScore)}"></span></span>`
    const feedbackNote = item.operatorFeedback
      ? `<div style="font-size:12px;color:#d29922;margin-top:4px">Feedback: ${E(item.operatorFeedback)}</div>`
      : ""
    const revNote = item.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${item.revisionCount}</span>` : ""

    const actions = isActionable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily" style="display:flex;gap:6px">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Accept</button>
  </form>
  <form method="POST" action="/api/daily" style="display:flex;gap:6px;align-items:flex-start">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">→ Warehouse</button>
  </form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Feedback for rework..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="warn" type="submit" style="align-self:flex-start">Needs Rework</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Reason for rejection..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Reject to Trash</button>
    </form>
  </div>
</div>` : `<div class="dim" style="font-size:12px">Status: ${E(item.status)}${item.location === "warehouse" ? " · in warehouse" : ""}</div>`

    return `<div class="daily-card ${item.status === "draft_ready" ? "draft" : item.status}">
  <div class="daily-header">
    ${badge(item.department, deptBadgeCls(item.department))}
    ${badge(item.status, statusBadgeCls(item.status))}
    <span class="daily-title">${E(item.title)}</span>
    ${revNote}
    <span class="dim" style="font-size:11px">score ${item.qualityScore}${scoreBar}</span>
    <span class="dim" style="font-size:11px">${E(item.type)}</span>
  </div>
  ${feedbackNote}
  <div class="daily-content">${E(item.content)}</div>
  ${actions}
</div>`
  }

  // All history (older dates) collapsed
  const olderItems = trainingItems.filter((d) => d.date !== today)
  const olderDates = [...new Set(olderItems.map((d) => d.date))].sort().reverse()

  return layout("Daily Review", "/daily-review", `
<h1>Daily Review — NO_CLIENT_TRAINING_MODE</h1>
<p class="sub">5 digital deliverables per day · operator reviews each · feedback influences next run</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${todayItems.length}</div><div class="l">Today</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Pending Review</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.status === "accepted").length}</div><div class="l">Accepted</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">In Warehouse</div></div>
  <div class="stat"><div class="v bad">${trainingItems.filter((d) => d.status === "rejected").length}</div><div class="l">Rejected</div></div>
  <div class="stat"><div class="v muted">${state.feedbackEvents.length}</div><div class="l">Feedback Events</div></div>
</div>

${todayItems.length === 0 ? `
<div class="form-card">
  <p style="margin-bottom:10px;color:#8b949e">No missions run for today (${today}).</p>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="action" value="run">
    <input type="hidden" name="date" value="${today}">
    <button type="submit">Run Today's 5 Missions →</button>
  </form>
</div>` : `
<h2>Today — ${today} (${todayItems.length} deliverables)</h2>
${todayItems.map(renderCard).join("")}
`}

${olderDates.length > 0 ? `
<h2>Previous Days</h2>
<table>
<thead><tr><th>Date</th><th>Department</th><th>Title</th><th>Status</th><th>Score</th><th>Location</th></tr></thead>
<tbody>
${olderDates.flatMap((date) =>
  olderItems
    .filter((d) => d.date === date)
    .map((d) => `<tr>
  <td class="dim">${E(d.date)}</td>
  <td>${badge(d.department, "muted")}</td>
  <td>${E(d.title)}</td>
  <td>${badge(d.status, d.status === "accepted" ? "ok" : d.status === "rejected" ? "bad" : "warn")}</td>
  <td class="mono">${d.qualityScore}</td>
  <td class="dim">${E(d.location)}</td>
</tr>`)
).join("")}
</tbody>
</table>` : ""}

${state.feedbackEvents.length > 0 ? `
<h2>Feedback Events — Constraints for Next Run</h2>
<table>
<thead><tr><th>Time</th><th>Dept</th><th>Action</th><th>Feedback</th></tr></thead>
<tbody>
${[...state.feedbackEvents].reverse().slice(0, 20).map((e) => `<tr>
  <td class="mono dim">${E(e.timestamp.slice(0, 16).replace("T", " "))}</td>
  <td>${badge(e.department, "muted")}</td>
  <td>${badge(e.action, e.action === "accepted" || e.action === "warehoused" ? "ok" : e.action === "needs_rework" ? "warn" : "bad")}</td>
  <td class="dim" style="font-size:12px">${E(e.feedback ?? "—")}</td>
</tr>`).join("")}
</tbody>
</table>` : ""}`)
}

function renderOrders(state: FactoryState, flash?: string): string {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""
  const orders = [...state.orders].reverse()
  const open = state.orders.filter((o) => o.status === "new" || o.status === "in_production")
  const ready = state.orders.filter((o) => o.status === "ready_for_review")

  const orderBadgeCls = (s: ClientOrder["status"]): string => {
    if (s === "approved" || s === "closed") return "ok"
    if (s === "ready_for_review") return "warn"
    if (s === "rejected") return "bad"
    return "info"
  }

  const deliverableBlock = (order: ClientOrder): string => {
    const d = order.deliverableId ? state.dailyDigitals.find((x) => x.id === order.deliverableId) : undefined
    if (!d) return '<div class="dim" style="font-size:12px">No deliverable yet — autopilot will produce it within a minute.</div>'
    const reviewable = d.status === "draft_ready"
    return `
<div class="daily-content">${E(d.content)}</div>
<div class="dim" style="font-size:11px;margin-bottom:8px">deliverable: ${E(d.id)} · score ${d.qualityScore} · rev ${d.revisionCount} · status ${E(d.status)}</div>
${reviewable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily"><input type="hidden" name="action" value="warehouse"><input type="hidden" name="id" value="${E(d.id)}"><button class="ok" type="submit">Approve → Warehouse</button></form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="What should change..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14;align-self:flex-start">Request Rework</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Reason for rejection..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Reject Order Output</button>
    </form>
  </div>
</div>` : ""}`
  }

  return layout("Orders", "/orders", `
<h1>Client Orders</h1>
<p class="sub">Real work — a client order always takes priority over daily training. Nothing is delivered without operator approval.</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${state.orders.length}</div><div class="l">Total</div></div>
  <div class="stat"><div class="v ${open.length ? "warn" : "ok"}">${open.length}</div><div class="l">In Production</div></div>
  <div class="stat"><div class="v ${ready.length ? "warn" : "ok"}">${ready.length}</div><div class="l">Ready for Review</div></div>
  <div class="stat"><div class="v ok">${state.orders.filter((o) => o.status === "approved" || o.status === "closed").length}</div><div class="l">Approved</div></div>
  <div class="stat"><div class="v bad">${state.orders.filter((o) => o.status === "rejected").length}</div><div class="l">Rejected</div></div>
</div>

<div class="form-card">
  <label>New client order — who is it for and what do they need?</label>
  <form method="POST" action="/api/order">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Client name / company" required style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <input name="contact" placeholder="Contact (optional)" style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <select name="department" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
        <option value="marketing">Marketing</option>
        <option value="sales">Sales</option>
        <option value="delivery" selected>Delivery</option>
        <option value="research">Research</option>
        <option value="qa">QA</option>
      </select>
    </div>
    <textarea name="description" placeholder="e.g. Landing page copy for a construction company selling prefab garages — needs pricing section and a lead form CTA" required></textarea>
    <div style="margin-top:8px"><button type="submit">Accept Order → Produce Now</button></div>
  </form>
</div>

<h2>Orders (${orders.length})</h2>
${orders.length === 0 ? '<p class="dim">No orders yet. When there are no orders, the factory runs 5 random daily training missions instead.</p>' : orders.map((o) => `
<div class="daily-card ${o.status === "ready_for_review" ? "draft" : o.status === "approved" || o.status === "closed" ? "accepted" : o.status === "rejected" ? "rejected" : "needs_rework"}">
  <div class="daily-header">
    ${badge(o.status, orderBadgeCls(o.status))}
    ${badge(o.department, "info")}
    <span class="daily-title">${E(o.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(o.id)}</span>
    ${o.taskType ? `<span class="dim" style="font-size:11px">task: ${E(o.taskType)}</span>` : ""}
    ${o.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${o.revisionCount}</span>` : ""}
  </div>
  <div style="font-size:12.5px;color:#c9d1d9;margin-bottom:8px">"${E(o.description)}"</div>
  ${o.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-bottom:6px">Last feedback: ${E(o.operatorFeedback)}</div>` : ""}
  ${deliverableBlock(o)}
</div>`).join("")}`)
}

function renderEvents(state: FactoryState): string {
  const events = [...state.events].reverse()
  return layout("Events", "/events", `
<h1>Event Log</h1>
<p class="sub">${events.length} events — all pipeline decisions recorded</p>
${events.length === 0 ? '<p class="dim">No events yet.</p>' : `
<table>
<thead><tr><th>Agent</th><th>Event</th><th>Signal</th><th>Detail</th><th>Time</th></tr></thead>
<tbody>
${events.map((e) => {
  const cls = /fail|disqualified|bad|rejected/.test(e.eventType) ? "bad"
    : /qualified|passed|approved|warehouse/.test(e.eventType) ? "ok"
    : /required|revised/.test(e.eventType) ? "warn" : "info"
  return `<tr>
  <td>${badge(e.agentId, "info")}</td>
  <td>${badge(e.eventType, cls)}</td>
  <td class="mono dim">${E(e.signalId ?? "—")}</td>
  <td class="dim" style="font-size:12px">${E(e.detail)}</td>
  <td class="dim mono" style="font-size:11px">${E(e.timestamp.slice(11, 19))}</td>
</tr>`
}).join("")}
</tbody>
</table>`}`)
}

// --- Request handler ---

async function readBody(req: import("node:http").IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    let body = ""
    req.on("data", (chunk: Buffer) => { body += chunk.toString() })
    req.on("end", () => {
      const params: Record<string, string> = {}
      if (body.startsWith("{")) {
        try {
          Object.assign(params, JSON.parse(body) as Record<string, string>)
        } catch { /* ignore */ }
      } else {
        for (const pair of body.split("&")) {
          const [k, v] = pair.split("=")
          if (k) params[decodeURIComponent(k)] = decodeURIComponent((v ?? "").replace(/\+/g, " "))
        }
      }
      resolve(params)
    })
  })
}

function html(res: import("node:http").ServerResponse, body: string, status = 200): void {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" })
  res.end(body)
}

function redirect(res: import("node:http").ServerResponse, to: string): void {
  res.writeHead(302, { Location: to })
  res.end()
}

function json(res: import("node:http").ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(data))
}

const server = createServer(async (req, res) => {
  const url = req.url ?? "/"
  const method = req.method ?? "GET"
  const state = store.snapshot()

  try {
    if (method === "GET") {
      if (url === "/" || url === "/factory") {
        return html(res, renderFactory(state))
      }
      if (url === "/leads") return html(res, renderLeads(state))
      if (url === "/warehouse") return html(res, renderWarehouse(state))
      if (url === "/trash") return html(res, renderTrash(state))
      if (url === "/events") return html(res, renderEvents(state))
      if (url === "/daily-review") return html(res, renderDailyReview(state))
      if (url === "/orders") return html(res, renderOrders(state))
      return html(res, "<h1>404</h1>", 404)
    }

    if (method === "POST" && url === "/api/signal") {
      const params = await readBody(req)
      const raw = (params["raw"] ?? "").trim()
      if (!raw) {
        const errState = store.snapshot()
        return html(res, renderFactory(errState, "Error: signal text is required"))
      }
      let result: PipelineResult
      try {
        result = await runOfferAcquisitionForSignal(raw, store)
      } catch (err) {
        const errState = store.snapshot()
        return html(res, renderFactory(errState, `Error: ${String(err)}`))
      }
      const newState = store.snapshot()
      const flash = result.status === "awaiting_approval"
        ? `Pipeline complete — offer awaiting your approval (${result.approval?.id})`
        : result.status === "disqualified"
        ? `Signal disqualified — does not match ICP`
        : `Pipeline failed after evaluation`
      return html(res, renderFactory(newState, flash))
    }

    if (method === "POST" && url === "/api/action") {
      const params = await readBody(req)
      const action = params["action"] ?? ""
      const id = params["id"] ?? ""
      const item = store.getApprovalItem(id)

      if (action === "approve" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "approved", decidedAt: new Date().toISOString() })
        const updated = store.getApprovalItem(id)!
        const warehouseItem = agentI(updated)
        store.addWarehouseItem(warehouseItem)
        store.addEvent({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          agentId: "I",
          eventType: "approval.granted",
          signalId: item.signalId,
          detail: `Operator approved ${id} → warehouse`,
        })
      } else if (action === "reject" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "rejected", decidedAt: new Date().toISOString() })
        store.addTrashItem({
          id: `trash-rej-${id}`,
          signalId: item.signalId,
          reason: `Operator rejected offer ${id}`,
          trashedAt: new Date().toISOString(),
        })
        store.addEvent({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          agentId: "H",
          eventType: "approval.rejected",
          signalId: item.signalId,
          detail: `Operator rejected ${id}`,
        })
      }

      // Support both form POST (redirect) and JSON POST
      const accept = req.headers["accept"] ?? ""
      if (accept.includes("application/json")) {
        return json(res, { ok: true })
      }
      return redirect(res, "/")
    }

    if (method === "POST" && url === "/api/daily") {
      const params = await readBody(req)
      const action = params["action"] ?? ""
      const id = params["id"] ?? ""
      const feedback = (params["feedback"] ?? "").trim()
      const date = params["date"] ?? new Date().toISOString().slice(0, 10)

      // Order deliverables review here too — sync the order status afterwards
      // and send the operator back to /orders instead of /daily-review.
      const digitalBefore = store.getDailyDigital(id)
      const orderId = digitalBefore?.orderId
      const respond = (flash: string) =>
        orderId
          ? html(res, renderOrders(store.snapshot(), flash))
          : html(res, renderDailyReview(store.snapshot(), flash))
      const syncOrder = (status: "approved" | "rejected" | "in_production", fb?: string) => {
        if (!orderId) return
        store.updateOrder(orderId, {
          status,
          ...(fb ? { operatorFeedback: fb } : {}),
          updatedAt: new Date().toISOString(),
        })
      }

      if (action === "run") {
        try {
          const result = await runAutonomousCycle(store, date)
          lastCycleSummary = `${result.mode}: training=${result.trainingCreated} orders=${result.ordersProduced.length} reworks=${result.reworksRegenerated.length}`
          return html(res, renderDailyReview(store.snapshot(), `Cycle done — ${lastCycleSummary}`))
        } catch (err) {
          return html(res, renderDailyReview(store.snapshot(), `Error: ${String(err)}`))
        }
      }
      if (action === "accept" && id) {
        acceptDigital(store, id)
        syncOrder("approved")
        return respond("Accepted.")
      }
      if (action === "rework" && id && feedback) {
        reworkDigital(store, id, feedback)
        syncOrder("in_production", feedback)
        return respond("Marked for rework — the autopilot will regenerate it with your feedback.")
      }
      if (action === "reject" && id && feedback) {
        rejectDigital(store, id, feedback)
        syncOrder("rejected", feedback)
        return respond("Rejected and moved to trash.")
      }
      if (action === "warehouse" && id) {
        warehouseDigital(store, id)
        syncOrder("approved")
        return respond("Sent to Warehouse.")
      }
      return respond("Error: unknown action or missing id/feedback.")
    }

    if (method === "POST" && url === "/api/order") {
      const params = await readBody(req)
      const clientName = (params["clientName"] ?? "").trim()
      const description = (params["description"] ?? "").trim()
      const contact = (params["contact"] ?? "").trim()
      const departmentRaw = (params["department"] ?? "delivery").trim()
      // Reject unknown departments before anything is created — no order, no event.
      if (!(VALID_DEPARTMENTS as readonly string[]).includes(departmentRaw)) {
        return json(res, { error: "invalid department", received: departmentRaw, allowed: VALID_DEPARTMENTS }, 400)
      }
      const department = departmentRaw as DailyDigitalDepartment
      if (!clientName || !description) {
        return html(res, renderOrders(store.snapshot(), "Error: client name and description are required"))
      }
      const order = createOrder(store, {
        clientName,
        description,
        department,
        ...(contact ? { contact } : {}),
      })
      // Produce immediately — the client should not wait for the next timer tick.
      const result = await runAutonomousCycle(store)
      lastCycleSummary = `${result.mode}: orders=${result.ordersProduced.length}`
      return html(res, renderOrders(store.snapshot(), `Order ${order.id} accepted and produced — review the deliverable below.`))
    }

    if (method === "POST" && url === "/api/autopilot") {
      const params = await readBody(req)
      autopilotEnabled = params["action"] !== "off"
      store.setAutopilotEnabled(autopilotEnabled)
      store.addEvent({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: "N",
        eventType: autopilotEnabled ? "factory.autopilot_on" : "factory.autopilot_off",
        detail: `Operator turned autopilot ${autopilotEnabled ? "on" : "off"}`,
      })
      return html(res, renderFactory(store.snapshot(), `Autopilot ${autopilotEnabled ? "resumed" : "paused"}.`))
    }

    html(res, "<h1>404</h1>", 404)
  } catch (err) {
    console.error(err)
    html(res, `<pre>500: ${E(String(err))}</pre>`, 500)
  }
})

// --- Autopilot loop: client orders first, training when idle, always bounded ---

async function autopilotTick(): Promise<void> {
  if (!autopilotEnabled) return
  try {
    const r = await runAutonomousCycle(store)
    lastCycleSummary = `${r.mode}: training=${r.trainingCreated} orders=${r.ordersProduced.length} reworks=${r.reworksRegenerated.length}`
    if (r.ordersProduced.length + r.reworksRegenerated.length + r.trainingCreated > 0) {
      console.log(`[autopilot] ${lastCycleSummary}`)
    }
  } catch (err) {
    console.error("[autopilot] cycle failed:", err)
  }
}

setInterval(autopilotTick, 60_000)

server.listen(PORT, () => {
  console.log(`\nFactory Core v0.2 — http://localhost:${PORT}`)
  console.log("  / or /factory  — pipeline overview + signal form + autopilot toggle")
  console.log("  /orders        — client orders: intake, production, review")
  console.log("  /leads         — qualified leads")
  console.log("  /warehouse     — approved offers + digital assets")
  console.log("  /trash         — disqualified / failed / rejected")
  console.log("  /events        — full event log")
  console.log("  /daily-review  — NO_CLIENT_TRAINING_MODE daily review")
  console.log("\nAutopilot: ON (60s cycle) — orders → reworks → 5 random daily training missions.")
  console.log("Press Ctrl+C to stop.\n")
  void autopilotTick()
})
