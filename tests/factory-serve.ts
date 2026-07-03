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
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
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
  SERVICE_CATALOG,
  isValidServiceId,
  createDeliveryPack,
  approveDeliveryPack,
  warehouseDeliveryPack,
  renderPackMarkdown,
  deriveProductionLine,
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
  DeliveryPack,
  OrderLanguage,
  ProductionLineView,
  AgentProductionTask,
  AgentStationStatus,
} from "@ratio-essendi/factory-core"
import { randomUUID } from "node:crypto"

// PORT is env-overridable so the HTTP test suite can run on a free port.
const PORT = Number(process.env["PORT"] ?? 7778)
// On Vercel (serverless) the project dir is read-only; only /tmp is writable,
// and it is ephemeral per cold start. That is acceptable for a public PREVIEW:
// state seeds itself and resets between cold starts. Locally, persist as before.
const ON_VERCEL = Boolean(process.env["VERCEL"])
const DATA_DIR = process.env["FACTORY_DATA_DIR"] ?? (ON_VERCEL ? "/tmp/.factory-data" : join(process.cwd(), ".factory-data"))
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

// Named demo clients for rehearsing the production line. Explicit action only,
// internal only — clearly fictional, never presented as real clients.
type DemoClient = { key: string; clientName: string; serviceId: string; language: OrderLanguage; description: string }
const DEMO_CLIENTS: DemoClient[] = [
  { key: "hvac", clientName: "HVAC TestCo", serviceId: "svc-ai-workflow-audit", language: "EN",
    description: "We install and maintain HVAC systems. We need a simple workflow to handle inbound leads, quote follow-ups, and maintenance plan objections." },
  { key: "brighthire", clientName: "BrightHire Agency", serviceId: "svc-recruitment-ops-audit", language: "EN",
    description: "We are a 12-person recruitment agency. Candidates go cold between screening and client submission and we lose placements to slow feedback." },
  { key: "neonblocks", clientName: "NeonBlocks Studio", serviceId: "svc-social-pack", language: "EN",
    description: "Indie game studio. We know we should post but never have content ready. Need a carousel pack about our build-in-public journey." },
  { key: "builderpro", clientName: "Local Builder Pro", serviceId: "svc-landing-audit", language: "EN",
    description: "Local construction firm. Our landing page gets visits from ads but almost no enquiry form submissions." },
]

/** Builds the production-line view using the same deriveOps truth as the cockpit. */
function productionLineFor(state: FactoryState): ProductionLineView {
  const ops = deriveOps(state)
  return deriveProductionLine(state, {
    mode: ops.mode,
    autopilotEnabled,
    nextOperatorAction: ops.nextActionTitle,
    trainingToday: `${ops.trainingToday}/5`,
  })
}

// --- HTML helpers ---

const E = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const plPreview = (text: string, max = 60): string => (text.length > max ? `${text.slice(0, max)}...` : text)

const badge = (text: string, cls: string): string =>
  `<span class="badge ${cls}">${E(text)}</span>`

