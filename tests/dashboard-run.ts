import { writeFileSync } from "node:fs"
import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent } from "@ratio-essendi/evaluation-engine"
import { runOfferAgent, StubOfferProvider } from "@ratio-essendi/offer-builder"
import { buildSnapshot, renderDashboard } from "@ratio-essendi/dashboard"

const KPIS = ["offer", "price", "margin", "call to action"]

resetIds()
const gov = new MetaGovernor()

const cell = gov.registerCell({
  name: "Sales Factory",
  domain: "sales",
  purpose: "Generate profitable booked calls for the selected ICP.",
  memoryScope: "sales/offers",
  budgetLimit: 1000,
  kpis: KPIS,
})

// A weak producer that gets detected and replaced via succession.
const weak = gov.registerAndActivateAgent({
  name: "Generic Blaster",
  cellId: cell.id,
  role: "offer-builder",
  purpose: "Create profitable, clear offers for the selected ICP.",
  memoryScope: "sales/offers",
  budgetLimit: 200,
  kpis: KPIS,
  successCriteria: KPIS,
  failureCriteria: ["off-topic", "spam", "no price"],
  allowedActions: ["draft offer"],
  forbiddenActions: ["send to client"],
})
const first = evaluateAgent(weak.id, "off-topic blast, no targeting", KPIS, gov.log)
if (!first.passed) {
  const brief = gov.requestSuccession({
    failedAgent: gov.agents.getAgent(weak.id),
    failureType: "agent_error",
    failureSummary: `Weak offer: ${first.failureReasons.join(", ")}`,
    repeatedWeaknesses: first.failureReasons,
    evidence: gov.log.byEntity(weak.id).map((e) => e.eventType),
  })
  const successor = gov.promoteSuccessor(gov.agents.getAgent(weak.id), brief)
  evaluateAgent(
    successor.id,
    "Offer: clear ICP fit; Price: $4k; Margin: 65%; Call to action: book a demo",
    KPIS,
    gov.log,
  )
}

// A real offer flow that ends at the approval gate (docs/13).
await runOfferAgent(
  gov,
  cell.id,
  {
    icp: "Seed-stage B2B SaaS founders (10-50 employees)",
    product: "Fractional RevOps sprint",
    constraints: ["2-week delivery", "fixed scope"],
    kpis: KPIS,
    agentName: "Offer Builder",
  },
  new StubOfferProvider(),
)

const snapshot = buildSnapshot(gov)
writeFileSync("dashboard.html", renderDashboard(snapshot))
console.log(
  `Wrote dashboard.html — ${snapshot.cells.length} cell(s), ` +
    `${snapshot.agents.length} agent(s), ${snapshot.events.length} decision(s). Open it in a browser.`,
)
