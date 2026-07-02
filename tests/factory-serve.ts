/**
 * Factory Core v0.1 — Operator Dashboard (port 7778)
 *
 * Pages:
 *   GET /admin        → boss/operator command center
 *   GET /operator     → /admin alias
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
  FactoryWorkRun,
  MissionAgentId,
  FactoryWorkRunTrigger,
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
    ["/admin", "Admin"],
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
.admin-shell{position:relative;display:flex;flex-direction:column;gap:14px}
.admin-shell:before{content:"";position:absolute;inset:-18px -16px auto;height:220px;background:linear-gradient(135deg,rgba(255,45,209,.16),rgba(0,245,255,.12) 46%,rgba(255,184,0,.08));filter:blur(18px);opacity:.75;pointer-events:none}
.admin-hero,.admin-panel,.admin-card,.admin-action{position:relative;background:rgba(13,17,23,.88);border:1px solid rgba(0,245,255,.28);box-shadow:0 0 0 1px rgba(255,45,209,.08),0 18px 46px rgba(0,0,0,.28)}
.admin-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(230px,.65fr);gap:18px;border-radius:8px;padding:18px;overflow:hidden}
.admin-hero:after{content:"OSA//CTRL";position:absolute;right:14px;top:8px;color:rgba(255,45,209,.18);font:800 44px/1 ui-monospace,monospace;letter-spacing:4px;transform:rotate(-4deg)}
.admin-kicker{color:#00f5ff;font:700 11px/1 ui-monospace,monospace;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:8px}
.admin-title{font-size:30px;line-height:1.05;font-weight:800;margin:0 0 8px;color:#f5fbff;text-shadow:0 0 22px rgba(0,245,255,.24)}
.admin-sub{max-width:700px;color:#a9b7c5;font-size:13px}
.admin-mode{display:flex;flex-direction:column;gap:8px;align-items:flex-start;justify-content:flex-end}
.admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.admin-card{border-radius:8px;padding:12px;min-height:86px}
.admin-card .v{font-size:24px;font-weight:800}
.admin-card .l{font-size:10px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.7px;margin-top:2px}
.admin-panel{border-radius:8px;padding:14px}
.admin-subpanel{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:12px}
.admin-panel.hot{border-color:rgba(255,184,0,.5);background:linear-gradient(135deg,rgba(52,39,10,.82),rgba(13,17,23,.92))}
.admin-panel.danger{border-color:rgba(248,81,73,.55)}
.admin-panel h2{margin-top:0;color:#f5fbff}
.admin-action{border-radius:8px;padding:14px;border-color:rgba(255,45,209,.28)}
.admin-action strong{display:block;font-size:16px;margin-bottom:4px;color:#fff}
.admin-two{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:14px}
.admin-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.admin-list{display:flex;flex-direction:column;gap:10px}
.admin-order{background:#10151d;border:1px solid #273241;border-left:3px solid #00f5ff;border-radius:8px;padding:12px}
.admin-order.ready{border-left-color:#ffb800}.admin-order.done{border-left-color:#3fb950}.admin-order.bad{border-left-color:#f85149}
.admin-input-row{display:grid;grid-template-columns:1fr 1fr 150px;gap:8px;margin-bottom:8px}
.admin-input-row input,.admin-input-row select,.admin-panel input,.admin-panel select{width:100%;background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,system-ui,sans-serif;padding:7px 10px}
.admin-panel textarea{background:#0a0f16;border-color:#334155}
.admin-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.admin-actions form{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.admin-actions input{background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:12px ui-sans-serif,system-ui,sans-serif;padding:6px 8px;min-width:190px}
.admin-preview{white-space:pre-wrap;background:#070b11;border:1px solid #263241;border-radius:6px;padding:9px;font-size:12px;color:#dbe7f0;max-height:180px;overflow:auto;margin-top:8px}
.admin-table{background:rgba(10,15,22,.88)}
.admin-safety{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.admin-safety ul{margin:0;padding-left:18px;color:#a9b7c5;font-size:12.5px}
.admin-safety li{margin:4px 0}
.workroom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.work-agent{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;min-height:138px}
.work-agent.active{border-color:rgba(0,245,255,.55)}.work-agent.waiting{border-color:rgba(255,184,0,.45)}.work-agent.failed{border-color:rgba(248,81,73,.55)}
.work-agent .name{font-weight:800;color:#f5fbff;margin-bottom:4px}
.work-agent .meta{font-size:11px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.work-agent .line{font-size:12px;color:#dbe7f0;margin-top:5px}
.timeline{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.timeline-step{background:#070b11;border:1px solid #263241;border-left:3px solid #00f5ff;border-radius:8px;padding:10px}
.timeline-step.failed{border-left-color:#f85149}.timeline-step.skipped{border-left-color:#8b949e}
.idle-box{background:rgba(52,39,10,.55);border:1px solid rgba(255,184,0,.42);border-radius:8px;padding:12px;color:#f0d28a}
.idle-box .kicker{font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:#d29922;margin-bottom:4px}
.run-drill{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:8px 12px;margin-bottom:8px}
.run-drill summary{cursor:pointer;font-size:12.5px;color:#dbe7f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.run-drill[open]{border-color:rgba(0,245,255,.45)}
.run-drill .drill-body{margin-top:8px;border-top:1px solid #263241;padding-top:8px}
.wait-items{margin:8px 0 0;padding-left:18px;color:#a9b7c5;font-size:12px}
.wait-items li{margin:3px 0}
.wait-items a{color:#58a6ff}
.admin-table a{color:#58a6ff;text-decoration:none}
@media (max-width:860px){
  .admin-hero,.admin-two,.admin-safety{grid-template-columns:1fr}
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .admin-input-row{grid-template-columns:1fr}
}
@media (max-width:560px){
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:1fr}
  .admin-title{font-size:24px}
  .admin-hero{padding:14px}
}
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

type OpsWaiting = {
  ordersReadyForReview: number
  trainingDrafts: number
  needsRework: number
  pendingApprovals: number
}

type OpsView = {
  mode: "CLIENT_MODE" | "REWORK_MODE" | "NO_CLIENT_TRAINING_MODE" | "IDLE"
  nextActionTitle: string
  nextActionDetail: string
  standingStill: string
  waiting: OpsWaiting
  trainingToday: number
}

/**
 * Single source of truth for "what is the factory doing and why" — used by the
 * admin cockpit AND the read-only debug endpoints, so page and JSON never drift.
 */
