import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { selectOfferProvider } from "@ratio-essendi/offer-builder"
import { selectJudge } from "@ratio-essendi/evaluation-engine"
import {
  HeuristicQualifier,
  runProspectAgent,
  PROSPECT_POOL,
} from "@ratio-essendi/prospecting"

const ICP = "Seed-stage B2B SaaS founders (10-50 employees)"
const PRODUCT = "Fractional RevOps sprint"
const KPIS = ["offer", "price", "margin", "call to action"]

const gov = new MetaGovernor()
const cell = gov.registerCell({
  name: "Sales Factory",
  domain: "sales",
  purpose: "Generate booked calls for the ICP.",
  memoryScope: "sales/offers",
  budgetLimit: 1000,
  kpis: KPIS,
})

const qualifier = new HeuristicQualifier()

const { provider, mode: offerMode } = selectOfferProvider()
const { judge, mode: judgeMode } = selectJudge()

console.log("═══════════════════════════════════════════════")
console.log("  RATIO ESSENDI — Prospect Qualification Run   ")
console.log("═══════════════════════════════════════════════\n")
console.log(`ICP:     ${ICP}`)
console.log(`Product: ${PRODUCT}`)
console.log(
  `Provider: ${offerMode === "anthropic" ? "Anthropic claude-opus-4-8 (LIVE)" : "stub (offline)"}`,
)
console.log(
  `Judge:    ${judgeMode === "anthropic" ? "Anthropic claude-opus-4-8 (LIVE)" : "heuristic (offline)"}`,
)
console.log(`\nScoring ${PROSPECT_POOL.length} prospects…\n`)

const scored = await Promise.all(
  PROSPECT_POOL.map(async (p) => ({ p, q: await qualifier.qualify(p, ICP) })),
)
scored.sort((a, b) => b.q.fitScore - a.q.fitScore)

for (const { p, q } of scored) {
  const mark = q.qualified ? "✓" : "✗"
  const pct = (q.fitScore * 100).toFixed(0).padStart(3)
  console.log(`  ${mark} ${pct}%  ${p.name.padEnd(22)} ${p.role.padEnd(25)} ${p.company}`)
  if (q.reasons.length) console.log(`         → ${q.reasons.join("; ")}`)
}

const qualified = scored.filter((s) => s.q.qualified)
console.log(`\n${qualified.length} of ${PROSPECT_POOL.length} prospects qualify for outreach.\n`)

if (qualified.length === 0) {
  console.log("No prospects qualify. Expand the pool or refine the ICP.\n")
  process.exit(0)
}

const best = qualified[0]!
console.log(`Best match: ${best.p.name} at ${best.p.company} (fit ${(best.q.fitScore * 100).toFixed(0)}%)`)
console.log(`Notes: ${best.p.notes ?? "—"}\n`)
console.log("Running offer pipeline…\n")

const result = await runProspectAgent(
  gov,
  cell.id,
  { prospect: best.p, icp: ICP, product: PRODUCT, constraints: ["2-week delivery", "fixed scope"], kpis: KPIS },
  qualifier,
  provider,
  judge,
)

console.log(`Status:     ${result.status}`)
console.log(`Agent:      ${result.agentId}`)
console.log(`Offer score: ${result.offerScore?.toFixed(2) ?? "n/a"}`)
console.log(`Sent:       ${result.sent}  (approval gate holds; docs/13)\n`)

if (result.offer) {
  console.log("──────────────────────────────────────────────")
  console.log("OFFER (held at approval gate — not sent):\n")
  console.log(result.offer)
  console.log("──────────────────────────────────────────────\n")
}

console.log("Event log (last 8 decisions):")
const events = gov.log.all().slice(-8)
for (const e of events) {
  const tr = (e.previousState || e.nextState) ? ` [${e.previousState ?? "∅"} → ${e.nextState ?? "∅"}]` : ""
  console.log(`  ${e.eventType}${tr}  ${e.entityId}`)
  if (e.reason) console.log(`    ${e.reason}`)
}
console.log()
