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
  getIntegrityRecords,
  resetAgentIntegrity,
  isValidResetReason,
  INTEGRITY_LIMITS,
  INTEGRITY_RESET_REASONS,
  PRODUCER_AGENTS,
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
let lastCycleSummary = "jeszcze nieuruchomiony"

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

// Displayed-text glossary — internal enum values, ids, and event codes stay
// English (data/audit trail), only the human-facing label is Polish.
const STATUS_LABELS: Record<string, string> = {
  new: "nowe",
  in_production: "w produkcji",
  ready_for_review: "gotowe do przeglądu",
  approved: "zatwierdzone",
  closed: "zamknięte",
  rejected: "odrzucone",
  draft: "szkic",
  draft_ready: "szkic gotowy",
  accepted: "zaakceptowane",
  needs_rework: "wymaga poprawek",
  archived: "zarchiwizowane",
  warehouse_ready: "gotowe do magazynu",
  warehoused: "zmagazynowane",
  pending: "oczekujące",
  healthy: "zdrowy",
  watch: "obserwacja",
  quarantined: "kwarantanna",
  completed: "zakończone",
  waiting_review: "czeka na przegląd",
  ready_for_operator: "czeka na operatora",
  blocked: "zablokowane",
  queued: "w kolejce",
  skipped: "pominięte",
  idle: "bezczynne",
  warehouse: "magazyn",
  trash: "kosz",
  training: "trening",
  rework: "poprawka",
  "client order": "zlecenie klienta",
  client: "zlecenie klienta",
  delivery_pack: "pakiet dostawy",
  "pack draft": "szkic pakietu",
  "pack approved": "pakiet zatwierdzony",
  failed: "nieudane",
}
const statusLabel = (s: string): string => STATUS_LABELS[s] ?? s

const MODE_LABELS: Record<string, string> = {
  CLIENT_MODE: "TRYB KLIENTA",
  REWORK_MODE: "TRYB POPRAWEK",
  NO_CLIENT_TRAINING_MODE: "TRYB TRENINGOWY",
  IDLE: "BEZCZYNNY",
}
const modeLabel = (m: string): string => MODE_LABELS[m] ?? m

const DEPARTMENT_LABELS: Record<string, string> = {
  marketing: "Marketing",
  sales: "Sprzedaż",
  delivery: "Realizacja",
  research: "Badania",
  qa: "QA",
}
const departmentLabel = (d: string): string => DEPARTMENT_LABELS[d] ?? d

const STATION_ID_LABELS: Record<string, string> = {
  intake: "Przyjęcie",
  research: "Badania",
  strategy: "Strategia",
  content: "Treść",
  delivery: "Realizacja",
  qa: "QA",
  packaging: "Pakowanie",
  operator_review: "Przegląd Operatora",
}
const stationIdLabel = (s: string): string => STATION_ID_LABELS[s] ?? s

const nav = (active: string): string => {
  const links: [string, string][] = [
    ["/admin", "Kokpit"],
    ["/", "Fabryka"],
    ["/factory-run", "Start Dnia"],
    ["/production-line", "Linia Produkcyjna"],
    ["/orders", "Zlecenia"],
    ["/delivery", "Dostawy"],
    ["/leads", "Leady"],
    ["/warehouse", "Magazyn"],
    ["/trash", "Kosz"],
    ["/events", "Zdarzenia"],
    ["/daily-review", "Przegląd Dzienny"],
  ]
  return `<nav class="nav">${links.map(([href, label]) => `<a href="${href}" class="${active === href ? "active" : ""}">${label}</a>`).join("")}</nav>`
}

const layout = (title: string, activePath: string, body: string): string => `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rdzeń Fabryki — ${E(title)}</title>
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
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""

  const agentRows = [
    ["A", "Oficer Przyjęcia Sygnału", "intake", "Sygnały JobQueue", "IntakeBrief"],
    ["B", "Kwalifikator ICP", "qualification", "IntakeBriefs", "QualifiedLead / Trash"],
    ["C", "Wzbogacacz Leadów", "enrichment", "QualifiedLeads", "EnrichedLead"],
    ["D", "Strateg Oferty", "strategy", "EnrichedLeads", "OfferStrategy"],
    ["E", "Budowniczy Oferty", "offer-builder", "OfferStrategies", "DraftOffer"],
    ["F", "Ewaluator Oferty", "evaluation", "DraftOffers", "ScoredOffer"],
    ["G", "Redaktor Oferty", "editing", "Nieudane ScoredOffers", "Poprawiony DraftOffer"],
    ["H", "Strażnik Zatwierdzeń", "approval-gate", "Zaliczone ScoredOffers", "ApprovalItem (oczekujące)"],
    ["I", "Monitor Zatwierdzeń", "routing", "Zatwierdzone pozycje", "WarehouseItem"],
    ["J", "Obserwator Sukcesji", "succession", "Wszyscy agenci", "SuccessionFlag"],
    ["K", "Tropiciel Rodowodu", "lineage", "SuccessionFlags", "SuccessionBrief"],
    ["L", "Audytor Jakości", "quality", "WarehouseItems", "QualityMetric"],
    ["M", "Reporter Wydajności", "reporting", "QualityMetrics", "Scorecard"],
    ["N", "Dyrektor Fabryki", "direction", "Wszystkie etapy", "CorrectionBrief"],
  ]

  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length
  const mode = openOrders > 0 ? "CLIENT_MODE" : "NO_CLIENT_TRAINING_MODE"

  return layout("Fabryka", "/", `
<h1>Rdzeń Fabryki v0.2</h1>
<p class="sub">
  Linia Pozyskiwania Ofert + Zlecenia Klientów + Trening Dzienny — zgoda operatora wymagana zanim cokolwiek wyjdzie na zewnątrz ·
  ${badge(modeLabel(mode), openOrders > 0 ? "warn" : "info")} ·
  ${badge(autopilotEnabled ? "autopilot WŁ." : "autopilot WYŁ.", autopilotEnabled ? "ok" : "muted")}
  <span class="dim" style="font-size:11px">ostatni cykl: ${E(lastCycleSummary)}</span>
</p>
<form method="POST" action="/api/autopilot" style="margin-bottom:14px">
  <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
  <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wznów Autopilota"}</button>
</form>
${flashHtml}
<div class="stats">
  <div class="stat"><div class="v info">${state.signals.length}</div><div class="l">Sygnały</div></div>
  <div class="stat"><div class="v ok">${state.leads.filter((l) => l.qualified).length}</div><div class="l">Zakwalifikowane</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Oczekujące</div></div>
  <div class="stat"><div class="v ok">${state.warehouse.length}</div><div class="l">Magazyn</div></div>
  <div class="stat"><div class="v muted">${state.trash.length}</div><div class="l">Kosz</div></div>
  <div class="stat"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia</div></div>
</div>

<div class="form-card">
  <label>Zgłoś sygnał — opisz prospekta lub problem biznesowy (tylko wejście operatora)</label>
  <form method="POST" action="/api/signal">
    <textarea name="raw" placeholder="np. Założyciel B2B SaaS, seed stage, słaby pipeline, MRR utknął na $30K. Potrzebna oferta outboundowa." required></textarea>
    <div style="margin-top:8px"><button type="submit">Uruchom Pipeline →</button></div>
  </form>
</div>

<h2>Kolejka Zatwierdzeń (${pending.length} oczekujących)</h2>
${pending.length === 0 ? '<p class="dim">Brak ofert oczekujących na zatwierdzenie.</p>' : pending.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("pending"), "warn")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygnał: ${E(item.signalId)} · wynik: ${item.finalOffer.score} · iteracje: ${item.finalOffer.iterations}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div class="actions" style="margin-top:8px">
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="approve"><input type="hidden" name="id" value="${E(item.id)}"><button class="ok" type="submit">Zatwierdź → Magazyn</button></form>
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="reject"><input type="hidden" name="id" value="${E(item.id)}"><button class="bad" type="submit">Odrzuć</button></form>
  </div>
</div>`).join("")}

<h2>Rejestr Agentów</h2>
<div class="agents-grid">
${agentRows.map(([id, name, role, watch, next]) => `
<div class="agent-card">
  <div><span class="aid">${E(id)}</span><span class="aname">${E(name)}</span></div>
  <div class="arole">${E(role)}</div>
  <div class="afield">Obserwuje: <span>${E(watch)}</span></div>
  <div class="afield">Dalej: <span>${E(next)}</span></div>
</div>`).join("")}
</div>`)
}