function deriveOps(state: FactoryState): OpsView {
  const today = new Date().toISOString().slice(0, 10)
  // Mirror the autopilot's own arbitration: an open order whose deliverable is
  // flagged needs_rework is handled by the rework stage, not order production.
  const openOrders = state.orders.filter((o) => {
    if (o.status !== "new" && o.status !== "in_production") return false
    const d = o.deliverableId ? state.dailyDigitals.find((x) => x.id === o.deliverableId) : undefined
    return d?.status !== "needs_rework"
  }).length
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId)
  const trainingToday = trainingItems.filter((d) => d.date === today).length
  const trainingDrafts = trainingItems.filter((d) => d.status === "draft_ready").length
  const needsRework = state.dailyDigitals.filter((d) => d.status === "needs_rework").length
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length
  const waiting: OpsWaiting = { ordersReadyForReview: readyOrders, trainingDrafts, needsRework, pendingApprovals }

  const mode: OpsView["mode"] = openOrders > 0
    ? "CLIENT_MODE"
    : needsRework > 0
      ? "REWORK_MODE"
      : trainingToday < 5
        ? "NO_CLIENT_TRAINING_MODE"
        : "IDLE"

  const s = (n: number) => (n === 1 ? "" : "s")
  let standingStill: string
  if (!autopilotEnabled) {
    standingStill =
      "Factory is paused because autopilot is OFF. It will not self-run cycles until resumed." +
      (readyOrders + trainingDrafts > 0
        ? ` Meanwhile ${readyOrders} client output${s(readyOrders)} and ${trainingDrafts} training draft${s(trainingDrafts)} are pending review.`
        : "")
  } else if (openOrders > 0) {
    standingStill = `Factory is producing: ${openOrders} open client order${s(openOrders)} in the pipeline.`
  } else if (needsRework > 0) {
    standingStill = `Factory is waiting for the rework cycle to regenerate ${needsRework} flagged output${s(needsRework)}.`
  } else if (readyOrders + trainingDrafts + pendingApprovals > 0) {
    standingStill =
      `Factory is waiting for operator review: ${readyOrders} client output${s(readyOrders)} and ${trainingDrafts} training draft${s(trainingDrafts)} are pending.` +
      (pendingApprovals > 0 ? ` Plus ${pendingApprovals} pipeline approval item${s(pendingApprovals)}.` : "")
  } else if (trainingToday >= 5) {
    standingStill = "Factory is idle because today's training quota is complete and no client orders are open."
  } else {
    standingStill = `Factory is idle: training quota ${trainingToday}/5 for today — run a training cycle or wait for the next autopilot tick.`
  }

  // Pending operator-review queues always outrank the paused-autopilot hint:
  // resuming autopilot clears none of them, so telling the operator to resume
  // while work sits at a review gate would be a misleading next action.
  const [nextActionTitle, nextActionDetail]: [string, string] = readyOrders > 0
    ? ["Review client order", `${readyOrders} client order${s(readyOrders)} waiting for approval, rework, or rejection.`]
    : needsRework > 0
      ? ["Wait for or run rework cycle", `${needsRework} item${s(needsRework)} marked needs_rework.`]
      : trainingDrafts > 0
        ? ["Review training assets", `${trainingDrafts} training draft${s(trainingDrafts)} ready for operator review.`]
        : pendingApprovals > 0
          ? ["Review pipeline approval item", `${pendingApprovals} approval item${s(pendingApprovals)} pending.`]
          : !autopilotEnabled
            ? ["Resume autopilot or keep paused intentionally", "The persisted autopilot setting is OFF and nothing is waiting for review."]
            : trainingToday < 5 && openOrders === 0
              ? ["Run training cycle", `Today has ${trainingToday}/5 training assets.`]
              : ["System is idle / no urgent action", "No client order or training asset needs immediate attention."]

  return { mode, nextActionTitle, nextActionDetail, standingStill, waiting, trainingToday }
}