const nav = (active: string): string => {
  const links: [string, string][] = [
    ["/admin", "Admin"],
    ["/", "Factory"],
    ["/factory-run", "Factory Run"],
    ["/production-line", "Production Line"],
    ["/orders", "Orders"],
    ["/delivery", "Delivery"],
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
.station-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.station{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;border-top:3px solid #30363d}
.station.completed{border-top-color:#3fb950}.station.waiting_review{border-top-color:#d29922}.station.ready_for_operator{border-top-color:#58a6ff}
.station.blocked{border-top-color:#f85149}.station.queued{border-top-color:#a371f7}.station.skipped{border-top-color:#8b949e;opacity:.7}.station.idle{opacity:.55}
.station .sname{font-weight:800;color:#f5fbff;font-size:13px}
.station .sagent{font-size:10.5px;color:#00f5ff;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.station .spurpose{font-size:11px;color:#8b949e;margin-bottom:6px;min-height:28px}
.station .sline{font-size:11.5px;color:#dbe7f0;margin-top:3px}
.pl-task{background:#0b1119;border:1px solid #263241;border-radius:8px;border-left:3px solid #30363d;padding:10px;margin-bottom:8px}
.pl-task.waiting_review{border-left-color:#d29922}.pl-task.blocked{border-left-color:#f85149}.pl-task.ready_for_operator{border-left-color:#58a6ff}.pl-task.completed{border-left-color:#3fb950}.pl-task.queued{border-left-color:#a371f7}.pl-task.skipped{border-left-color:#8b949e}
@media (max-width:860px){.station-board{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.station-board{grid-template-columns:1fr}}
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
</div>`).join("")}

<h2>Delivery Packs (${state.deliveryPacks.length})</h2>
${state.deliveryPacks.length === 0 ? '<p class="dim">No delivery packs yet.</p>' : `
<table>
<thead><tr><th>Pack</th><th>Client</th><th>Service</th><th>Status</th><th>Source</th><th>Created</th></tr></thead>
<tbody>
${[...state.deliveryPacks].reverse().map((p) => `<tr>
  <td class="mono">${E(p.id)}</td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(p.status, p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
  <td class="mono dim">${E(p.sourceOutputId)}</td>
  <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`)
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
  deliveryPacksDraft: number
  deliveryPacksApproved: number
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
  const deliveryPacksDraft = state.deliveryPacks.filter((p) => p.status === "draft").length
  const deliveryPacksApproved = state.deliveryPacks.filter((p) => p.status === "approved").length
  const waiting: OpsWaiting = { ordersReadyForReview: readyOrders, trainingDrafts, needsRework, pendingApprovals, deliveryPacksDraft, deliveryPacksApproved }

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
  } else if (readyOrders + trainingDrafts + pendingApprovals + deliveryPacksDraft + deliveryPacksApproved > 0) {
    standingStill =
      `Factory is waiting for operator review: ${readyOrders} client output${s(readyOrders)} and ${trainingDrafts} training draft${s(trainingDrafts)} are pending.` +
      (deliveryPacksDraft + deliveryPacksApproved > 0
        ? ` Delivery packs waiting: ${deliveryPacksDraft} draft, ${deliveryPacksApproved} approved.`
        : "") +
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
        : deliveryPacksDraft > 0
          ? ["Approve delivery pack", `${deliveryPacksDraft} delivery pack${s(deliveryPacksDraft)} in draft on /delivery.`]
          : deliveryPacksApproved > 0
            ? ["Warehouse approved delivery pack", `${deliveryPacksApproved} approved pack${s(deliveryPacksApproved)} ready on /delivery.`]
            : pendingApprovals > 0
              ? ["Review pipeline approval item", `${pendingApprovals} approval item${s(pendingApprovals)} pending.`]
              : !autopilotEnabled
                ? ["Resume autopilot or keep paused intentionally", "The persisted autopilot setting is OFF and nothing is waiting for review."]
                : trainingToday < 5 && openOrders === 0
                  ? ["Run training cycle", `Today has ${trainingToday}/5 training assets.`]
                  : ["Add a client order / system idle", "Nothing needs review. The factory is ready for new client work."]

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
  const packsDraft = state.deliveryPacks.filter((p) => p.status === "draft")
  const packsApproved = state.deliveryPacks.filter((p) => p.status === "approved")
  const packsReady = state.deliveryPacks.filter((p) => p.status === "warehouse_ready")
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
  <form method="POST" action="/api/delivery">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="create">
    <input type="hidden" name="outputId" value="${E(d.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Approve -> Delivery Pack</button>
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
<div class="admin-order ${cls}" id="${d ? `out-${E(d.id)}` : `order-${E(order.id)}`}">
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
<div class="admin-order ${item.status === "rejected" ? "bad" : item.status === "accepted" ? "done" : item.status === "needs_rework" ? "ready" : ""}" id="out-${E(item.id)}">
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
  ${step?.outputId ? `<div class="line mono" style="font-size:11px"><strong>Output id:</strong> <a href="#out-${E(step.outputId)}">${E(step.outputId)}</a></div>` : ""}
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
      ${badge(mode, mode === "CLIENT_MODE" ? "warn" : mode === "REWORK_MODE" ? "warn" : mode === "NO_CLIENT_TRAINING_MODE" ? "info" : "muted")}
      ${badge(autopilotEnabled ? "autopilot ON" : "autopilot OFF", autopilotEnabled ? "ok" : "bad")}
      ${badge("SAFE MODE — no external send", "ok")}
      <span class="dim" style="font-size:12px">last cycle: ${lastRun
        ? `${E(lastRun.mode)} · ${E(lastRun.status)} · via ${E(lastRun.trigger)} · ${E(lastRun.finishedAt.slice(0, 19).replace("T", " "))}`
        : "none recorded yet"}</span>
      <span class="dim" style="font-size:12px">next: ${E(nextAction[0])}</span>
      <span class="dim" style="font-size:11px">local single-instance · nothing leaves the factory without operator approval</span>
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

  <section class="admin-grid" aria-label="Business Loop">
    <div class="admin-card"><div class="v info">${SERVICE_CATALOG.length}</div><div class="l">Services in catalog</div></div>
    <div class="admin-card"><div class="v ${openOrders.length + readyOrders.length ? "warn" : "ok"}">${openOrders.length + readyOrders.length}</div><div class="l">Active client orders</div></div>
    <div class="admin-card"><div class="v ${packsDraft.length + packsApproved.length ? "warn" : "ok"}">${packsDraft.length}/${packsApproved.length}/${packsReady.length}</div><div class="l">Packs draft/appr/ready</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Training quota</div></div>
    <div class="admin-card"><div class="v ok">${state.caseRecords.length}</div><div class="l">Case records</div></div>
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
          <select name="serviceId">
            <option value="">— service: free brief —</option>
            ${SERVICE_CATALOG.map((s) => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("")}
          </select>
          <select name="language">
            <option value="EN">EN</option>
            <option value="PL">PL</option>
          </select>
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
        <form method="POST" action="/api/demo-order">
          <input type="hidden" name="returnTo" value="/admin">
          <button type="submit">Create Demo HVAC Order</button>
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
    <h2>Agent Production Line</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Compact view of the production floor. Full drilldown: <a href="/production-line" style="color:#58a6ff">/production-line</a></p>
    ${(() => { const pl = productionLineFor(state); return `
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${pl.activeClientOrders}</div><div class="l">Active client tasks</div></div>
      <div class="stat"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Rework tasks</div></div>
      <div class="stat"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft + pl.deliveryPacks.approved}</div><div class="l">Pack tasks waiting</div></div>
      <div class="stat"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Training today</div></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>Station</th><th>Agent</th><th>Status</th><th>Tasks</th><th>Last</th></tr></thead>
      <tbody>
        ${pl.stations.map((st) => `<tr>
          <td>${E(st.name)}</td>
          <td class="mono">${E(st.agentId)}</td>
          <td>${badge(st.status, plStatusBadgeCls(st.status))}</td>
          <td class="mono">${st.taskCount}</td>
          <td class="dim" style="font-size:11.5px">${st.lastTask ? E(plPreview(st.lastTask.title, 46)) : "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <p class="dim" style="font-size:12px;margin-top:6px">Next operator action: <strong>${E(pl.nextOperatorAction)}</strong></p>`})()}
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
        ${readyOrders.length + pendingTraining.length + reworkItems.length + packsDraft.length + packsApproved.length > 0 ? `
        <table class="admin-table" style="margin-top:10px">
          <thead><tr><th>Item</th><th>Output</th><th>Source</th><th>Producer</th><th>Dept</th><th>Score</th><th>Rev</th><th>Next safe action</th></tr></thead>
          <tbody>
            ${readyOrders.map((o) => {
              const d = deliverableFor(o)
              return `<tr>
                <td>${E(o.clientName)}</td>
                <td class="mono">${d ? `<a href="#out-${E(d.id)}">${E(d.id)}</a>` : "—"}</td>
                <td>${badge("client", "warn")}</td>
                <td class="mono">${E(d?.createdByAgentId ?? "—")}</td>
                <td>${E(o.department)}</td>
                <td class="mono">${d?.qualityScore ?? "—"}</td>
                <td class="mono">${d?.revisionCount ?? 0}</td>
                <td class="dim" style="font-size:11.5px"><a href="#${d ? `out-${E(d.id)}` : "orders-review"}">Approve → Warehouse · Rework · Reject</a></td>
              </tr>`
            }).join("")}
            ${pendingTraining.slice(0, 8).map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge("training", "muted")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(d.department)}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="#out-${E(d.id)}">Accept · Warehouse · Rework · Reject</a></td>
              </tr>`).join("")}
            ${reworkItems.map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge("rework", "warn")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(d.department)}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px">Regenerates on next cycle — use "Run Training Cycle"</td>
              </tr>`).join("")}
            ${packsDraft.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge("pack draft", "info")}</td>
                <td class="mono">—</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">—</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Approve pack on /delivery</a></td>
              </tr>`).join("")}
            ${packsApproved.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge("pack approved", "ok")}</td>
                <td class="mono">—</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">—</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Warehouse pack on /delivery</a></td>
              </tr>`).join("")}
          </tbody>
        </table>` : ""}
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
    <h2>Delivery Packs</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Client-ready artifacts. The operator delivers them manually — the factory never sends. Full view: <a href="/delivery" style="color:#58a6ff">/delivery</a></p>
    ${state.deliveryPacks.length === 0 ? '<p class="dim">No delivery packs yet. Use "Approve -> Delivery Pack" on a client output.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Pack</th><th>Client</th><th>Service</th><th>Status</th><th>Source output</th><th>Order</th><th>Created</th></tr></thead>
      <tbody>
        ${[...state.deliveryPacks].reverse().slice(0, 6).map((p) => `<tr>
          <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
          <td>${E(p.clientName)}</td>
          <td>${E(p.serviceName)}</td>
          <td>${badge(p.status, p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
          <td class="mono dim">${E(p.sourceOutputId)}</td>
          <td class="mono dim">${E(p.orderId)}</td>
          <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
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
        <li>Delivery packs are internal artifacts — the operator owns delivery, always.</li>
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


function renderDelivery(state: FactoryState, flash?: string): string {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""
  const packs = [...state.deliveryPacks].reverse()
  const statusCls = (st: DeliveryPack["status"]): string =>
    st === "warehouse_ready" ? "ok" : st === "approved" ? "info" : "warn"
  return layout("Delivery Packs", "/delivery", `
<h1>Delivery Packs</h1>
<p class="sub">Client-ready artifacts prepared by the factory. <strong style="color:#f85149">The factory never sends — the operator copies the pack and delivers manually.</strong></p>
${flashHtml}
${packs.length === 0 ? '<p class="dim">No packs yet. On /admin, use "Approve -> Delivery Pack" on a client output.</p>' : packs.map((p) => `
<div class="admin-order" id="pack-${E(p.id)}">
  <div class="daily-header">
    ${badge(p.status, statusCls(p.status))}
    <span class="daily-title">${E(p.serviceName)} — ${E(p.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(p.id)} · rev ${p.revisionCount} · ${E(p.date)}</span>
    <span class="mono dim" style="font-size:11px">source ${E(p.sourceOutputId)} · order ${E(p.orderId)}</span>
  </div>
  <div class="offer-pre" style="max-height:340px">${E(renderPackMarkdown(p))}</div>
  <div class="admin-actions" style="margin-top:8px">
    ${p.status === "draft" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="approve">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Approve Pack</button>
    </form>` : ""}
    ${p.status === "approved" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="warehouse">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Warehouse Pack + Case Record</button>
    </form>` : ""}
    ${p.status === "warehouse_ready" ? `<span class="dim" style="font-size:12px">warehouse_ready — copy the markdown above and deliver through your own channel.</span>` : ""}
  </div>
</div>`).join("")}

<h2>Case Records (${state.caseRecords.length})</h2>
${state.caseRecords.length === 0 ? '<p class="dim">No cases yet — warehousing an approved pack creates one.</p>' : `
<table>
<thead><tr><th>Case</th><th>Client</th><th>Service</th><th>Problem</th><th>Pack</th><th>Follow-up</th><th>Created</th></tr></thead>
<tbody>
${[...state.caseRecords].reverse().map((c) => `<tr>
  <td class="mono">${E(c.id)}</td>
  <td>${E(c.clientName)}</td>
  <td>${E(c.serviceName)}</td>
  <td class="dim" style="font-size:12px">${E(c.problem.slice(0, 90))}</td>
  <td class="mono dim">${E(c.deliveryPackId)}</td>
  <td class="dim" style="font-size:12px">${E(c.followUpSuggestion)}</td>
  <td class="dim">${E(c.createdAt.slice(0, 10))}</td>
</tr>`).join("")}
</tbody>
</table>`}`)
}

function renderFactoryRun(state: FactoryState, flash?: string): string {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""
  const ops = deriveOps(state)
  const latestClientOutput = [...state.dailyDigitals].reverse().find((d) => d.orderId)
  const latestOrder = latestClientOutput?.orderId ? state.orders.find((o) => o.id === latestClientOutput.orderId) : undefined
  const recentPacks = [...state.deliveryPacks].reverse().slice(0, 5)
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px"
  return layout("Factory Run", "/factory-run", `
<h1>Factory Run — one page to run the day</h1>
<p class="sub">
  ${badge(ops.mode, ops.mode === "IDLE" ? "muted" : "info")}
  ${badge(autopilotEnabled ? "autopilot ON" : "autopilot OFF", autopilotEnabled ? "ok" : "bad")}
  ${badge("SAFE MODE — no external send", "ok")}
</p>
${flashHtml}

<div class="idle-box" style="margin-bottom:14px">
  <div class="kicker">Why It Is Standing Still</div>
  <strong>${E(ops.standingStill)}</strong>
  <div class="dim" style="font-size:12px;margin-top:4px">Next operator action: ${E(ops.nextActionTitle)} — ${E(ops.nextActionDetail)}</div>
</div>

<h2>Service Catalog (${SERVICE_CATALOG.length})</h2>
<table>
<thead><tr><th>Service</th><th>For</th><th>Promise</th><th>Dept</th><th>Deliverables</th></tr></thead>
<tbody>
${SERVICE_CATALOG.map((sv) => `<tr>
  <td><strong>${E(sv.name)}</strong><br><span class="mono dim" style="font-size:10.5px">${E(sv.id)}</span></td>
  <td class="dim" style="font-size:12px">${E(sv.targetCustomer)}</td>
  <td class="dim" style="font-size:12px">${E(sv.promise)}</td>
  <td>${badge(sv.defaultDepartment, "info")}</td>
  <td class="dim" style="font-size:11.5px">${E(sv.expectedDeliverables.join(" · "))}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="form-card">
  <label>New client order — pick a service, describe the client's situation</label>
  <form method="POST" action="/api/order">
    <input type="hidden" name="returnTo" value="/factory-run">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Client name / company" required style="flex:1;min-width:170px;${inputStyle}">
      <select name="serviceId" style="${inputStyle}">
        <option value="">— service: free brief —</option>
        ${SERVICE_CATALOG.map((sv) => `<option value="${E(sv.id)}">${E(sv.name)}</option>`).join("")}
      </select>
      <select name="department" style="${inputStyle}">
        <option value="marketing">Marketing</option>
        <option value="sales">Sales</option>
        <option value="delivery" selected>Delivery</option>
        <option value="research">Research</option>
        <option value="qa">QA</option>
      </select>
      <select name="language" style="${inputStyle}">
        <option value="EN">EN</option>
        <option value="PL">PL</option>
      </select>
      <select name="urgency" style="${inputStyle}">
        <option value="normal">normal</option>
        <option value="high">high</option>
      </select>
    </div>
    <textarea name="description" placeholder="Client brief — what do they do, what hurts, what should the output achieve..." required></textarea>
    <input name="operatorNotes" placeholder="Operator notes (optional)" style="width:100%;margin-top:8px;${inputStyle}">
    <div style="margin-top:8px"><button type="submit">Accept Order -> Produce Now</button></div>
  </form>
  <form method="POST" action="/api/demo-order" style="margin-top:10px">
    <input type="hidden" name="returnTo" value="/factory-run">
    <button type="submit">Create Demo Order (HVAC TestCo — AI Workflow Audit + Mini Demo)</button>
  </form>
</div>

<h2>Review Queue</h2>
<table>
<tbody>
  <tr><th>Client outputs ready for review</th><td>${ops.waiting.ordersReadyForReview}</td></tr>
  <tr><th>Training drafts waiting</th><td>${ops.waiting.trainingDrafts}</td></tr>
  <tr><th>Reworks waiting for cycle</th><td>${ops.waiting.needsRework}</td></tr>
  <tr><th>Delivery packs (draft / approved)</th><td>${ops.waiting.deliveryPacksDraft} / ${ops.waiting.deliveryPacksApproved}</td></tr>
</tbody>
</table>
<p class="dim" style="font-size:12px">Full review controls live on <a href="/admin" style="color:#58a6ff">/admin</a> and <a href="/delivery" style="color:#58a6ff">/delivery</a>.</p>

<h2>Latest Client Output</h2>
${latestClientOutput ? `
<div class="admin-order" id="out-${E(latestClientOutput.id)}">
  <div class="daily-header">
    ${badge(latestClientOutput.status, latestClientOutput.status === "draft_ready" ? "warn" : "ok")}
    <span class="daily-title">${E(latestClientOutput.title)}</span>
    <span class="mono dim" style="font-size:11px">${E(latestClientOutput.id)} · by ${E(latestClientOutput.createdByAgentId)} · rev ${latestClientOutput.revisionCount}${latestOrder?.serviceName ? ` · ${E(latestOrder.serviceName)}` : ""}</span>
  </div>
  <div class="offer-pre" style="max-height:260px">${E(latestClientOutput.content)}</div>
  ${latestClientOutput.status === "draft_ready" ? `
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="create">
      <input type="hidden" name="outputId" value="${E(latestClientOutput.id)}">
      <button class="ok" type="submit">Approve -> Delivery Pack</button>
    </form>
    <form method="POST" action="/api/daily">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(latestClientOutput.id)}">
      <input name="feedback" placeholder="Rework note..." required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Request Rework</button>
    </form>
  </div>` : ""}
</div>` : '<p class="dim">No client output yet — add an order above or create the demo order.</p>'}

<h2>Delivery Pack Readiness</h2>
${recentPacks.length === 0 ? '<p class="dim">No packs yet.</p>' : `
<table>
<thead><tr><th>Pack</th><th>Client</th><th>Service</th><th>Status</th></tr></thead>
<tbody>
${recentPacks.map((p) => `<tr>
  <td class="mono"><a href="/delivery#pack-${E(p.id)}" style="color:#58a6ff">${E(p.id)}</a></td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(p.status, p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
</tr>`).join("")}
</tbody>
</table>`}

<div class="admin-actions" style="margin-top:14px">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="run">
    <button type="submit">Run Cycle Now</button>
  </form>
  <form method="POST" action="/api/autopilot">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
    <button type="submit">${autopilotEnabled ? "Pause Autopilot" : "Resume Autopilot"}</button>
  </form>
</div>`)
}

function plStatusBadgeCls(st: AgentStationStatus): string {
  if (st === "completed") return "ok"
  if (st === "waiting_review") return "warn"
  if (st === "ready_for_operator") return "info"
  if (st === "blocked") return "bad"
  if (st === "queued") return "info"
  return "muted"
}

function renderPlTask(t: AgentProductionTask): string {
  return `
<div class="pl-task ${t.status}">
  <div class="daily-header">
    ${badge(t.status, plStatusBadgeCls(t.status))}
    ${badge(t.agentId, "info")}
    ${badge(t.source, t.source === "client" ? "warn" : t.source === "rework" ? "bad" : t.source === "delivery_pack" ? "info" : "muted")}
    <span class="daily-title">${E(t.title)}</span>
    <span class="dim" style="font-size:11px">station: ${E(t.station)}${t.department ? ` · ${E(t.department)}` : ""}${typeof t.revisionCount === "number" ? ` · rev ${t.revisionCount}` : ""}${typeof t.qualityScore === "number" ? ` · score ${t.qualityScore}` : ""}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Input:</strong> ${E(t.inputSummary)}</div>
  <div class="dim" style="font-size:12px;margin-top:2px"><strong>Output:</strong> ${E(t.outputSummary)}</div>
  ${t.outputId ? `<div class="dim mono" style="font-size:11px">output ${E(t.outputId)}${t.orderId ? ` · order ${E(t.orderId)}` : ""}${t.packId ? ` · pack ${E(t.packId)}` : ""}</div>` : ""}
  ${t.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:2px">constraints: ${E(t.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim" style="font-size:11.5px;margin-top:3px"><strong>Next:</strong> ${E(t.nextOperatorAction)}${t.nextStation ? ` (→ ${E(t.nextStation)})` : ""}</div>
</div>`
}

function renderProductionLine(state: FactoryState, flash?: string): string {
  const pl = productionLineFor(state)
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Error") ? "bad" : ""}">${E(flash)}</div>` : ""
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px"
  const lineBlock = (title: string, tasks: AgentProductionTask[], empty: string): string => `
<h2>${E(title)} (${tasks.length})</h2>
${tasks.length === 0 ? `<p class="dim">${E(empty)}</p>` : tasks.map(renderPlTask).join("")}`

  return layout("Production Line", "/production-line", `
<h1>Agent Production Line</h1>
<p class="sub">
  ${badge(pl.mode, pl.mode === "IDLE" ? "muted" : "info")}
  ${badge(pl.autopilotEnabled ? "autopilot ON" : "autopilot OFF", pl.autopilotEnabled ? "ok" : "bad")}
  ${badge("SAFE MODE — no external send", "ok")}
  <span class="dim" style="font-size:12px">honest synchronous view — no fake live agents</span>
</p>
${flashHtml}

<section class="admin-grid" aria-label="Production Summary">
  <div class="admin-card"><div class="v info">${pl.activeClientOrders}</div><div class="l">Active client orders</div></div>
  <div class="admin-card"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Training quota</div></div>
  <div class="admin-card"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft}/${pl.deliveryPacks.approved}/${pl.deliveryPacks.warehouseReady}</div><div class="l">Packs draft/appr/ready</div></div>
  <div class="admin-card"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Rework tasks</div></div>
</section>

<section class="admin-action">
  <h2>Next Operator Action</h2>
  <strong>${E(pl.nextOperatorAction)}</strong>
</section>

<h2>Station Board</h2>
<div class="station-board">
  ${pl.stations.map((st) => `
  <div class="station ${st.status}">
    <div class="sagent">${E(st.agentId)} · ${E(st.name)}</div>
    <div class="sname">${badge(st.status, plStatusBadgeCls(st.status))} <span class="dim" style="font-size:11px">${st.taskCount} task${st.taskCount === 1 ? "" : "s"}</span></div>
    <div class="spurpose">${E(st.purpose)}</div>
    ${st.lastTask ? `
      <div class="sline"><strong>Last:</strong> ${E(plPreview(st.lastTask.title, 60))}</div>
      <div class="sline dim">${E(st.lastTask.nextOperatorAction)}</div>
    ` : `<div class="sline dim">No task on this station.</div>`}
  </div>`).join("")}
</div>

<div class="form-card">
  <label>Create Demo Production Run — explicit, internal, clearly fictional clients</label>
  <form method="POST" action="/api/demo-order">
    <input type="hidden" name="returnTo" value="/production-line">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select name="demo" style="${inputStyle}">
        ${DEMO_CLIENTS.map((d) => `<option value="${E(d.key)}">${E(d.clientName)} — ${E(d.serviceId)}</option>`).join("")}
      </select>
      <button type="submit">Create Demo Production Run</button>
    </div>
  </form>
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/daily"><input type="hidden" name="returnTo" value="/production-line"><input type="hidden" name="action" value="run"><button type="submit">Run Cycle Now</button></form>
  </div>
</div>

${lineBlock("Client Line", pl.clientLine, "No client orders yet — create a demo production run above.")}
${lineBlock("Training Line", pl.trainingLine, "No training tasks today. Run a cycle with no open client orders.")}
${lineBlock("Rework Line", pl.reworkLine, "Nothing flagged for rework.")}
${lineBlock("Delivery Pack Line", pl.deliveryPackLine, "No delivery packs yet — approve a client output to a pack.")}

<h2>Recent Runs</h2>
${state.workRuns.length === 0 ? '<p class="dim">No production runs recorded yet.</p>' : [...state.workRuns].reverse().slice(0, 6).map((run) => `
<details class="run-drill">
  <summary>
    <span class="mono dim">${E(run.id)}</span>
    ${badge(run.mode, run.mode === "IDLE" ? "muted" : "info")}
    ${badge(run.status, run.status === "failed" ? "bad" : "ok")}
    <span class="dim" style="font-size:11.5px">via ${E(run.trigger)} · ${E(run.startedAt.slice(0, 19).replace("T", " "))} · ${run.steps.length} step${run.steps.length === 1 ? "" : "s"} · ${run.outputsCreated.length} output${run.outputsCreated.length === 1 ? "" : "s"}</span>
  </summary>
  <div class="drill-body">
    <div class="dim" style="font-size:12px">Next operator action: ${E(run.nextOperatorAction)}</div>
    ${run.steps.map((step) => `<div class="pl-task ${step.status === "completed" ? "completed" : step.status === "failed" ? "blocked" : "skipped"}">
      <div class="daily-header">${badge(step.agentId, "info")} ${badge(step.status, step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")} <span class="daily-title">${E(step.agentName)}</span> <span class="dim" style="font-size:11px">${E(step.jobType)}</span></div>
      <div class="dim" style="font-size:12px"><strong>Input:</strong> ${E(step.inputSummary)}</div>
      ${step.outputSummary ? `<div class="dim" style="font-size:12px"><strong>Output:</strong> ${E(step.outputSummary)}</div>` : ""}
      ${step.outputId ? `<div class="dim mono" style="font-size:11px">outputId: ${E(step.outputId)}</div>` : ""}
    </div>`).join("")}
  </div>
</details>`).join("")}`)
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

/**
 * The whole request router, extracted so a serverless entry (Vercel) can call
 * it directly with Node's (req, res) — no listener, no background timer.
 */
export const requestHandler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
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
      if (url === "/factory-run") return html(res, renderFactoryRun(state))
      if (url === "/delivery") return html(res, renderDelivery(state))
      if (url === "/production-line") return html(res, renderProductionLine(state))

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
          businessLoop: {
            servicesInCatalog: SERVICE_CATALOG.length,
            activeOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production").length,
            ordersReadyForReview: state.orders.filter((o) => o.status === "ready_for_review").length,
            deliveryPacks: {
              draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
              approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
              warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length,
            },
            caseRecords: state.caseRecords.length,
            trainingToday: `${ops.trainingToday}/5`,
          },
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
          latestWorkRun: state.workRuns[state.workRuns.length - 1] ?? null,
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
      if (url === "/api/production-line") {
        return json(res, productionLineFor(state))
      }
      if (url === "/api/delivery-packs") {
        return json(res, {
          total: state.deliveryPacks.length,
          packs: [...state.deliveryPacks].reverse().slice(0, 20),
          caseRecords: [...state.caseRecords].reverse().slice(0, 20),
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
      const returnToRun = params["returnTo"] === "/factory-run"
      const returnToPl = params["returnTo"] === "/production-line"

      // Order deliverables review here too — sync the order status afterwards
      // and send the operator back to the relevant review surface.
      const digitalBefore = store.getDailyDigital(id)
      const orderId = digitalBefore?.orderId
      const respond = (flash: string) =>
        returnToPl
          ? html(res, renderProductionLine(store.snapshot(), flash))
          : returnToRun
          ? html(res, renderFactoryRun(store.snapshot(), flash))
          : returnToAdmin
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
      const serviceIdRaw = (params["serviceId"] ?? "").trim()
      const languageRaw = (params["language"] ?? "").trim().toUpperCase()
      const urgencyRaw = (params["urgency"] ?? "").trim()
      const operatorNotes = (params["operatorNotes"] ?? "").trim()
      const returnToAdmin = params["returnTo"] === "/admin"
      const returnToRun = params["returnTo"] === "/factory-run"
      // Reject unknown service ids before anything is created — no order, no event.
      if (serviceIdRaw && !isValidServiceId(serviceIdRaw)) {
        return json(res, { error: "invalid service", received: serviceIdRaw, allowed: SERVICE_CATALOG.map((sv) => sv.id) }, 400)
      }
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
        ...(serviceIdRaw ? { serviceId: serviceIdRaw } : {}),
        ...(languageRaw === "PL" || languageRaw === "EN" ? { language: languageRaw as OrderLanguage } : {}),
        ...(urgencyRaw === "high" ? { urgency: "high" as const } : {}),
        ...(operatorNotes ? { operatorNotes } : {}),
      })
      // Produce immediately — the client should not wait for the next timer tick.
      const result = await runAutonomousCycle(store, undefined, "order_created")
      lastCycleSummary = `${result.mode}: orders=${result.ordersProduced.length}`
      if (returnToRun) {
        return html(res, renderFactoryRun(store.snapshot(), `Order ${order.id} accepted and produced — review below or on /admin.`))
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Order ${order.id} accepted and produced — review the deliverable below.`))
      }
      return html(res, renderOrders(store.snapshot(), `Order ${order.id} accepted and produced — review the deliverable below.`))
    }

    if (method === "POST" && url === "/api/delivery") {
      const params = await readBody(req)
      const action = params["action"] ?? ""
      const returnToAdmin = params["returnTo"] === "/admin"
      const returnToRun = params["returnTo"] === "/factory-run"
      const respond = (flash: string) =>
        returnToAdmin
          ? html(res, renderAdmin(store.snapshot(), flash))
          : returnToRun
          ? html(res, renderFactoryRun(store.snapshot(), flash))
          : html(res, renderDelivery(store.snapshot(), flash))

      if (action === "create") {
        const outputId = (params["outputId"] ?? "").trim()
        const digital = store.getDailyDigital(outputId)
        if (!digital?.orderId) return respond("Error: output not found or not a client-order deliverable.")
        // Creating a pack from a draft deliverable IS the approval decision:
        // route the output to the warehouse first (existing safe action),
        // then build the pack. Everything stays internal.
        if (digital.status === "draft_ready") {
          warehouseDigital(store, outputId)
          store.updateOrder(digital.orderId, { status: "approved", updatedAt: new Date().toISOString() })
        }
        const pack = createDeliveryPack(store, outputId)
        return respond(pack ? `Delivery pack ${pack.id} created (draft) — review it on /delivery.` : "Error: pack could not be created.")
      }
      if (action === "approve") {
        const pack = approveDeliveryPack(store, (params["id"] ?? "").trim())
        return respond(pack ? `Pack ${pack.id} approved — warehouse it when ready.` : "Error: pack not found or not in draft.")
      }
      if (action === "warehouse") {
        const record = warehouseDeliveryPack(store, (params["id"] ?? "").trim())
        return respond(record ? `Pack warehoused — case ${record.id} recorded. The operator delivers manually.` : "Error: pack not found or not approved.")
      }
      return respond("Error: unknown delivery action.")
    }

    if (method === "POST" && url === "/api/demo-order") {
      const params = await readBody(req)
      const returnTo = params["returnTo"] ?? ""
      const demo = DEMO_CLIENTS.find((d) => d.key === (params["demo"] ?? "").trim()) ?? DEMO_CLIENTS[0]!
      const respond = (flash: string) =>
        returnTo === "/admin" ? html(res, renderAdmin(store.snapshot(), flash))
        : returnTo === "/production-line" ? html(res, renderProductionLine(store.snapshot(), flash))
        : html(res, renderFactoryRun(store.snapshot(), flash))
      // Explicit operator action only. Internal only. Never duplicated silently.
      const existing = store.snapshot().orders.find(
        (o) => o.clientName === demo.clientName && (o.status === "new" || o.status === "in_production" || o.status === "ready_for_review"),
      )
      if (existing) {
        return respond(`Demo order ${existing.id} for ${demo.clientName} is already active — review it instead of duplicating.`)
      }
      const order = createOrder(store, {
        clientName: demo.clientName,
        department: "delivery",
        serviceId: demo.serviceId,
        language: demo.language,
        description: demo.description,
      })
      const result = await runAutonomousCycle(store, undefined, "order_created")
      lastCycleSummary = `${result.mode}: orders=${result.ordersProduced.length}`
      return respond(`Demo production run ${order.id} created for ${demo.clientName} (${demo.serviceId}) — internal only, nothing was sent anywhere.`)
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
      if (params["returnTo"] === "/factory-run") {
        return html(res, renderFactoryRun(store.snapshot(), `Autopilot ${autopilotEnabled ? "resumed" : "paused"}.`))
      }
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
}

const server = createServer(requestHandler)

/**
 * Serverless preview seed: with no background timer, a cold-start store would be
 * empty. Run exactly one bounded cycle so the cockpit shows real training work.
 * Idempotent per instance and per day — never spams (FC-012).
 */
let seeded = false
export async function ensureSeeded(): Promise<void> {
  if (seeded) return
  seeded = true
  try {
    if (store.snapshot().workRuns.length === 0) {
      const r = await runAutonomousCycle(store, undefined, "startup")
      lastCycleSummary = `${r.mode}: training=${r.trainingCreated} orders=${r.ordersProduced.length} reworks=${r.reworksRegenerated.length}`
    }
  } catch (err) {
    console.error("[seed] failed:", err)
  }
}

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

// Serverless (Vercel) has no persistent process: no background timer, no
// listener. The serverless entry imports `requestHandler` + `ensureSeeded`
// instead. Everything below only runs as a long-lived local/CI process.
if (!ON_VERCEL) {
setInterval(() => void autopilotTick("timer"), 60_000)

server.listen(PORT, () => {
  console.log(`\nFactory Core v0.2 — http://localhost:${PORT}`)
  console.log("  /admin        — boss/admin cockpit")
  console.log("  /operator     — admin cockpit alias")
  console.log("  /api/admin/state — read-only cockpit state (JSON)")
  console.log("  /api/work-runs   — read-only recent work runs (JSON)")
  console.log("  /factory-run  — run the whole business loop from one page")
  console.log("  /delivery     — delivery packs + case records")
  console.log("  /api/delivery-packs — read-only packs + cases (JSON)")
  console.log("  /production-line — agent production floor view")
  console.log("  /api/production-line — read-only production line (JSON)")
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
}