function renderLeads(state: FactoryState): string {
  const leads = state.leads.filter((l) => l.qualified)
  return layout("Leady", "/leads", `
<h1>Zakwalifikowane Leady</h1>
<p class="sub">${leads.length} leadów przeszło kwalifikację ICP</p>
${leads.length === 0 ? '<p class="dim">Brak zakwalifikowanych leadów. Zgłoś sygnał na stronie Fabryki.</p>' : `
<table>
<thead><tr><th>ID Sygnału</th><th>Kategoria</th><th>Sygnały ICP</th><th>Wynik Dopasowania</th><th>Powody</th></tr></thead>
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
  return layout("Magazyn", "/warehouse", `
<h1>Magazyn — Zatwierdzone Wyniki</h1>
<p class="sub">${state.warehouse.length} ofert + ${digitalAssets.length} zasobów cyfrowych zatwierdzonych przez operatora · <strong style="color:#f85149">sent: false — brak automatycznej wysyłki</strong></p>

<h2>Zatwierdzone Oferty (${state.warehouse.length})</h2>
${state.warehouse.length === 0 ? '<p class="dim">Brak zatwierdzonych ofert.</p>' : state.warehouse.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("approved"), "ok")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygnał: ${E(item.signalId)} · wynik: ${item.qualityScore} · zatwierdzono: ${E(item.approvedAt.slice(0, 16).replace("T", " "))}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div style="margin-top:6px;font-size:12px;color:#8b949e">Agent I skierował do magazynu. Użycie tej oferty na zewnątrz wymaga działania operatora.</div>
</div>`).join("")}

<h2>Zasoby Cyfrowe (${digitalAssets.length})</h2>
${digitalAssets.length === 0 ? '<p class="dim">Brak zasobów cyfrowych w magazynie.</p>' : digitalAssets.map((d) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(departmentLabel(d.department), "info")} ${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}
    <strong>${E(d.title)}</strong>
    <span class="dim" style="font-size:12px;margin-left:8px">wynik: ${d.qualityScore} · rev ${d.revisionCount} · ${E(d.date)}</span>
  </div>
  <div class="offer-pre">${E(d.content)}</div>
</div>`).join("")}

<h2>Pakiety Dostawy (${state.deliveryPacks.length})</h2>
${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakietów dostawy.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Usługa</th><th>Status</th><th>Źródło</th><th>Utworzono</th></tr></thead>
<tbody>
${[...state.deliveryPacks].reverse().map((p) => `<tr>
  <td class="mono">${E(p.id)}</td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
  <td class="mono dim">${E(p.sourceOutputId)}</td>
  <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`)
}

function renderTrash(state: FactoryState): string {
  const trashedDigitals = state.dailyDigitals.filter((d) => d.location === "trash")
  return layout("Kosz", "/trash", `
<h1>Kosz — Odrzucone i Nieudane</h1>
<p class="sub">${state.trash.length} pozycji z pipeline'u + ${trashedDigitals.length} odrzuconych zasobów cyfrowych</p>

<h2>Pozycje z Pipeline'u (${state.trash.length})</h2>
${state.trash.length === 0 ? '<p class="dim">Kosz jest pusty.</p>' : `
<table>
<thead><tr><th>ID</th><th>ID Sygnału</th><th>Powód</th><th>Odrzucono</th></tr></thead>
<tbody>
${state.trash.map((t) => `<tr>
  <td class="mono">${E(t.id)}</td>
  <td class="mono">${E(t.signalId)}</td>
  <td>${E(t.reason)}</td>
  <td class="dim">${E(t.trashedAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}

<h2>Odrzucone Zasoby Cyfrowe (${trashedDigitals.length})</h2>
${trashedDigitals.length === 0 ? '<p class="dim">Brak odrzuconych zasobów.</p>' : `
<table>
<thead><tr><th>ID</th><th>Dział</th><th>Tytuł</th><th>Feedback</th><th>Data</th></tr></thead>
<tbody>
${trashedDigitals.map((d) => `<tr>
  <td class="mono">${E(d.id)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
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
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""

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
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily" style="display:flex;gap:6px;align-items:flex-start">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">→ Magazyn</button>
  </form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Feedback do poprawki..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="warn" type="submit" style="align-self:flex-start">Wymaga Poprawek</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Powód odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzuć do Kosza</button>
    </form>
  </div>
</div>` : `<div class="dim" style="font-size:12px">Status: ${E(statusLabel(item.status))}${item.location === "warehouse" ? " · w magazynie" : ""}</div>`

    return `<div class="daily-card ${item.status === "draft_ready" ? "draft" : item.status}">
  <div class="daily-header">
    ${badge(departmentLabel(item.department), deptBadgeCls(item.department))}
    ${badge(statusLabel(item.status), statusBadgeCls(item.status))}
    <span class="daily-title">${E(item.title)}</span>
    ${revNote}
    <span class="dim" style="font-size:11px">wynik ${item.qualityScore}${scoreBar}</span>
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

  return layout("Przegląd Dzienny", "/daily-review", `
<h1>Przegląd Dzienny — TRYB TRENINGOWY</h1>
<p class="sub">5 cyfrowych deliverabli dziennie · operator ocenia każdy · feedback wpływa na kolejny przebieg</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${todayItems.length}</div><div class="l">Dziś</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Do Przeglądu</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.status === "accepted").length}</div><div class="l">Zaakceptowane</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">W Magazynie</div></div>
  <div class="stat"><div class="v bad">${trainingItems.filter((d) => d.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
  <div class="stat"><div class="v muted">${state.feedbackEvents.length}</div><div class="l">Zdarzenia Feedbacku</div></div>
</div>

${todayItems.length === 0 ? `
<div class="form-card">
  <p style="margin-bottom:10px;color:#8b949e">Brak misji uruchomionych na dziś (${today}).</p>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="action" value="run">
    <input type="hidden" name="date" value="${today}">
    <button type="submit">Uruchom Dzisiejsze 5 Misji →</button>
  </form>
</div>` : `
<h2>Dziś — ${today} (${todayItems.length} deliverabli)</h2>
${todayItems.map(renderCard).join("")}
`}

${olderDates.length > 0 ? `
<h2>Poprzednie Dni</h2>
<table>
<thead><tr><th>Data</th><th>Dział</th><th>Tytuł</th><th>Status</th><th>Wynik</th><th>Lokalizacja</th></tr></thead>
<tbody>
${olderDates.flatMap((date) =>
  olderItems
    .filter((d) => d.date === date)
    .map((d) => `<tr>
  <td class="dim">${E(d.date)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
  <td>${E(d.title)}</td>
  <td>${badge(statusLabel(d.status), d.status === "accepted" ? "ok" : d.status === "rejected" ? "bad" : "warn")}</td>
  <td class="mono">${d.qualityScore}</td>
  <td class="dim">${E(statusLabel(d.location))}</td>
</tr>`)
).join("")}
</tbody>
</table>` : ""}

${state.feedbackEvents.length > 0 ? `
<h2>Zdarzenia Feedbacku — Ograniczenia dla Kolejnego Przebiegu</h2>
<table>
<thead><tr><th>Czas</th><th>Dział</th><th>Akcja</th><th>Feedback</th></tr></thead>
<tbody>
${[...state.feedbackEvents].reverse().slice(0, 20).map((e) => `<tr>
  <td class="mono dim">${E(e.timestamp.slice(0, 16).replace("T", " "))}</td>
  <td>${badge(departmentLabel(e.department), "muted")}</td>
  <td>${badge(statusLabel(e.action), e.action === "accepted" || e.action === "warehoused" ? "ok" : e.action === "needs_rework" ? "warn" : "bad")}</td>
  <td class="dim" style="font-size:12px">${E(e.feedback ?? "—")}</td>
</tr>`).join("")}
</tbody>
</table>` : ""}`)
}

function renderOrders(state: FactoryState, flash?: string): string {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""
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
    if (!d) return '<div class="dim" style="font-size:12px">Brak deliverabla — autopilot wyprodukuje go w ciągu minuty.</div>'
    const reviewable = d.status === "draft_ready"
    return `
<div class="daily-content">${E(d.content)}</div>
<div class="dim" style="font-size:11px;margin-bottom:8px">deliverable: ${E(d.id)} · wynik ${d.qualityScore} · rev ${d.revisionCount} · status ${E(statusLabel(d.status))}</div>
${reviewable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily"><input type="hidden" name="action" value="warehouse"><input type="hidden" name="id" value="${E(d.id)}"><button class="ok" type="submit">Zatwierdź → Magazyn</button></form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Co powinno się zmienić..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14;align-self:flex-start">Zgłoś Poprawkę</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Powód odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzuć Wynik Zlecenia</button>
    </form>
  </div>
</div>` : ""}`
  }

  return layout("Zlecenia", "/orders", `
<h1>Zlecenia Klientów</h1>
<p class="sub">Prawdziwa praca — zlecenie klienta zawsze ma priorytet nad treningiem dziennym. Nic nie jest dostarczane bez zgody operatora.</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${state.orders.length}</div><div class="l">Razem</div></div>
  <div class="stat"><div class="v ${open.length ? "warn" : "ok"}">${open.length}</div><div class="l">W Produkcji</div></div>
  <div class="stat"><div class="v ${ready.length ? "warn" : "ok"}">${ready.length}</div><div class="l">Gotowe do Przeglądu</div></div>
  <div class="stat"><div class="v ok">${state.orders.filter((o) => o.status === "approved" || o.status === "closed").length}</div><div class="l">Zatwierdzone</div></div>
  <div class="stat"><div class="v bad">${state.orders.filter((o) => o.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
</div>

<div class="form-card">
  <label>Nowe zlecenie klienta — dla kogo i czego potrzebuje?</label>
  <form method="POST" action="/api/order">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <input name="contact" placeholder="Kontakt (opcjonalnie)" style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <select name="department" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzedaż</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
    </div>
    <textarea name="description" placeholder="np. Tekst strony lądowania dla firmy budowlanej sprzedającej garaże prefabrykowane — potrzebna sekcja cenowa i CTA formularza kontaktowego" required></textarea>
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie → Wyprodukuj Teraz</button></div>
  </form>
</div>

<h2>Zlecenia (${orders.length})</h2>
${orders.length === 0 ? '<p class="dim">Brak zleceń. Gdy nie ma zleceń, fabryka uruchamia zamiast tego 5 losowych misji treningowych dziennie.</p>' : orders.map((o) => `
<div class="daily-card ${o.status === "ready_for_review" ? "draft" : o.status === "approved" || o.status === "closed" ? "accepted" : o.status === "rejected" ? "rejected" : "needs_rework"}">
  <div class="daily-header">
    ${badge(statusLabel(o.status), orderBadgeCls(o.status))}
    ${badge(departmentLabel(o.department), "info")}
    <span class="daily-title">${E(o.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(o.id)}</span>
    ${o.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(o.taskType)}</span>` : ""}
    ${o.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${o.revisionCount}</span>` : ""}
  </div>
  <div style="font-size:12.5px;color:#c9d1d9;margin-bottom:8px">"${E(o.description)}"</div>
  ${o.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-bottom:6px">Ostatni feedback: ${E(o.operatorFeedback)}</div>` : ""}
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

  let standingStill: string
  if (!autopilotEnabled) {
    standingStill =
      "Fabryka jest wstrzymana, bo autopilot jest WYŁĄCZONY. Nie uruchomi sama kolejnych cykli, dopóki nie zostanie wznowiony." +
      (readyOrders + trainingDrafts > 0
        ? ` Tymczasem do przeglądu czeka: zlecenia klienta — ${readyOrders}, szkice treningowe — ${trainingDrafts}.`
        : "")
  } else if (openOrders > 0) {
    standingStill = `Fabryka produkuje: otwarte zlecenia klienta w pipeline — ${openOrders}.`
  } else if (needsRework > 0) {
    standingStill = `Fabryka czeka na cykl poprawek, by odtworzyć oznaczone wyniki: ${needsRework}.`
  } else if (readyOrders + trainingDrafts + pendingApprovals + deliveryPacksDraft + deliveryPacksApproved > 0) {
    standingStill =
      `Fabryka czeka na przegląd operatora: zlecenia klienta — ${readyOrders}, szkice treningowe — ${trainingDrafts}.` +
      (deliveryPacksDraft + deliveryPacksApproved > 0
        ? ` Pakiety dostawy czekają: szkice — ${deliveryPacksDraft}, zatwierdzone — ${deliveryPacksApproved}.`
        : "") +
      (pendingApprovals > 0 ? ` Dodatkowo pozycje do zatwierdzenia w pipeline: ${pendingApprovals}.` : "")
  } else if (trainingToday >= 5) {
    standingStill = "Fabryka jest bezczynna, bo dzienny limit treningu jest wykonany, a nie ma otwartych zleceń klienta."
  } else {
    standingStill = `Fabryka jest bezczynna: limit treningu na dziś to ${trainingToday}/5 — uruchom cykl treningowy lub poczekaj na kolejny tick autopilota.`
  }

  // Pending operator-review queues always outrank the paused-autopilot hint:
  // resuming autopilot clears none of them, so telling the operator to resume
  // while work sits at a review gate would be a misleading next action.
  const [nextActionTitle, nextActionDetail]: [string, string] = readyOrders > 0
    ? ["Przejrzyj zlecenie klienta", `Zlecenia klienta czekające na zatwierdzenie, poprawkę lub odrzucenie: ${readyOrders}.`]
    : needsRework > 0
      ? ["Poczekaj na cykl poprawek lub go uruchom", `Pozycje oznaczone jako wymaga poprawek: ${needsRework}.`]
      : trainingDrafts > 0
        ? ["Przejrzyj zasoby treningowe", `Szkice treningowe gotowe do przeglądu operatora: ${trainingDrafts}.`]
        : deliveryPacksDraft > 0
          ? ["Zatwierdź pakiet dostawy", `Pakiety dostawy w wersji roboczej na /delivery: ${deliveryPacksDraft}.`]
          : deliveryPacksApproved > 0
            ? ["Zmagazynuj zatwierdzony pakiet dostawy", `Zatwierdzone pakiety gotowe na /delivery: ${deliveryPacksApproved}.`]
            : pendingApprovals > 0
              ? ["Przejrzyj pozycję do zatwierdzenia w pipeline", `Oczekujące pozycje do zatwierdzenia: ${pendingApprovals}.`]
              : !autopilotEnabled
                ? ["Wznów autopilota lub świadomie zostaw wstrzymanego", "Zapisane ustawienie autopilota to WYŁ., a nic nie czeka na przegląd."]
                : trainingToday < 5 && openOrders === 0
                  ? ["Uruchom cykl treningowy", `Dziś jest ${trainingToday}/5 zasobów treningowych.`]
                  : ["Dodaj zlecenie klienta / system bezczynny", "Nic nie wymaga przeglądu. Fabryka jest gotowa na nową pracę dla klienta."]

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
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""

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
    <button class="ok" type="submit">Zatwierdź -> Magazyn</button>
  </form>
  <form method="POST" action="/api/delivery">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="create">
    <input type="hidden" name="outputId" value="${E(d.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Zatwierdź -> Pakiet Dostawy</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zgłoś Poprawkę</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Powód odrzucenia..." required>
    <button class="bad" type="submit">Odrzuć</button>
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
    ${badge(statusLabel(order.status), orderBadgeCls(order.status))}
    ${badge(departmentLabel(order.department), "info")}
    <span class="daily-title">${E(order.clientName)}</span>
    ${order.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(order.taskType)}</span>` : ""}
    <span class="dim" style="font-size:11px">rev ${order.revisionCount}</span>
  </div>
  <div class="dim" style="font-size:12px;margin-bottom:5px">kontakt: ${E(order.contact ?? "nie podano")}</div>
  <div style="font-size:12.5px;color:#dbe7f0">${E(order.description)}</div>
  ${d ? `
    <div class="admin-preview">${E(preview(d.content))}</div>
    <div class="dim" style="font-size:11px;margin-top:6px">deliverable ${E(d.id)} · od ${E(d.createdByAgentId)} · wynik ${d.qualityScore} · rev ${d.revisionCount} · ${E(statusLabel(d.status))} · ${E(d.taskType ?? d.type)}</div>
    ${d.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:4px;color:#d29922">feedback operatora: ${E(d.operatorFeedback)}${d.revisionCount > 0 ? ` (zastosowano w rev ${d.revisionCount})` : ""}</div>` : ""}
    ${renderOrderActions(d)}
  ` : '<div class="dim" style="font-size:12px;margin-top:8px">Brak deliverabla.</div>'}
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
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Magazyn</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Poprawka</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Powód odrzucenia..." required>
    <button class="bad" type="submit">Odrzuć</button>
  </form>
</div>`
  }

  const renderTrainingItem = (item: DailyDigital): string => `
<div class="admin-order ${item.status === "rejected" ? "bad" : item.status === "accepted" ? "done" : item.status === "needs_rework" ? "ready" : ""}" id="out-${E(item.id)}">
  <div class="daily-header">
    ${badge(statusLabel(item.status), itemBadgeCls(item.status))}
    ${badge(departmentLabel(item.department), "info")}
    ${badge(statusLabel("training"), "muted")}
    <span class="daily-title">${E(item.title)}</span>
    <span class="dim" style="font-size:11px">${E(item.taskType ?? item.type)} · od ${E(item.createdByAgentId)} · wynik ${item.qualityScore} · rev ${item.revisionCount} · ${E(item.date)}</span>
  </div>
  <div class="dim mono" style="font-size:11px;margin-top:4px">output ${E(item.id)}</div>
  <div class="admin-preview">${E(preview(item.content, 300))}</div>
  ${item.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:6px;color:#d29922">feedback: ${E(item.operatorFeedback)}${item.revisionCount > 0 ? ` (zastosowano w rev ${item.revisionCount})` : ""}</div>` : ""}
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
    N: "Dyrektor Fabryki",
    MA: "Producent Marketingu",
    SA: "Producent Sprzedaży",
    DA: "Producent Realizacji",
    RA: "Producent Badań",
    QAA: "Producent QA",
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
        ? `Operator: przejrzyj ${step?.outputId ?? "output"}`
        : status === "blocked"
          ? "Sprawdź nieudany przebieg pracy poniżej"
          : "Czeka na pasujące zlecenie, poprawkę lub slot treningowy"

    return `
<div class="work-agent ${status === "blocked" ? "failed" : status === "waiting_review" ? "active" : "waiting"}">
  <div class="name">${E(agentId)} · ${E(agentNames[agentId])}</div>
  <div class="meta">${E(statusLabel(status))}${step?.department ? ` · ${E(departmentLabel(step.department))}` : ""}${step ? ` · ostatni przebieg ${E(step.finishedAt.slice(0, 19).replace("T", " "))}` : ""}</div>
  <div class="line"><strong>Ostatnie zadanie:</strong> ${E(step?.jobType ?? "jeszcze żadne")}</div>
  <div class="line"><strong>Ostatnie wejście:</strong> ${step ? E(preview(step.inputSummary, 110)) : "—"}</div>
  <div class="line"><strong>Ostatnie wyjście:</strong> ${E(step?.outputSummary ? preview(step.outputSummary, 110) : "Jeszcze brak zarejestrowanego wyjścia")}</div>
  ${step?.outputId ? `<div class="line mono" style="font-size:11px"><strong>ID wyjścia:</strong> <a href="#out-${E(step.outputId)}">${E(step.outputId)}</a></div>` : ""}
  ${relatedOrder ? `<div class="line mono" style="font-size:11px"><strong>Powiązane zlecenie:</strong> ${E(relatedOrder)}</div>` : ""}
  <div class="line"><strong>Dalej:</strong> ${E(next)}</div>
</div>`
  }

  const renderStep = (step: FactoryWorkRun["steps"][number]): string => `
<div class="timeline-step ${step.status}">
  <div class="daily-header">
    ${badge(step.agentId, "info")}
    ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")}
    <span class="daily-title">${E(step.agentName)}</span>
    <span class="dim" style="font-size:11px">${E(step.jobType)}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wejście:</strong> ${E(step.inputSummary)}</div>
  ${step.outputSummary ? `<div class="dim" style="font-size:12px;margin-top:4px"><strong>Wyjście:</strong> ${E(step.outputSummary)}</div>` : ""}
  ${step.outputId ? `<div class="dim mono" style="font-size:11px;margin-top:4px">outputId: ${E(step.outputId)}</div>` : ""}
  ${step.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:4px">ograniczenia: ${E(step.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim mono" style="font-size:10.5px;margin-top:4px">${E(step.startedAt.slice(11, 19))} -> ${E(step.finishedAt.slice(11, 19))}</div>
</div>`

  return layout("Kokpit Szefa/Administratora", "/admin", `
<div class="admin-shell">
  <section class="admin-hero">
    <div>
      <div class="admin-kicker">Centrum dowodzenia założyciela</div>
      <h1 class="admin-title">Kokpit Szefa/Administratora</h1>
      <p class="admin-sub">Operacyjna kontrola nad factory-core v0.2.1. Autonomia myślenia bez autonomii działania: system może produkować pracę wewnętrzną, ale operator zatwierdza każdy krok wychodzący na zewnątrz.</p>
    </div>
    <div class="admin-mode">
      ${badge(modeLabel(mode), mode === "CLIENT_MODE" ? "warn" : mode === "REWORK_MODE" ? "warn" : mode === "NO_CLIENT_TRAINING_MODE" ? "info" : "muted")}
      ${badge(autopilotEnabled ? "autopilot WŁ." : "autopilot WYŁ.", autopilotEnabled ? "ok" : "bad")}
      ${badge("TRYB BEZPIECZNY — brak wysyłki na zewnątrz", "ok")}
      <span class="dim" style="font-size:12px">ostatni cykl: ${lastRun
        ? `${E(modeLabel(lastRun.mode))} · ${E(statusLabel(lastRun.status))} · via ${E(lastRun.trigger)} · ${E(lastRun.finishedAt.slice(0, 19).replace("T", " "))}`
        : "jeszcze nic nie zarejestrowano"}</span>
      <span class="dim" style="font-size:12px">dalej: ${E(nextAction[0])}</span>
      <span class="dim" style="font-size:11px">lokalna pojedyncza instancja · nic nie opuszcza fabryki bez zgody operatora</span>
    </div>
  </section>

  ${flashHtml}

  <section class="admin-grid" aria-label="Executive Summary">
    <div class="admin-card"><div class="v info">${state.orders.length}</div><div class="l">Zlecenia razem</div></div>
    <div class="admin-card"><div class="v ${readyOrders.length ? "warn" : "ok"}">${readyOrders.length}</div><div class="l">Zlecenia gotowe do przeglądu</div></div>
    <div class="admin-card"><div class="v ${openOrders.length ? "warn" : "ok"}">${openOrders.length}</div><div class="l">Otwarte zlecenia</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Licznik treningu</div></div>
    <div class="admin-card"><div class="v ${pendingReviewCount ? "warn" : "ok"}">${pendingReviewCount}</div><div class="l">Pozycje do przeglądu</div></div>
    <div class="admin-card"><div class="v ok">${state.warehouse.length + warehouseAssets.length}</div><div class="l">Stan magazynu</div></div>
    <div class="admin-card"><div class="v bad">${trashCount}</div><div class="l">Kosz/odrzucone razem</div></div>
    <div class="admin-card"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia razem</div></div>
  </section>

  <section class="admin-grid" aria-label="Business Loop">
    <div class="admin-card"><div class="v info">${SERVICE_CATALOG.length}</div><div class="l">Usługi w katalogu</div></div>
    <div class="admin-card"><div class="v ${openOrders.length + readyOrders.length ? "warn" : "ok"}">${openOrders.length + readyOrders.length}</div><div class="l">Aktywne zlecenia klientów</div></div>
    <div class="admin-card"><div class="v ${packsDraft.length + packsApproved.length ? "warn" : "ok"}">${packsDraft.length}/${packsApproved.length}/${packsReady.length}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Limit treningu</div></div>
    <div class="admin-card"><div class="v ok">${state.caseRecords.length}</div><div class="l">Karty spraw</div></div>
  </section>

  <section class="admin-action">
    <h2>Następna Akcja Operatora</h2>
    <strong>${E(nextAction[0])}</strong>
    <p class="dim">${E(nextAction[1])}</p>
  </section>

  <section class="admin-two">
    <div class="admin-panel">
      <h2>Dodaj Zlecenie Klienta</h2>
      <form method="POST" action="/api/order">
        <input type="hidden" name="returnTo" value="/admin">
        <div class="admin-input-row">
          <input name="clientName" placeholder="Nazwa klienta" required>
          <input name="contact" placeholder="Kontakt">
          <select name="serviceId">
            <option value="">— usługa: dowolny brief —</option>
            ${SERVICE_CATALOG.map((s) => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("")}
          </select>
          <select name="language">
            <option value="EN">EN</option>
            <option value="PL">PL</option>
          </select>
          <select name="department">
            <option value="marketing">Marketing</option>
            <option value="sales">Sprzedaż</option>
            <option value="delivery" selected>Realizacja</option>
            <option value="research">Badania</option>
            <option value="qa">QA</option>
          </select>
        </div>
        <textarea name="description" placeholder="Opisz żądany deliverable..." required></textarea>
        <div class="admin-actions"><button type="submit">Dodaj Zlecenie</button></div>
      </form>
    </div>

    <div class="admin-panel hot">
      <h2>Kontrola Autopilota</h2>
      <p class="dim" style="margin-bottom:10px">Zapisany stan: <strong>${autopilotEnabled ? "WŁ." : "WYŁ."}</strong></p>
      <div class="admin-actions">
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="off">
          <button class="bad" type="submit">Wstrzymaj Autopilota</button>
        </form>
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="on">
          <button class="ok" type="submit">Wznów Autopilota</button>
        </form>
        <form method="POST" action="/api/daily">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="run">
          <input type="hidden" name="date" value="${today}">
          <button type="submit">Uruchom Cykl Treningowy</button>
        </form>
        <form method="POST" action="/api/demo-order">
          <input type="hidden" name="returnTo" value="/admin">
          <button type="submit">Utwórz Demo Zlecenie HVAC</button>
        </form>
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Zleceń</h2>
    <div class="admin-three">
      <div class="stat"><div class="v info">${openOrders.length}</div><div class="l">nowe / w produkcji</div></div>
      <div class="stat"><div class="v warn">${readyOrders.length}</div><div class="l">gotowe do przeglądu</div></div>
      <div class="stat"><div class="v ok">${approvedOrders.length}</div><div class="l">zatwierdzone / zamknięte</div></div>
    </div>
  </section>

  <section class="admin-two">
    <div class="admin-list">
      ${orderGroup("Kontrola Zleceń Klientów - nowe / w produkcji", openOrders, "Brak zleceń obecnie w produkcji.")}
      ${orderGroup("Kontrola Zleceń Klientów - gotowe do przeglądu", readyOrders, "Brak zleceń klientów czekających na przegląd.", "orders-review")}
    </div>
    <div class="admin-list">
      ${orderGroup("Kontrola Zleceń Klientów - zatwierdzone / zamknięte", approvedOrders, "Brak zatwierdzonych lub zamkniętych zleceń.")}
      ${orderGroup("Kontrola Zleceń Klientów - odrzucone", rejectedOrders, "Brak odrzuconych zleceń.")}
    </div>
  </section>

  <section class="admin-panel" id="training-review">
    <h2>Przegląd Treningu Dziennego</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${todayTraining.length}/5</div><div class="l">dziś</div></div>
      <div class="stat"><div class="v warn">${pendingTraining.length}</div><div class="l">oczekujące szkic gotowy</div></div>
      <div class="stat"><div class="v ok">${acceptedTraining.length}</div><div class="l">zaakceptowane</div></div>
      <div class="stat"><div class="v bad">${rejectedTraining.length}</div><div class="l">odrzucone</div></div>
      <div class="stat"><div class="v warn">${trainingItems.filter((d) => d.status === "needs_rework").length}</div><div class="l">wymaga poprawek</div></div>
      <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">zmagazynowane</div></div>
    </div>
    <div class="admin-list">
      ${trainingItems.length === 0 ? '<p class="dim">Brak zasobów treningowych.</p>' : [...trainingItems].reverse().slice(0, 12).map(renderTrainingItem).join("")}
    </div>
  </section>

  <section class="admin-panel" id="integrity-guard">
    <h2>Integrity Guard — Monitor Pinokia</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Nos rośnie, gdy odrzucasz (+${INTEGRITY_LIMITS.growRejected}) lub zwracasz do poprawki (+${INTEGRITY_LIMITS.growRework}), a maleje, gdy akceptujesz (−${INTEGRITY_LIMITS.shrinkAccepted}). Przy ${INTEGRITY_LIMITS.critical}cm protokół HRAR kwarantannuje agenta z produkcji klienckiej — trening pozostaje dozwolony. Tylko Twój reset (God Layer) to znosi.</p>
    <table class="admin-table">
      <thead><tr><th>Agent</th><th>Nos</th><th>Status</th><th>Naruszenia</th><th>Ostatni sygnał</th><th>Akcja</th></tr></thead>
      <tbody>
        ${getIntegrityRecords(store).map((r) => `<tr>
          <td class="mono">${E(r.agentId)}</td>
          <td><span class="mono">${r.noseLength}cm</span><span class="score-bar"><span class="score-fill" style="width:${r.noseLength}%;background:${r.noseLength >= INTEGRITY_LIMITS.critical ? "#f85149" : r.noseLength >= INTEGRITY_LIMITS.watch ? "#d29922" : "#3fb950"}"></span></span></td>
          <td>${badge(statusLabel(r.status), r.status === "quarantined" ? "bad" : r.status === "watch" ? "warn" : "ok")}</td>
          <td class="mono">${r.breaches}</td>
          <td class="dim" style="font-size:11.5px">${E(r.lastSignal ?? "—")}</td>
          <td>${r.noseLength > 0 || r.status !== "healthy" ? `
            <form method="POST" action="/api/integrity" style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
              <input type="hidden" name="action" value="reset">
              <input type="hidden" name="agentId" value="${E(r.agentId)}">
              <select name="reason" required style="font-size:11px">
                <option value="">powód...</option>
                ${INTEGRITY_RESET_REASONS.map((rr) => `<option value="${E(rr)}">${E(rr)}</option>`).join("")}
              </select>
              <input name="note" placeholder="notatka (opcjonalnie)" style="font-size:11px;width:110px">
              <button type="submit" style="font-size:11.5px">Reset (God Layer)</button>
            </form>` : '<span class="dim" style="font-size:11.5px">—</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </section>

  <section class="admin-panel">
    <h2>Linia Produkcyjna Agentów</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Skrócony widok hali produkcyjnej. Pełny widok: <a href="/production-line" style="color:#58a6ff">/production-line</a></p>
    ${(() => { const pl = productionLineFor(state); return `
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zadania klienckie</div></div>
      <div class="stat"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
      <div class="stat"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft + pl.deliveryPacks.approved}</div><div class="l">Zadania pakietów czekające</div></div>
      <div class="stat"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Trening dziś</div></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>Stacja</th><th>Agent</th><th>Status</th><th>Zadania</th><th>Ostatnie</th></tr></thead>
      <tbody>
        ${pl.stations.map((st) => `<tr>
          <td>${E(st.name)}</td>
          <td class="mono">${E(st.agentId)}</td>
          <td>${badge(statusLabel(st.status), plStatusBadgeCls(st.status))}</td>
          <td class="mono">${st.taskCount}</td>
          <td class="dim" style="font-size:11.5px">${st.lastTask ? E(plPreview(st.lastTask.title, 46)) : "—"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <p class="dim" style="font-size:12px;margin-top:6px">Następna akcja operatora: <strong>${E(pl.nextOperatorAction)}</strong></p>`})()}
  </section>

  <section class="admin-panel">
    <h2>Warsztat Fabryki</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v ${lastRun?.status === "failed" ? "bad" : lastRun ? "ok" : "muted"}">${E(lastRun ? statusLabel(lastRun.status) : "brak")}</div><div class="l">Status ostatniego cyklu</div></div>
      <div class="stat"><div class="v info">${E(modeLabel(lastRun?.mode ?? mode))}</div><div class="l">Ostatni tryb</div></div>
      <div class="stat"><div class="v warn">${lastRun?.steps.length ?? 0}</div><div class="l">Kroki agentów</div></div>
    </div>
    <div class="idle-box" style="margin-bottom:10px">
      <div class="kicker">Dlaczego Stoi w Miejscu</div>
      <strong>${E(ops.standingStill)}</strong>
      ${lastRun?.idleReason ? `<div class="dim" style="font-size:11.5px;margin-top:4px">Ostatni zarejestrowany cykl mówi: ${E(lastRun.idleReason)}</div>` : ""}
      <div class="dim" style="font-size:12px;margin-top:4px">Następna akcja operatora: ${E(nextAction[0])} — ${E(nextAction[1])}</div>
    </div>
    <div class="workroom-grid" style="margin-bottom:12px">
      ${workroomAgents.map(renderWorkAgent).join("")}
    </div>
    <div class="admin-two">
      <div class="admin-subpanel">
        <h2>Oś Czasu Ostatniego Przebiegu Pracy</h2>
        ${lastRun ? `
          <p class="dim" style="font-size:12px;margin-bottom:8px">${E(lastRun.id)} · ${E(lastRun.trigger)} · ${E(modeLabel(lastRun.mode))} · ${E(lastRun.startedAt.slice(0, 19).replace("T", " "))} -> ${E(lastRun.finishedAt.slice(11, 19))} · wyjścia ${lastRun.outputsCreated.length}</p>
          <div class="timeline">${lastRun.steps.map(renderStep).join("")}</div>
        ` : '<p class="dim">Żaden autonomiczny cykl jeszcze nie zarejestrował pracy.</p>'}
      </div>
      <div class="admin-subpanel">
        <h2>Czeka na Operatora</h2>
        <p class="dim" style="font-size:12px;margin-bottom:8px">${E(ops.standingStill)}</p>
        <table class="admin-table">
          <tbody>
            <tr><th><a href="#orders-review">Zlecenia klientów gotowe do przeglądu</a></th><td>${readyOrders.length}</td></tr>
            <tr><th><a href="#training-review">Szkice treningowe czekające</a></th><td>${pendingTraining.length}</td></tr>
            <tr><th><a href="#training-review">Poprawki czekające na cykl</a></th><td>${reworkItems.length}</td></tr>
            <tr><th>Pozycje do zatwierdzenia w pipeline (zobacz /factory)</th><td>${pendingApprovalCount}</td></tr>
          </tbody>
        </table>
        ${readyOrders.length + pendingTraining.length + reworkItems.length + packsDraft.length + packsApproved.length > 0 ? `
        <table class="admin-table" style="margin-top:10px">
          <thead><tr><th>Pozycja</th><th>Wyjście</th><th>Źródło</th><th>Producent</th><th>Dział</th><th>Wynik</th><th>Rev</th><th>Bezpieczna następna akcja</th></tr></thead>
          <tbody>
            ${readyOrders.map((o) => {
              const d = deliverableFor(o)
              return `<tr>
                <td>${E(o.clientName)}</td>
                <td class="mono">${d ? `<a href="#out-${E(d.id)}">${E(d.id)}</a>` : "—"}</td>
                <td>${badge(statusLabel("client"), "warn")}</td>
                <td class="mono">${E(d?.createdByAgentId ?? "—")}</td>
                <td>${E(departmentLabel(o.department))}</td>
                <td class="mono">${d?.qualityScore ?? "—"}</td>
                <td class="mono">${d?.revisionCount ?? 0}</td>
                <td class="dim" style="font-size:11.5px"><a href="#${d ? `out-${E(d.id)}` : "orders-review"}">Zatwierdź → Magazyn · Poprawka · Odrzuć</a></td>
              </tr>`
            }).join("")}
            ${pendingTraining.slice(0, 8).map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("training"), "muted")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="#out-${E(d.id)}">Akceptuj · Magazyn · Poprawka · Odrzuć</a></td>
              </tr>`).join("")}
            ${reworkItems.map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("rework"), "warn")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px">Odtworzy się w kolejnym cyklu — użyj "Uruchom Cykl Treningowy"</td>
              </tr>`).join("")}
            ${packsDraft.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack draft"), "info")}</td>
                <td class="mono">—</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">—</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zatwierdź pakiet na /delivery</a></td>
              </tr>`).join("")}
            ${packsApproved.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack approved"), "ok")}</td>
                <td class="mono">—</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">—</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zmagazynuj pakiet na /delivery</a></td>
              </tr>`).join("")}
          </tbody>
        </table>` : ""}
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Ostatnie Przebiegi Pracy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Kliknij przebieg, by zobaczyć każdy krok agenta: wejście, wyjście, ograniczenia, czas.</p>
    ${recentRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebiegów pracy.</p>' : recentRuns.map((run, i) => `
    <details class="run-drill"${i === 0 ? " open" : ""}>
      <summary>
        <span class="mono dim">${E(run.id)}</span>
        ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : run.mode === "REWORK_MODE" ? "warn" : "info")}
        ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
        <span class="dim" style="font-size:11.5px">wyzwolone przez: ${E(run.trigger)} · ${E(run.startedAt.slice(0, 19).replace("T", " "))} -> ${E(run.finishedAt.slice(11, 19))} · kroków: ${run.steps.length} · wyjść: ${run.outputsCreated.length}</span>
      </summary>
      <div class="drill-body">
        ${run.idleReason ? `<div class="dim" style="font-size:12px">Powód bezczynności: ${E(run.idleReason)}</div>` : ""}
        <div class="dim" style="font-size:12px">Następna akcja operatora: ${E(run.nextOperatorAction)}</div>
        ${run.outputsCreated.length ? `<div class="dim mono" style="font-size:11px;margin-top:4px">Utworzone wyjścia: ${run.outputsCreated.map((o) => E(o)).join(", ")}</div>` : ""}
        <div class="timeline">${run.steps.map(renderStep).join("")}</div>
      </div>
    </details>`).join("")}
  </section>

  <section class="admin-panel">
    <h2>Pakiety Dostawy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Artefakty gotowe dla klienta. Operator dostarcza je ręcznie — fabryka nigdy nie wysyła. Pełny widok: <a href="/delivery" style="color:#58a6ff">/delivery</a></p>
    ${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakietów dostawy. Użyj "Zatwierdź -> Pakiet Dostawy" na wyniku klienta.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Pakiet</th><th>Klient</th><th>Usługa</th><th>Status</th><th>Wyjście źródłowe</th><th>Zlecenie</th><th>Utworzono</th></tr></thead>
      <tbody>
        ${[...state.deliveryPacks].reverse().slice(0, 6).map((p) => `<tr>
          <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
          <td>${E(p.clientName)}</td>
          <td>${E(p.serviceName)}</td>
          <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
          <td class="mono dim">${E(p.sourceOutputId)}</td>
          <td class="mono dim">${E(p.orderId)}</td>
          <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Magazynu</h2>
    <p class="dim" style="margin-bottom:10px">${state.warehouse.length} ofert z pipeline'u i ${warehouseAssets.length} zasobów cyfrowych zatwierdzonych przez operatora. Nie istnieje tu żadna wysyłka zewnętrzna, e-mail, push do CRM ani publikacja.</p>
    ${latestWarehouse.length === 0 ? '<p class="dim">Magazyn jest pusty.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Tytuł</th><th>Typ</th><th>Dział</th><th>Wynik</th><th>Data</th><th>Podgląd</th></tr></thead>
      <tbody>
        ${latestWarehouse.map((d) => `<tr>
          <td>${E(d.title)}</td>
          <td>${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}</td>
          <td>${badge(departmentLabel(d.department), "info")}</td>
          <td class="mono">${d.qualityScore}</td>
          <td class="dim">${E(d.date)}</td>
          <td class="dim" style="font-size:12px">${E(preview(d.content, 140))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Strumień Zdarzeń</h2>
    ${criticalEvents.length === 0 ? '<p class="dim">Brak istotnych zdarzeń.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Czas</th><th>Agent</th><th>Zdarzenie</th><th>Szczegóły</th></tr></thead>
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
      <h2>Znane Ryzyka / Skrzynka Bezpieczeństwa</h2>
      <ul>
        <li>JsonStore jest jednoprocesowy; dwa serwery mogą nadpisać sobie zapisy.</li>
        <li>events.json rośnie bez ograniczeń i przy dużym wolumenie będzie wymagać rotacji.</li>
        <li>Przed dodaniem asynchronicznych wywołań LLM do cykli wymagany jest mutex.</li>
        <li>Brak wysyłki zewnętrznej, publikacji, scrapingu, push do CRM, e-maili czy wydatków na reklamę.</li>
        <li>Zgoda operatora jest wymagana, zanim jakikolwiek zasób opuści fabrykę.</li>
        <li>Pakiety dostawy są artefaktami wewnętrznymi — operator zawsze jest właścicielem dostawy.</li>
      </ul>
    </div>
    <div class="admin-panel">
      <h2>Zasady Edycji w Panelu</h2>
      <ul>
        <li>Każdy zapis to jawny przycisk operatora lub wysłanie formularza.</li>
        <li>Zlecenia klientów używają istniejącej białej listy działów.</li>
        <li>Decyzje z przeglądu używają istniejących, logowanych zdarzeniami akcji dziennych.</li>
        <li>Brak surowej edycji JSON i brak destrukcyjnych zbiorczych mutacji.</li>
        <li>Bramka zatwierdzenia nie może zostać ominięta z poziomu tego kokpitu.</li>
      </ul>
    </div>
  </section>
</div>`)
}


function renderDelivery(state: FactoryState, flash?: string): string {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""
  const packs = [...state.deliveryPacks].reverse()
  const statusCls = (st: DeliveryPack["status"]): string =>
    st === "warehouse_ready" ? "ok" : st === "approved" ? "info" : "warn"
  return layout("Pakiety Dostawy", "/delivery", `
<h1>Pakiety Dostawy</h1>
<p class="sub">Artefakty gotowe dla klienta, przygotowane przez fabrykę. <strong style="color:#f85149">Fabryka nigdy nie wysyła — operator kopiuje pakiet i dostarcza go ręcznie.</strong></p>
${flashHtml}
${packs.length === 0 ? '<p class="dim">Brak pakietów. Na /admin użyj "Zatwierdź -> Pakiet Dostawy" na wyniku klienta.</p>' : packs.map((p) => `
<div class="admin-order" id="pack-${E(p.id)}">
  <div class="daily-header">
    ${badge(statusLabel(p.status), statusCls(p.status))}
    <span class="daily-title">${E(p.serviceName)} — ${E(p.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(p.id)} · rev ${p.revisionCount} · ${E(p.date)}</span>
    <span class="mono dim" style="font-size:11px">źródło ${E(p.sourceOutputId)} · zlecenie ${E(p.orderId)}</span>
  </div>
  <div class="offer-pre" style="max-height:340px">${E(renderPackMarkdown(p))}</div>
  <div class="admin-actions" style="margin-top:8px">
    ${p.status === "draft" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="approve">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zatwierdź Pakiet</button>
    </form>` : ""}
    ${p.status === "approved" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="warehouse">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zmagazynuj Pakiet + Kartę Sprawy</button>
    </form>` : ""}
    ${p.status === "warehouse_ready" ? `<span class="dim" style="font-size:12px">gotowe do magazynu — skopiuj markdown powyżej i dostarcz przez własny kanał.</span>` : ""}
  </div>
</div>`).join("")}

<h2>Karty Spraw (${state.caseRecords.length})</h2>
${state.caseRecords.length === 0 ? '<p class="dim">Brak spraw — zmagazynowanie zatwierdzonego pakietu tworzy jedną.</p>' : `
<table>
<thead><tr><th>Sprawa</th><th>Klient</th><th>Usługa</th><th>Problem</th><th>Pakiet</th><th>Kolejny krok</th><th>Utworzono</th></tr></thead>
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
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""
  const ops = deriveOps(state)
  const latestClientOutput = [...state.dailyDigitals].reverse().find((d) => d.orderId)
  const latestOrder = latestClientOutput?.orderId ? state.orders.find((o) => o.id === latestClientOutput.orderId) : undefined
  const recentPacks = [...state.deliveryPacks].reverse().slice(0, 5)
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px"
  return layout("Start Dnia", "/factory-run", `
<h1>Start Dnia — jedna strona do prowadzenia dnia</h1>
<p class="sub">
  ${badge(modeLabel(ops.mode), ops.mode === "IDLE" ? "muted" : "info")}
  ${badge(autopilotEnabled ? "autopilot WŁ." : "autopilot WYŁ.", autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY — brak wysyłki na zewnątrz", "ok")}
</p>
${flashHtml}

<div class="idle-box" style="margin-bottom:14px">
  <div class="kicker">Dlaczego Stoi w Miejscu</div>
  <strong>${E(ops.standingStill)}</strong>
  <div class="dim" style="font-size:12px;margin-top:4px">Następna akcja operatora: ${E(ops.nextActionTitle)} — ${E(ops.nextActionDetail)}</div>
</div>

<h2>Katalog Usług (${SERVICE_CATALOG.length})</h2>
<table>
<thead><tr><th>Usługa</th><th>Dla kogo</th><th>Obietnica</th><th>Dział</th><th>Deliverable</th></tr></thead>
<tbody>
${SERVICE_CATALOG.map((sv) => `<tr>
  <td><strong>${E(sv.name)}</strong><br><span class="mono dim" style="font-size:10.5px">${E(sv.id)}</span></td>
  <td class="dim" style="font-size:12px">${E(sv.targetCustomer)}</td>
  <td class="dim" style="font-size:12px">${E(sv.promise)}</td>
  <td>${badge(departmentLabel(sv.defaultDepartment), "info")}</td>
  <td class="dim" style="font-size:11.5px">${E(sv.expectedDeliverables.join(" · "))}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="form-card">
  <label>Nowe zlecenie klienta — wybierz usługę, opisz sytuację klienta</label>
  <form method="POST" action="/api/order">
    <input type="hidden" name="returnTo" value="/factory-run">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:170px;${inputStyle}">
      <select name="serviceId" style="${inputStyle}">
        <option value="">— usługa: dowolny brief —</option>
        ${SERVICE_CATALOG.map((sv) => `<option value="${E(sv.id)}">${E(sv.name)}</option>`).join("")}
      </select>
      <select name="department" style="${inputStyle}">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzedaż</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
      <select name="language" style="${inputStyle}">
        <option value="EN">EN</option>
        <option value="PL">PL</option>
      </select>
      <select name="urgency" style="${inputStyle}">
        <option value="normal">normalny</option>
        <option value="high">wysoki</option>
      </select>
    </div>
    <textarea name="description" placeholder="Brief klienta — czym się zajmuje, co go boli, co ma osiągnąć wynik..." required></textarea>
    <input name="operatorNotes" placeholder="Notatki operatora (opcjonalnie)" style="width:100%;margin-top:8px;${inputStyle}">
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie -> Wyprodukuj Teraz</button></div>
  </form>
  <form method="POST" action="/api/demo-order" style="margin-top:10px">
    <input type="hidden" name="returnTo" value="/factory-run">
    <button type="submit">Utwórz Demo Zlecenie (HVAC TestCo — Audyt AI Workflow + Mini Demo)</button>
  </form>
</div>

<h2>Kolejka Przeglądu</h2>
<table>
<tbody>
  <tr><th>Wyniki klientów gotowe do przeglądu</th><td>${ops.waiting.ordersReadyForReview}</td></tr>
  <tr><th>Szkice treningowe czekające</th><td>${ops.waiting.trainingDrafts}</td></tr>
  <tr><th>Poprawki czekające na cykl</th><td>${ops.waiting.needsRework}</td></tr>
  <tr><th>Pakiety dostawy (szkic / zatwierdzone)</th><td>${ops.waiting.deliveryPacksDraft} / ${ops.waiting.deliveryPacksApproved}</td></tr>
</tbody>
</table>
<p class="dim" style="font-size:12px">Pełna kontrola przeglądu jest na <a href="/admin" style="color:#58a6ff">/admin</a> i <a href="/delivery" style="color:#58a6ff">/delivery</a>.</p>

<h2>Najnowszy Wynik Klienta</h2>
${latestClientOutput ? `
<div class="admin-order" id="out-${E(latestClientOutput.id)}">
  <div class="daily-header">
    ${badge(statusLabel(latestClientOutput.status), latestClientOutput.status === "draft_ready" ? "warn" : "ok")}
    <span class="daily-title">${E(latestClientOutput.title)}</span>
    <span class="mono dim" style="font-size:11px">${E(latestClientOutput.id)} · od ${E(latestClientOutput.createdByAgentId)} · rev ${latestClientOutput.revisionCount}${latestOrder?.serviceName ? ` · ${E(latestOrder.serviceName)}` : ""}</span>
  </div>
  <div class="offer-pre" style="max-height:260px">${E(latestClientOutput.content)}</div>
  ${latestClientOutput.status === "draft_ready" ? `
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="create">
      <input type="hidden" name="outputId" value="${E(latestClientOutput.id)}">
      <button class="ok" type="submit">Zatwierdź -> Pakiet Dostawy</button>
    </form>
    <form method="POST" action="/api/daily">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(latestClientOutput.id)}">
      <input name="feedback" placeholder="Notatka do poprawki..." required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zgłoś Poprawkę</button>
    </form>
  </div>` : ""}
</div>` : '<p class="dim">Brak jeszcze wyniku klienta — dodaj zlecenie powyżej lub utwórz demo zlecenie.</p>'}

<h2>Gotowość Pakietów Dostawy</h2>
${recentPacks.length === 0 ? '<p class="dim">Brak pakietów.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Usługa</th><th>Status</th></tr></thead>
<tbody>
${recentPacks.map((p) => `<tr>
  <td class="mono"><a href="/delivery#pack-${E(p.id)}" style="color:#58a6ff">${E(p.id)}</a></td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
</tr>`).join("")}
</tbody>
</table>`}

<div class="admin-actions" style="margin-top:14px">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="run">
    <button type="submit">Uruchom Cykl Teraz</button>
  </form>
  <form method="POST" action="/api/autopilot">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
    <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wznów Autopilota"}</button>
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
    ${badge(statusLabel(t.status), plStatusBadgeCls(t.status))}
    ${badge(t.agentId, "info")}
    ${badge(statusLabel(t.source), t.source === "client" ? "warn" : t.source === "rework" ? "bad" : t.source === "delivery_pack" ? "info" : "muted")}
    <span class="daily-title">${E(t.title)}</span>
    <span class="dim" style="font-size:11px">stacja: ${E(stationIdLabel(t.station))}${t.department ? ` · ${E(departmentLabel(t.department))}` : ""}${typeof t.revisionCount === "number" ? ` · rev ${t.revisionCount}` : ""}${typeof t.qualityScore === "number" ? ` · wynik ${t.qualityScore}` : ""}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wejście:</strong> ${E(t.inputSummary)}</div>
  <div class="dim" style="font-size:12px;margin-top:2px"><strong>Wyjście:</strong> ${E(t.outputSummary)}</div>
  ${t.outputId ? `<div class="dim mono" style="font-size:11px">output ${E(t.outputId)}${t.orderId ? ` · zlecenie ${E(t.orderId)}` : ""}${t.packId ? ` · pakiet ${E(t.packId)}` : ""}</div>` : ""}
  ${t.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:2px">ograniczenia: ${E(t.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim" style="font-size:11.5px;margin-top:3px"><strong>Dalej:</strong> ${E(t.nextOperatorAction)}${t.nextStation ? ` (→ ${E(stationIdLabel(t.nextStation))})` : ""}</div>
</div>`
}

function renderProductionLine(state: FactoryState, flash?: string): string {
  const pl = productionLineFor(state)
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("Błąd") ? "bad" : ""}">${E(flash)}</div>` : ""
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px"
  const lineBlock = (title: string, tasks: AgentProductionTask[], empty: string): string => `
<h2>${E(title)} (${tasks.length})</h2>
${tasks.length === 0 ? `<p class="dim">${E(empty)}</p>` : tasks.map(renderPlTask).join("")}`

  return layout("Linia Produkcyjna", "/production-line", `
<h1>Linia Produkcyjna Agentów</h1>
<p class="sub">
  ${badge(modeLabel(pl.mode), pl.mode === "IDLE" ? "muted" : "info")}
  ${badge(pl.autopilotEnabled ? "autopilot WŁ." : "autopilot WYŁ.", pl.autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY — brak wysyłki na zewnątrz", "ok")}
  <span class="dim" style="font-size:12px">uczciwy widok synchroniczny — brak udawanych żywych agentów</span>
</p>
${flashHtml}

<section class="admin-grid" aria-label="Production Summary">
  <div class="admin-card"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zlecenia klientów</div></div>
  <div class="admin-card"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Limit treningu</div></div>
  <div class="admin-card"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft}/${pl.deliveryPacks.approved}/${pl.deliveryPacks.warehouseReady}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
  <div class="admin-card"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
</section>

<section class="admin-action">
  <h2>Następna Akcja Operatora</h2>
  <strong>${E(pl.nextOperatorAction)}</strong>
</section>

<h2>Tablica Stacji</h2>
<div class="station-board">
  ${pl.stations.map((st) => `
  <div class="station ${st.status}">
    <div class="sagent">${E(st.agentId)} · ${E(st.name)}</div>
    <div class="sname">${badge(statusLabel(st.status), plStatusBadgeCls(st.status))} <span class="dim" style="font-size:11px">zadań: ${st.taskCount}</span></div>
    <div class="spurpose">${E(st.purpose)}</div>
    ${st.lastTask ? `
      <div class="sline"><strong>Ostatnie:</strong> ${E(plPreview(st.lastTask.title, 60))}</div>
      <div class="sline dim">${E(st.lastTask.nextOperatorAction)}</div>
    ` : `<div class="sline dim">Brak zadania na tej stacji.</div>`}
  </div>`).join("")}
</div>

<div class="form-card">
  <label>Utwórz Demo Przebieg Produkcyjny — jawni, wewnętrzni, wyraźnie fikcyjni klienci</label>
  <form method="POST" action="/api/demo-order">
    <input type="hidden" name="returnTo" value="/production-line">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select name="demo" style="${inputStyle}">
        ${DEMO_CLIENTS.map((d) => `<option value="${E(d.key)}">${E(d.clientName)} — ${E(d.serviceId)}</option>`).join("")}
      </select>
      <button type="submit">Utwórz Demo Przebieg Produkcyjny</button>
    </div>
  </form>
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/daily"><input type="hidden" name="returnTo" value="/production-line"><input type="hidden" name="action" value="run"><button type="submit">Uruchom Cykl Teraz</button></form>
  </div>
</div>

${lineBlock("Linia Klienta", pl.clientLine, "Brak zleceń klientów — utwórz demo przebieg produkcyjny powyżej.")}
${lineBlock("Linia Treningowa", pl.trainingLine, "Brak zadań treningowych dziś. Uruchom cykl bez otwartych zleceń klientów.")}
${lineBlock("Linia Poprawek", pl.reworkLine, "Nic nie jest oznaczone do poprawki.")}
${lineBlock("Linia Pakietów Dostawy", pl.deliveryPackLine, "Brak pakietów dostawy — zatwierdź wynik klienta do pakietu.")}

<h2>Ostatnie Przebiegi</h2>
${state.workRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebiegów produkcyjnych.</p>' : [...state.workRuns].reverse().slice(0, 6).map((run) => `
<details class="run-drill">
  <summary>
    <span class="mono dim">${E(run.id)}</span>
    ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : "info")}
    ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
    <span class="dim" style="font-size:11.5px">via ${E(run.trigger)} · ${E(run.startedAt.slice(0, 19).replace("T", " "))} · kroków: ${run.steps.length} · wyjść: ${run.outputsCreated.length}</span>
  </summary>
  <div class="drill-body">
    <div class="dim" style="font-size:12px">Następna akcja operatora: ${E(run.nextOperatorAction)}</div>
    ${run.steps.map((step) => `<div class="pl-task ${step.status === "completed" ? "completed" : step.status === "failed" ? "blocked" : "skipped"}">
      <div class="daily-header">${badge(step.agentId, "info")} ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")} <span class="daily-title">${E(step.agentName)}</span> <span class="dim" style="font-size:11px">${E(step.jobType)}</span></div>
      <div class="dim" style="font-size:12px"><strong>Wejście:</strong> ${E(step.inputSummary)}</div>
      ${step.outputSummary ? `<div class="dim" style="font-size:12px"><strong>Wyjście:</strong> ${E(step.outputSummary)}</div>` : ""}
      ${step.outputId ? `<div class="dim mono" style="font-size:11px">outputId: ${E(step.outputId)}</div>` : ""}
    </div>`).join("")}
  </div>
</details>`).join("")}`)
}

function renderEvents(state: FactoryState): string {
  const events = [...state.events].reverse()
  return layout("Zdarzenia", "/events", `
<h1>Dziennik Zdarzeń</h1>
<p class="sub">${events.length} zdarzeń — wszystkie decyzje pipeline'u zarejestrowane</p>
${events.length === 0 ? '<p class="dim">Brak zdarzeń.</p>' : `
<table>
<thead><tr><th>Agent</th><th>Zdarzenie</th><th>Sygnał</th><th>Szczegóły</th><th>Czas</th></tr></thead>
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
  const rawUrl = req.url ?? "/"
  const parsed = new URL(rawUrl, "http://internal")
  let url = parsed.pathname
  // On Vercel the catch-all rewrite may hand the function its DESTINATION path
  // instead of the visitor's path; the rewrite therefore carries the original
  // path explicitly as ?__path=/... — recover it so routing sees /admin, not
  // /api/index. Locally __path never appears and this is a no-op.
  if (url === "/api/index") {
    const original = parsed.searchParams.get("__path") ?? "/"
    url = original.startsWith("/") ? original : `/${original}`
  }
  if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1)
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
          integrity: getIntegrityRecords(store),
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

      return html(res, `<h1>404</h1><p>${E(method)} ${E(url)} (raw: ${E(rawUrl)})</p>`, 404)
    }

    if (method === "POST" && url === "/api/signal") {
      const params = await readBody(req)
      const raw = (params["raw"] ?? "").trim()
      if (!raw) {
        const errState = store.snapshot()
        return html(res, renderFactory(errState, "Błąd: wymagany jest tekst sygnału"))
      }
      let result: PipelineResult
      try {
        result = await runOfferAcquisitionForSignal(raw, store)
      } catch (err) {
        const errState = store.snapshot()
        return html(res, renderFactory(errState, `Błąd: ${String(err)}`))
      }
      const newState = store.snapshot()
      const flash = result.status === "awaiting_approval"
        ? `Pipeline zakończony — oferta czeka na Twoje zatwierdzenie (${result.approval?.id})`
        : result.status === "disqualified"
        ? `Sygnał zdyskwalifikowany — nie pasuje do ICP`
        : `Pipeline nie powiódł się po ewaluacji`
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
        return html(res, renderAdmin(store.snapshot(), "Decyzja zatwierdzenia zarejestrowana."))
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
          lastCycleSummary = `${modeLabel(result.mode)}: trening=${result.trainingCreated} zlecenia=${result.ordersProduced.length} poprawki=${result.reworksRegenerated.length}`
          return respond(`Cykl zakończony — ${lastCycleSummary}`)
        } catch (err) {
          return respond(`Błąd: ${String(err)}`)
        }
      }
      if (action === "accept" && id) {
        acceptDigital(store, id)
        syncOrder("approved")
        return respond("Zaakceptowano.")
      }
      if (action === "rework" && id && feedback) {
        reworkDigital(store, id, feedback)
        syncOrder("in_production", feedback)
        return respond("Oznaczono do poprawki — autopilot odtworzy to z Twoim feedbackiem.")
      }
      if (action === "reject" && id && feedback) {
        rejectDigital(store, id, feedback)
        syncOrder("rejected", feedback)
        return respond("Odrzucono i przeniesiono do kosza.")
      }
      if (action === "warehouse" && id) {
        warehouseDigital(store, id)
        syncOrder("approved")
        return respond("Wysłano do magazynu.")
      }
      return respond("Błąd: nieznana akcja lub brak id/feedbacku.")
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
          return html(res, renderAdmin(store.snapshot(), `Błąd: nieprawidłowy dział ${departmentRaw}`), 400)
        }
        return json(res, { error: "invalid department", received: departmentRaw, allowed: VALID_DEPARTMENTS }, 400)
      }
      const department = departmentRaw as DailyDigitalDepartment
      if (!clientName || !description) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), "Błąd: wymagana jest nazwa klienta i opis"))
        }
        return html(res, renderOrders(store.snapshot(), "Błąd: wymagana jest nazwa klienta i opis"))
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
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`
      if (returnToRun) {
        return html(res, renderFactoryRun(store.snapshot(), `Zlecenie ${order.id} przyjęte i wyprodukowane — przejrzyj poniżej lub na /admin.`))
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Zlecenie ${order.id} przyjęte i wyprodukowane — przejrzyj deliverable poniżej.`))
      }
      return html(res, renderOrders(store.snapshot(), `Zlecenie ${order.id} przyjęte i wyprodukowane — przejrzyj deliverable poniżej.`))
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
        if (!digital?.orderId) return respond("Błąd: wyjście nie znalezione lub nie jest deliverablem zlecenia klienta.")
        // Creating a pack from a draft deliverable IS the approval decision:
        // route the output to the warehouse first (existing safe action),
        // then build the pack. Everything stays internal.
        if (digital.status === "draft_ready") {
          warehouseDigital(store, outputId)
          store.updateOrder(digital.orderId, { status: "approved", updatedAt: new Date().toISOString() })
        }
        const pack = createDeliveryPack(store, outputId)
        return respond(pack ? `Pakiet dostawy ${pack.id} utworzony (szkic) — przejrzyj go na /delivery.` : "Błąd: nie udało się utworzyć pakietu.")
      }
      if (action === "approve") {
        const pack = approveDeliveryPack(store, (params["id"] ?? "").trim())
        return respond(pack ? `Pakiet ${pack.id} zatwierdzony — zmagazynuj go, gdy będzie gotowy.` : "Błąd: pakiet nie znaleziony lub nie jest w szkicu.")
      }
      if (action === "warehouse") {
        const record = warehouseDeliveryPack(store, (params["id"] ?? "").trim())
        return respond(record ? `Pakiet zmagazynowany — sprawa ${record.id} zarejestrowana. Operator dostarcza ręcznie.` : "Błąd: pakiet nie znaleziony lub nie zatwierdzony.")
      }
      return respond("Błąd: nieznana akcja dostawy.")
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
        return respond(`Demo zlecenie ${existing.id} dla ${demo.clientName} jest już aktywne — przejrzyj je zamiast duplikować.`)
      }
      const order = createOrder(store, {
        clientName: demo.clientName,
        department: "delivery",
        serviceId: demo.serviceId,
        language: demo.language,
        description: demo.description,
      })
      const result = await runAutonomousCycle(store, undefined, "order_created")
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`
      return respond(`Demo przebieg produkcyjny ${order.id} utworzony dla ${demo.clientName} (${demo.serviceId}) — tylko wewnętrznie, nic nigdzie nie zostało wysłane.`)
    }

    if (method === "POST" && url === "/api/integrity") {
      const params = await readBody(req)
      const agentIdRaw = (params["agentId"] ?? "").trim()
      // Every validation failure below returns 400 with ZERO store writes —
      // an audited reset cannot happen by accident or with missing evidence.
      if (!agentIdRaw) {
        return json(res, { error: "missing agentId" }, 400)
      }
      if (!(PRODUCER_AGENTS as readonly string[]).includes(agentIdRaw)) {
        return json(res, { error: "invalid agent", received: agentIdRaw, allowed: PRODUCER_AGENTS }, 400)
      }
      if ((params["action"] ?? "") !== "reset") {
        return json(res, { error: "unknown integrity action" }, 400)
      }
      const reasonRaw = (params["reason"] ?? "").trim()
      if (!reasonRaw) {
        return json(res, { error: "missing reason", allowed: INTEGRITY_RESET_REASONS }, 400)
      }
      if (!isValidResetReason(reasonRaw)) {
        return json(res, { error: "invalid reason", received: reasonRaw, allowed: INTEGRITY_RESET_REASONS }, 400)
      }
      const note = (params["note"] ?? "").trim()
      const updated = resetAgentIntegrity(store, agentIdRaw as MissionAgentId, reasonRaw, note || undefined)
      return html(res, renderAdmin(store.snapshot(),
        updated
          ? `Reset integralności dla ${agentIdRaw} (${reasonRaw}) — produkcja kliencka ponownie włączona (decyzja God Layer).`
          : `Nic do zresetowania dla ${agentIdRaw} — nos już na 0.`))
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
        return html(res, renderFactoryRun(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`))
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`))
      }
      return html(res, renderFactory(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`))
    }

    html(res, `<h1>404</h1><p>${E(method)} ${E(url)} (raw: ${E(rawUrl)})</p>`, 404)
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
      lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`
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
    lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`
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