function renderAdmin(state: FactoryState, flash?: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production")
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review")
  const approvedOrders = state.orders.filter((o) => o.status === "approved" || o.status === "closed")
  const rejectedOrders = state.orders.filter((o) => o.status === "rejected")
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId)
  const todayTraining = trainingItems.filter((d) => d.date === today)
  const pendingTraining = trainingItems.filter((d) => d.status === "draft_ready")
  const acceptedTraining = trainingItems.filter((d) => d.status === "accepted")
  const rejectedTraining = trainingItems.filter((d) => d.status === "rejected")
  const reworkItems = state.dailyDigitals.filter((d) => d.status === "needs_rework")
  const warehouseAssets = state.dailyDigitals.filter((d) => d.location === "warehouse")
  const trashCount = state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length
  const pendingApprovalCount = state.approvalQueue.filter((a) => a.status === "pending").length
  const pendingReviewCount = readyOrders.length + pendingTraining.length + reworkItems.length + pendingApprovalCount
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""

  const ops = deriveOps(state)
  const mode = ops.mode
  const nextAction: [string, string] = [ops.nextActionTitle, ops.nextActionDetail]

  const orderBadgeCls = (s: ClientOrder["status"]): string => {
    if (s === "approved" || s === "closed") return "ok"
    if (s === "ready_for_review") return "warn"
    if (s === "rejected") return "bad"
    return "info"
  }

  const itemBadgeCls = (s: string): string => {
    if (s === "accepted") return "ok"
    if (s === "needs_rework") return "warn"
    if (s === "rejected") return "bad"
    if (s === "draft_ready") return "info"
    return "muted"
  }

  const eventBadgeCls = (eventType: string): string => {
    if (/rejected|off/.test(eventType)) return "bad"
    if (/warehouse|approved|accepted|on/.test(eventType)) return "ok"
    if (/rework|cycle/.test(eventType)) return "warn"
    return "info"
  }

  const preview = (text: string, max = 420): string =>
    text.length > max ? `${text.slice(0, max)}...` : text

  const deliverableFor = (order: ClientOrder): DailyDigital | undefined =>
    order.deliverableId ? state.dailyDigitals.find((d) => d.id === order.deliverableId) : undefined

  const renderOrderActions = (d?: DailyDigital): string => {
    if (!d || d.status !== "draft_ready") return ""
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(d.id)}">
    <button class="ok" type="submit">Approve -> Warehouse</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Rework note..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Request Rework</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Reject reason..." required>
    <button class="bad" type="submit">Reject</button>
  </form>
</div>`
  }

  const renderOrder = (order: ClientOrder): string => {
    const d = deliverableFor(order)
    const done = order.status === "approved" || order.status === "closed"
    const cls = order.status === "ready_for_review" ? "ready" : done ? "done" : order.status === "rejected" ? "bad" : ""
    return `
