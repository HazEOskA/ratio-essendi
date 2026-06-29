/**
 * Factory Core v0.1 — Operator Dashboard (port 7778)
 *
 * Pages:
 *   GET /          → /factory  — pipeline overview + signal input form
 *   GET /leads     → qualified leads
 *   GET /warehouse → approved offers
 *   GET /trash     → rejected / failed items
 *   GET /events    → full event log
 *
 * API:
 *   POST /api/signal  { raw: string }                   → run pipeline
 *   POST /api/action  { action: string, id: string }    → approve / reject
 */
import { createServer } from "node:http"
import { join } from "node:path"
import { mkdirSync, existsSync } from "node:fs"
import { FactoryStore, runOfferAcquisitionForSignal, agentI } from "@ratio-essendi/factory-core"
import type { FactoryState, PipelineResult } from "@ratio-essendi/factory-core"

const PORT = 7778
const DATA_DIR = join(process.cwd(), ".factory-data")
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const store = new FactoryStore(DATA_DIR)

// --- HTML helpers ---

const E = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const badge = (text: string, cls: string): string =>
  `<span class="badge ${cls}">${E(text)}</span>`

const nav = (active: string): string => {
  const links: [string, string][] = [
    ["/", "Factory"],
    ["/leads", "Leads"],
    ["/warehouse", "Warehouse"],
    ["/trash", "Trash"],
    ["/events", "Events"],
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

  return layout("Factory", "/", `
<h1>Factory Core v0.1</h1>
<p class="sub">Offer Acquisition Line — 14 agents — operator approval required before any offer leaves</p>
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
  return layout("Warehouse", "/warehouse", `
<h1>Warehouse — Approved Offers</h1>
<p class="sub">${state.warehouse.length} offers approved by operator · <strong style="color:#f85149">sent: false — no auto-send</strong></p>
${state.warehouse.length === 0 ? '<p class="dim">No approved offers yet.</p>' : state.warehouse.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge("approved", "ok")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">signal: ${E(item.signalId)} · score: ${item.qualityScore} · approved: ${E(item.approvedAt.slice(0, 16).replace("T", " "))}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div style="margin-top:6px;font-size:12px;color:#8b949e">Agent I routed to warehouse. Operator action required to use this offer externally.</div>
</div>`).join("")}`)
}

function renderTrash(state: FactoryState): string {
  return layout("Trash", "/trash", `
<h1>Trash — Disqualified &amp; Failed</h1>
<p class="sub">${state.trash.length} items removed from pipeline</p>
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
</table>`}`)
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
          id: `evt-${Date.now()}`,
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
          id: `evt-${Date.now()}`,
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

    html(res, "<h1>404</h1>", 404)
  } catch (err) {
    console.error(err)
    html(res, `<pre>500: ${E(String(err))}</pre>`, 500)
  }
})

server.listen(PORT, () => {
  console.log(`\nFactory Core v0.1 — http://localhost:${PORT}`)
  console.log("  / or /factory  — pipeline overview + signal form")
  console.log("  /leads         — qualified leads")
  console.log("  /warehouse     — approved offers")
  console.log("  /trash         — disqualified / failed")
  console.log("  /events        — full event log")
  console.log("\nPress Ctrl+C to stop.\n")
})