<div class="admin-order ${cls}">
  <div class="daily-header">
    ${badge(order.status, orderBadgeCls(order.status))}
    ${badge(order.department, "info")}
    <span class="daily-title">${E(order.clientName)}</span>
    ${order.taskType ? `<span class="dim" style="font-size:11px">task: ${E(order.taskType)}</span>` : ""}
    <span class="dim" style="font-size:11px">rev ${order.revisionCount}</span>
  </div>
  <div class="dim" style="font-size:12px;margin-bottom:5px">contact: ${E(order.contact ?? "not set")}</div>
  <div style="font-size:12.5px;color:#dbe7f0">${E(order.description)}</div>
  ${d ? `
    <div class="admin-preview">${E(preview(d.content))}</div>
    <div class="dim" style="font-size:11px;margin-top:6px">deliverable ${E(d.id)} · by ${E(d.createdByAgentId)} · score ${d.qualityScore} · rev ${d.revisionCount} · ${E(d.status)} · ${E(d.taskType ?? d.type)}</div>
    ${d.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:4px;color:#d29922">operator feedback: ${E(d.operatorFeedback)}${d.revisionCount > 0 ? ` (applied in rev ${d.revisionCount})` : ""}</div>` : ""}
    ${renderOrderActions(d)}
  ` : '<div class="dim" style="font-size:12px;margin-top:8px">No deliverable yet.</div>'}
</div>`
  }

  const orderGroup = (title: string, items: ClientOrder[], empty: string, anchorId?: string): string => `
<div class="admin-panel"${anchorId ? ` id="${anchorId}"` : ""}>
  <h2>${E(title)} (${items.length})</h2>
  <div class="admin-list">
    ${items.length === 0 ? `<p class="dim">${E(empty)}</p>` : [...items].reverse().map(renderOrder).join("")}
  </div>
</div>`

  const renderTrainingActions = (item: DailyDigital): string => {
    if (item.status !== "draft_ready" && item.status !== "needs_rework") return ""
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Accept</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Warehouse</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Rework note..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Rework</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Reject reason..." required>
    <button class="bad" type="submit">Reject</button>
  </form>
</div>`
  }

  const renderTrainingItem = (item: DailyDigital): string => `
<div class="admin-order ${item.status === "rejected" ? "bad" : item.status === "accepted" ? "done" : item.status === "needs_rework" ? "ready" : ""}">
  <div class="daily-header">
    ${badge(item.status, itemBadgeCls(item.status))}
    ${badge(item.department, "info")}
    ${badge("training", "muted")}
    <span class="daily-title">${E(item.title)}</span>
    <span class="dim" style="font-size:11px">${E(item.taskType ?? item.type)} · by ${E(item.createdByAgentId)} · score ${item.qualityScore} · rev ${item.revisionCount} · ${E(item.date)}</span>
  </div>
  <div class="dim mono" style="font-size:11px;margin-top:4px">output ${E(item.id)}</div>
  <div class="admin-preview">${E(preview(item.content, 300))}</div>
  ${item.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:6px;color:#d29922">feedback: ${E(item.operatorFeedback)}${item.revisionCount > 0 ? ` (applied in rev ${item.revisionCount})` : ""}</div>` : ""}
  ${renderTrainingActions(item)}
</div>`

  const latestWarehouse = [...warehouseAssets]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  const criticalEvents = [...state.events]
    .reverse()
    .filter((e) =>
      e.eventType.startsWith("order.") ||
      e.eventType === "factory.cycle" ||
      e.eventType.startsWith("daily.") ||
      e.eventType.startsWith("approval.") ||
      e.eventType === "factory.autopilot_on" ||
      e.eventType === "factory.autopilot_off",
    )
    .slice(0, 18)

  type WorkroomAgentId = MissionAgentId | "N"
  const workroomAgents: WorkroomAgentId[] = ["N", "MA", "SA", "DA", "RA", "QAA"]
  const agentNames: Record<WorkroomAgentId, string> = {
    N: "Factory Director",
    MA: "Marketing Producer",
    SA: "Sales Producer",
    DA: "Delivery Producer",
    RA: "Research Producer",
    QAA: "QA Producer",
  }
  const lastRun = state.workRuns[state.workRuns.length - 1]
  const recentRuns = [...state.workRuns].reverse().slice(0, 8)
  const runStepPairs = [...state.workRuns]
    .reverse()
    .flatMap((run) => run.steps.map((step) => ({ run, step })))
  const latestStepFor = (agentId: WorkroomAgentId) => runStepPairs.find((x) => x.step.agentId === agentId)
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]))

  // Honest derived status — the system is synchronous, so an agent is never
  // "live". It either completed work, has output waiting for review, was
  // skipped/idle, or its run failed (blocked).
  const renderWorkAgent = (agentId: WorkroomAgentId): string => {
    const latest = latestStepFor(agentId)
    const step = latest?.step
    const outputDigital = step?.outputId ? digitalById.get(step.outputId) : undefined
    const status = !step
      ? "idle"
      : latest!.run.status === "failed" || step.status === "failed"
        ? "blocked"
        : step.status === "skipped"
          ? "idle"
          : outputDigital?.status === "draft_ready" || outputDigital?.status === "needs_rework"
            ? "waiting_review"
            : "completed"
    const relatedOrder = outputDigital?.orderId
    const next = agentId === "N"
      ? nextAction[0]
      : status === "waiting_review"
        ? `Operator: review ${step?.outputId ?? "output"}`
        : status === "blocked"
          ? "Inspect the failed work run below"
          : "Waiting for a matching order, rework, or training slot"

    return `
<div class="work-agent ${status === "blocked" ? "failed" : status === "waiting_review" ? "active" : "waiting"}">
  <div class="name">${E(agentId)} · ${E(agentNames[agentId])}</div>
  <div class="meta">${E(status)}${step?.department ? ` · ${E(step.department)}` : ""}${step ? ` · last run ${E(step.finishedAt.slice(0, 19).replace("T", " "))}` : ""}</div>
  <div class="line"><strong>Last job:</strong> ${E(step?.jobType ?? "none yet")}</div>
  <div class="line"><strong>Last input:</strong> ${step ? E(preview(step.inputSummary, 110)) : "—"}</div>
  <div class="line"><strong>Last output:</strong> ${E(step?.outputSummary ? preview(step.outputSummary, 110) : "No output recorded yet")}</div>
  ${step?.outputId ? `<div class="line mono" style="font-size:11px"><strong>Output id:</strong> ${E(step.outputId)}</div>` : ""}
  ${relatedOrder ? `<div class="line mono" style="font-size:11px"><strong>Related order:</strong> ${E(relatedOrder)}</div>` : ""}
  <div class="line"><strong>Next:</strong> ${E(next)}</div>
</div>`
  }

  const renderStep = (step: FactoryWorkRun["steps"][number]): string => `
<div class="timeline-step ${step.status}">
  <div class="daily-header">
    ${badge(step.agentId, "info")}
    ${badge(step.status, step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")}
    <span class="daily-title">${E(step.agentName)}</span>
    <span class="dim" style="font-size:11px">${E(step.jobType)}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Input:</strong> ${E(step.inputSummary)}</div>
  ${step.outputSummary ? `<div class="dim" style="font-size:12px;margin-top:4px"><strong>Output:</strong> ${E(step.outputSummary)}</div>` : ""}
  ${step.outputId ? `<div class="dim mono" style="font-size:11px;margin-top:4px">outputId: ${E(step.outputId)}</div>` : ""}
  ${step.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:4px">constraints: ${E(step.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim mono" style="font-size:10.5px;margin-top:4px">${E(step.startedAt.slice(11, 19))} -> ${E(step.finishedAt.slice(11, 19))}</div>
</div>`

  return layout("Boss/Admin Cockpit", "/admin", `
<div class="admin-shell">
  <section class="admin-hero">
    <div>
      <div class="admin-kicker">Founder command center</div>
      <h1 class="admin-title">Boss/Admin Cockpit</h1>
      <p class="admin-sub">Operational control for factory-core v0.2.1. Autonomy of thinking without autonomy of action: the system can produce internal work, but the operator approves every external step.</p>
    </div>
    <div class="admin-mode">
      ${badge(mode, mode === "CLIENT_MODE" ? "warn" : mode === "NO_CLIENT_TRAINING_MODE" ? "info" : "muted")}
      ${badge(autopilotEnabled ? "autopilot ON" : "autopilot OFF", autopilotEnabled ? "ok" : "bad")}
      <span class="dim" style="font-size:12px">last cycle: ${E(lastCycleSummary)}</span>
    </div>
  </section>

  ${flashHtml}

  <section class="admin-grid" aria-label="Executive Summary">
    <div class="admin-card"><div class="v info">${state.orders.length}</div><div class="l">Total orders</div></div>
    <div class="admin-card"><div class="v ${readyOrders.length ? "warn" : "ok"}">${readyOrders.length}</div><div class="l">Orders ready for review</div></div>
    <div class="admin-card"><div class="v ${openOrders.length ? "warn" : "ok"}">${openOrders.length}</div><div class="l">Open orders</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Training Count</div></div>
    <div class="admin-card"><div class="v ${pendingReviewCount ? "warn" : "ok"}">${pendingReviewCount}</div><div class="l">Pending review items</div></div>
    <div class="admin-card"><div class="v ok">${state.warehouse.length + warehouseAssets.length}</div><div class="l">Warehouse count</div></div>
    <div class="admin-card"><div class="v bad">${trashCount}</div><div class="l">Trash/rejected count</div></div>
    <div class="admin-card"><div class="v info">${state.events.length}</div><div class="l">Total events</div></div>
  </section>

  <section class="admin-action">
    <h2>Next Operator Action</h2>
    <strong>${E(nextAction[0])}</strong>
    <p class="dim">${E(nextAction[1])}</p>
  </section>

  <section class="admin-two">
    <div class="admin-panel">
      <h2>Add Client Order</h2>
      <form method="POST" action="/api/order">
        <input type="hidden" name="returnTo" value="/admin">
        <div class="admin-input-row">
          <input name="clientName" placeholder="Client name" required>
          <input name="contact" placeholder="Contact">
          <select name="department">
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="delivery" selected>Delivery</option>
            <option value="research">Research</option>
            <option value="qa">QA</option>
          </select>
        </div>
        <textarea name="description" placeholder="Describe the requested deliverable..." required></textarea>
        <div class="admin-actions"><button type="submit">Add Order</button></div>
      </form>
    </div>

    <div class="admin-panel hot">
      <h2>Autopilot Control</h2>
      <p class="dim" style="margin-bottom:10px">Persisted state: <strong>${autopilotEnabled ? "ON" : "OFF"}</strong></p>
      <div class="admin-actions">
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="off">
          <button class="bad" type="submit">Pause Autopilot</button>
        </form>
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="on">
          <button class="ok" type="submit">Resume Autopilot</button>
        </form>
        <form method="POST" action="/api/daily">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="run">
          <input type="hidden" name="date" value="${today}">
          <button type="submit">Run Training Cycle</button>
        </form>
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Orders Summary</h2>
    <div class="admin-three">
      <div class="stat"><div class="v info">${openOrders.length}</div><div class="l">new / in_production</div></div>
      <div class="stat"><div class="v warn">${readyOrders.length}</div><div class="l">ready_for_review</div></div>
      <div class="stat"><div class="v ok">${approvedOrders.length}</div><div class="l">approved / closed</div></div>
    </div>
  </section>

  <section class="admin-two">
    <div class="admin-list">
      ${orderGroup("Client Orders Control - new / in_production", openOrders, "No orders currently in production.")}
      ${orderGroup("Client Orders Control - ready_for_review", readyOrders, "No client orders waiting for review.", "orders-review")}
    </div>
    <div class="admin-list">
      ${orderGroup("Client Orders Control - approved / closed", approvedOrders, "No approved or closed orders yet.")}
      ${orderGroup("Client Orders Control - rejected", rejectedOrders, "No rejected orders.")}
    </div>
  </section>

  <section class="admin-panel" id="training-review">
    <h2>Daily Training Review</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${todayTraining.length}/5</div><div class="l">today</div></div>
      <div class="stat"><div class="v warn">${pendingTraining.length}</div><div class="l">pending draft_ready</div></div>
      <div class="stat"><div class="v ok">${acceptedTraining.length}</div><div class="l">accepted</div></div>
      <div class="stat"><div class="v bad">${rejectedTraining.length}</div><div class="l">rejected</div></div>
      <div class="stat"><div class="v warn">${trainingItems.filter((d) => d.status === "needs_rework").length}</div><div class="l">needs_rework</div></div>
      <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">warehoused</div></div>
    </div>
    <div class="admin-list">
      ${trainingItems.length === 0 ? '<p class="dim">No training-only assets yet.</p>' : [...trainingItems].reverse().slice(0, 12).map(renderTrainingItem).join("")}
    </div>
  </section>

  <section class="admin-panel">
    <h2>Factory Workroom</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v ${lastRun?.status === "failed" ? "bad" : lastRun ? "ok" : "muted"}">${E(lastRun?.status ?? "none")}</div><div class="l">Last cycle status</div></div>
      <div class="stat"><div class="v info">${E(lastRun?.mode ?? mode)}</div><div class="l">Last mode</div></div>
      <div class="stat"><div class="v warn">${lastRun?.steps.length ?? 0}</div><div class="l">Agent steps</div></div>
    </div>
    <div class="idle-box" style="margin-bottom:10px">
      <div class="kicker">Why It Is Standing Still</div>
      <strong>${E(ops.standingStill)}</strong>
      ${lastRun?.idleReason ? `<div class="dim" style="font-size:11.5px;margin-top:4px">Last recorded cycle said: ${E(lastRun.idleReason)}</div>` : ""}
      <div class="dim" style="font-size:12px;margin-top:4px">Next operator action: ${E(nextAction[0])} — ${E(nextAction[1])}</div>
    </div>
    <div class="workroom-grid" style="margin-bottom:12px">
      ${workroomAgents.map(renderWorkAgent).join("")}
    </div>
    <div class="admin-two">
      <div class="admin-subpanel">
        <h2>Last Work Run Timeline</h2>
        ${lastRun ? `
          <p class="dim" style="font-size:12px;margin-bottom:8px">${E(lastRun.id)} · ${E(lastRun.trigger)} · ${E(lastRun.mode)} · ${E(lastRun.startedAt.slice(0, 19).replace("T", " "))} -> ${E(lastRun.finishedAt.slice(11, 19))} · outputs ${lastRun.outputsCreated.length}</p>
          <div class="timeline">${lastRun.steps.map(renderStep).join("")}</div>
        ` : '<p class="dim">No autonomous cycle has recorded work yet.</p>'}
      </div>
      <div class="admin-subpanel">
        <h2>Waiting for Operator</h2>
        <p class="dim" style="font-size:12px;margin-bottom:8px">${E(ops.standingStill)}</p>
        <table class="admin-table">
          <tbody>
            <tr><th><a href="#orders-review">Client orders ready for review</a></th><td>${readyOrders.length}</td></tr>
            <tr><th><a href="#training-review">Training drafts waiting</a></th><td>${pendingTraining.length}</td></tr>
            <tr><th><a href="#training-review">Reworks waiting for cycle</a></th><td>${reworkItems.length}</td></tr>
            <tr><th>Pipeline approval items (see /factory)</th><td>${pendingApprovalCount}</td></tr>
          </tbody>
        </table>
        ${readyOrders.length + pendingTraining.length + reworkItems.length > 0 ? `
        <ul class="wait-items">
          ${readyOrders.map((o) => `<li><span class="mono">${E(o.deliverableId ?? o.id)}</span> — ${E(o.clientName)} (${E(o.department)}): Approve → Warehouse / Request Rework / Reject — <a href="#orders-review">open</a></li>`).join("")}
          ${pendingTraining.slice(0, 6).map((d) => `<li><span class="mono">${E(d.id)}</span> — ${E(d.department)} training: Accept / Warehouse / Rework / Reject — <a href="#training-review">open</a></li>`).join("")}
          ${reworkItems.map((d) => `<li><span class="mono">${E(d.id)}</span> — flagged needs_rework${d.operatorFeedback ? `: "${E(preview(d.operatorFeedback, 70))}"` : ""} — regenerates on next cycle</li>`).join("")}
        </ul>` : ""}
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Recent Work Runs</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Click a run to inspect every agent step: input, output, constraints, timing.</p>
    ${recentRuns.length === 0 ? '<p class="dim">No work runs recorded yet.</p>' : recentRuns.map((run, i) => `
    <details class="run-drill"${i === 0 ? " open" : ""}>
      <summary>
        <span class="mono dim">${E(run.id)}</span>
        ${badge(run.mode, run.mode === "IDLE" ? "muted" : run.mode === "REWORK_MODE" ? "warn" : "info")}
        ${badge(run.status, run.status === "failed" ? "bad" : "ok")}
        <span class="dim" style="font-size:11.5px">trigger: ${E(run.trigger)} · ${E(run.startedAt.slice(0, 19).replace("T", " "))} -> ${E(run.finishedAt.slice(11, 19))} · ${run.steps.length} step${run.steps.length === 1 ? "" : "s"} · ${run.outputsCreated.length} output${run.outputsCreated.length === 1 ? "" : "s"}</span>
      </summary>
      <div class="drill-body">
        ${run.idleReason ? `<div class="dim" style="font-size:12px">Idle reason: ${E(run.idleReason)}</div>` : ""}
        <div class="dim" style="font-size:12px">Next operator action: ${E(run.nextOperatorAction)}</div>
        ${run.outputsCreated.length ? `<div class="dim mono" style="font-size:11px;margin-top:4px">Outputs created: ${run.outputsCreated.map((o) => E(o)).join(", ")}</div>` : ""}
        <div class="timeline">${run.steps.map(renderStep).join("")}</div>
      </div>
    </details>`).join("")}
  </section>

  <section class="admin-panel">
    <h2>Warehouse Summary</h2>
    <p class="dim" style="margin-bottom:10px">${state.warehouse.length} pipeline offers and ${warehouseAssets.length} digital assets approved by the operator. No external send, email, CRM push, or publish action exists here.</p>
    ${latestWarehouse.length === 0 ? '<p class="dim">Warehouse is empty.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Type</th><th>Department</th><th>Score</th><th>Date</th><th>Preview</th></tr></thead>
      <tbody>
        ${latestWarehouse.map((d) => `<tr>
          <td>${E(d.title)}</td>
          <td>${badge(d.orderId ? "client order" : "training", d.orderId ? "warn" : "muted")}</td>
          <td>${badge(d.department, "info")}</td>
          <td class="mono">${d.qualityScore}</td>
          <td class="dim">${E(d.date)}</td>
          <td class="dim" style="font-size:12px">${E(preview(d.content, 140))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Event Stream</h2>
    ${criticalEvents.length === 0 ? '<p class="dim">No critical events yet.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Time</th><th>Agent</th><th>Event</th><th>Detail</th></tr></thead>
      <tbody>
        ${criticalEvents.map((e) => `<tr>
          <td class="mono dim">${E(e.timestamp.slice(0, 19).replace("T", " "))}</td>
          <td>${badge(e.agentId, "info")}</td>
          <td>${badge(e.eventType, eventBadgeCls(e.eventType))}</td>
          <td class="dim" style="font-size:12px">${E(e.detail)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-safety">
    <div class="admin-panel danger">
      <h2>Known Risks / Safety Box</h2>
      <ul>
        <li>JsonStore is single-process; two servers can clobber writes.</li>
        <li>events.json grows unbounded and needs rotation before high volume.</li>
        <li>A mutex is required before async LLM calls are added to cycles.</li>
        <li>No external sending, publishing, scraping, CRM push, email, or ad spend.</li>
        <li>Operator approval is required before any asset leaves the factory.</li>
      </ul>
    </div>
    <div class="admin-panel">
      <h2>Admin Editing Rules</h2>
      <ul>
        <li>Every write is an explicit operator button or form submit.</li>
        <li>Client orders use the existing department whitelist.</li>
        <li>Review decisions use the existing event-logged daily actions.</li>
        <li>No raw JSON editing and no destructive bulk mutation.</li>
        <li>The approval gate cannot be bypassed from this cockpit.</li>
      </ul>
    </div>
  </section>
</div>`)
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
      if (url === "/admin" || url === "/operator") return html(res, renderAdmin(state))

      // Read-only debug endpoints — no store mutation, JSON only (Phase 2).
      if (url === "/api/admin/state") {
        const ops = deriveOps(state)
        return json(res, {
          generatedAt: new Date().toISOString(),
          autopilotEnabled,
          lastCycleSummary,
          mode: ops.mode,
          standingStill: ops.standingStill,
          nextOperatorAction: { title: ops.nextActionTitle, detail: ops.nextActionDetail },
          waiting: ops.waiting,
          counts: {
            orders: state.orders.length,
            dailyDigitals: state.dailyDigitals.length,
            trainingToday: `${ops.trainingToday}/5`,
            warehouseOffers: state.warehouse.length,
            warehouseAssets: state.dailyDigitals.filter((d) => d.location === "warehouse").length,
            trash: state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length,
            events: state.events.length,
            workRuns: state.workRuns.length,
          },
          orders: state.orders.map((o) => ({
            id: o.id,
            clientName: o.clientName,
            department: o.department,
            taskType: o.taskType,
            status: o.status,
            deliverableId: o.deliverableId,
            revisionCount: o.revisionCount,
            updatedAt: o.updatedAt,
          })),
          workRunsSummary: [...state.workRuns].reverse().slice(0, 10).map((r) => ({
            id: r.id,
            mode: r.mode,
            status: r.status,
            trigger: r.trigger,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
            steps: r.steps.length,
            outputsCreated: r.outputsCreated,
            idleReason: r.idleReason,
            nextOperatorAction: r.nextOperatorAction,
          })),
        })
      }
      if (url === "/api/work-runs") {
        return json(res, {
          total: state.workRuns.length,
          workRuns: [...state.workRuns].reverse().slice(0, 20),
        })
      }

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
      const returnToAdmin = params["returnTo"] === "/admin"

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
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), "Approval decision recorded."))
      }
      return redirect(res, "/")
    }

    if (method === "POST" && url === "/api/daily") {
      const params = await readBody(req)
      const action = params["action"] ?? ""
      const id = params["id"] ?? ""
      const feedback = (params["feedback"] ?? "").trim()
      const date = params["date"] ?? new Date().toISOString().slice(0, 10)
      const returnToAdmin = params["returnTo"] === "/admin"

      // Order deliverables review here too — sync the order status afterwards
      // and send the operator back to the relevant review surface.
      const digitalBefore = store.getDailyDigital(id)
      const orderId = digitalBefore?.orderId
      const respond = (flash: string) =>
        returnToAdmin
          ? html(res, renderAdmin(store.snapshot(), flash))
          : orderId
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
          const result = await runAutonomousCycle(store, date, "daily_run")
          lastCycleSummary = `${result.mode}: training=${result.trainingCreated} orders=${result.ordersProduced.length} reworks=${result.reworksRegenerated.length}`
          return respond(`Cycle done — ${lastCycleSummary}`)
        } catch (err) {
          return respond(`Error: ${String(err)}`)
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
      const returnToAdmin = params["returnTo"] === "/admin"
      // Reject unknown departments before anything is created — no order, no event.
      if (!(VALID_DEPARTMENTS as readonly string[]).includes(departmentRaw)) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), `Error: invalid department ${departmentRaw}`), 400)
        }
        return json(res, { error: "invalid department", received: departmentRaw, allowed: VALID_DEPARTMENTS }, 400)
      }
      const department = departmentRaw as DailyDigitalDepartment
      if (!clientName || !description) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), "Error: client name and description are required"))
        }
        return html(res, renderOrders(store.snapshot(), "Error: client name and description are required"))
      }
      const order = createOrder(store, {
        clientName,
        description,
        department,
        ...(contact ? { contact } : {}),
      })
      // Produce immediately — the client should not wait for the next timer tick.
      const result = await runAutonomousCycle(store, undefined, "order_created")
      lastCycleSummary = `${result.mode}: orders=${result.ordersProduced.length}`
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Order ${order.id} accepted and produced — review the deliverable below.`))
      }
      return html(res, renderOrders(store.snapshot(), `Order ${order.id} accepted and produced — review the deliverable below.`))
    }

    if (method === "POST" && url === "/api/autopilot") {
      const params = await readBody(req)
      const returnToAdmin = params["returnTo"] === "/admin"
      autopilotEnabled = params["action"] !== "off"
      store.setAutopilotEnabled(autopilotEnabled)
      store.addEvent({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: "N",
        eventType: autopilotEnabled ? "factory.autopilot_on" : "factory.autopilot_off",
        detail: `Operator turned autopilot ${autopilotEnabled ? "on" : "off"}`,
      })
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Autopilot ${autopilotEnabled ? "resumed" : "paused"}.`))
      }
      return html(res, renderFactory(store.snapshot(), `Autopilot ${autopilotEnabled ? "resumed" : "paused"}.`))
    }

    html(res, "<h1>404</h1>", 404)
  } catch (err) {
    console.error(err)
    html(res, `<pre>500: ${E(String(err))}</pre>`, 500)
  }
})

// --- Autopilot loop: client orders first, training when idle, always bounded ---

async function autopilotTick(trigger: FactoryWorkRunTrigger = "timer"): Promise<void> {
  if (!autopilotEnabled) return
  try {
    const r = await runAutonomousCycle(store, undefined, trigger)
    lastCycleSummary = `${r.mode}: training=${r.trainingCreated} orders=${r.ordersProduced.length} reworks=${r.reworksRegenerated.length}`
    if (r.ordersProduced.length + r.reworksRegenerated.length + r.trainingCreated > 0) {
      console.log(`[autopilot] ${lastCycleSummary}`)
    }
  } catch (err) {
    console.error("[autopilot] cycle failed:", err)
  }
}

setInterval(() => void autopilotTick("timer"), 60_000)

server.listen(PORT, () => {
  console.log(`\nFactory Core v0.2 — http://localhost:${PORT}`)
  console.log("  /admin        — boss/admin cockpit")
  console.log("  /operator     — admin cockpit alias")
  console.log("  /api/admin/state — read-only cockpit state (JSON)")
  console.log("  /api/work-runs   — read-only recent work runs (JSON)")
  console.log("  / or /factory  — pipeline overview + signal form + autopilot toggle")
  console.log("  /orders        — client orders: intake, production, review")
  console.log("  /leads         — qualified leads")
  console.log("  /warehouse     — approved offers + digital assets")
  console.log("  /trash         — disqualified / failed / rejected")
  console.log("  /events        — full event log")
  console.log("  /daily-review  — NO_CLIENT_TRAINING_MODE daily review")
  console.log("\nAutopilot: ON (60s cycle) — orders → reworks → 5 random daily training missions.")
  console.log("Press Ctrl+C to stop.\n")
  void autopilotTick("startup")
})
