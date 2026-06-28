import { test } from "node:test"
import assert from "node:assert/strict"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { HeuristicJudge } from "@ratio-essendi/evaluation-engine"
import { StubOfferProvider } from "@ratio-essendi/offer-builder"
import {
  HeuristicQualifier,
  runProspectAgent,
  PROSPECT_POOL,
} from "@ratio-essendi/prospecting"

const ICP = "Seed-stage B2B SaaS founders (10-50 employees)"
const PRODUCT = "Fractional RevOps sprint"
const KPIS = ["offer", "price", "margin", "call to action"]

function makeGov() {
  const gov = new MetaGovernor()
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "Generate booked calls for the ICP.",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })
  return { gov, cellId: cell.id }
}

test("HeuristicQualifier passes a strong ICP match (B2B SaaS founder, right size, revenue pain)", async () => {
  const prospect = PROSPECT_POOL.find((p) => p.id === "prospect-001")!
  const result = await new HeuristicQualifier().qualify(prospect, ICP)
  assert.equal(result.qualified, true, `fitScore=${result.fitScore} reasons=${result.reasons.join("; ")}`)
  assert.ok(result.fitScore >= 0.75)
  assert.equal(result.reasons.length, 0)
})

test("HeuristicQualifier rejects an enterprise non-SaaS prospect", async () => {
  const prospect = PROSPECT_POOL.find((p) => p.id === "prospect-003")!
  const result = await new HeuristicQualifier().qualify(prospect, ICP)
  assert.equal(result.qualified, false)
  assert.ok(result.fitScore < 0.75)
  assert.ok(result.reasons.length > 0)
})

test("runProspectAgent: qualified lead goes through offer pipeline and reaches approval gate", async () => {
  const { gov, cellId } = makeGov()
  const prospect = PROSPECT_POOL.find((p) => p.id === "prospect-002")!

  const result = await runProspectAgent(
    gov,
    cellId,
    { prospect, icp: ICP, product: PRODUCT, constraints: ["fixed scope"], kpis: KPIS },
    new HeuristicQualifier(),
    new StubOfferProvider(),
    new HeuristicJudge(),
  )

  assert.equal(result.qualification.qualified, true)
  assert.notEqual(result.agentId, "none")
  assert.ok(result.offer, "qualified lead must produce an offer")
  assert.equal(result.status, "pending_approval", "offer must be held at approval gate, never sent")
  assert.equal(result.sent, false)

  const log = gov.log.all()
  assert.ok(log.some((e) => e.eventType === "prospect.qualified"))
  assert.ok(log.some((e) => e.eventType === "approval.required"))
})

test("runProspectAgent: disqualified lead produces no offer and logs prospect.disqualified", async () => {
  const { gov, cellId } = makeGov()
  const prospect = PROSPECT_POOL.find((p) => p.id === "prospect-003")!

  const result = await runProspectAgent(
    gov,
    cellId,
    { prospect, icp: ICP, product: PRODUCT, constraints: [], kpis: KPIS },
    new HeuristicQualifier(),
    new StubOfferProvider(),
  )

  assert.equal(result.qualification.qualified, false)
  assert.equal(result.agentId, "none")
  assert.equal(result.offer, undefined)
  assert.equal(result.status, "disqualified")
  assert.equal(result.sent, false)

  const log = gov.log.all()
  assert.ok(log.some((e) => e.eventType === "prospect.disqualified"))
  assert.ok(!log.some((e) => e.eventType === "approval.required"), "no approval event for a disqualified lead")
})

test("findClient demo: pool ranked by fit, best match selected and pitched", async () => {
  const qualifier = new HeuristicQualifier()
  const scored = await Promise.all(
    PROSPECT_POOL.map(async (p) => ({
      p,
      q: await qualifier.qualify(p, ICP),
    })),
  )
  const qualified = scored.filter((s) => s.q.qualified).sort((a, b) => b.q.fitScore - a.q.fitScore)

  assert.ok(qualified.length >= 2, `Expected at least 2 ICP-fit prospects in the pool, got ${qualified.length}`)

  const { gov, cellId } = makeGov()
  const best = qualified[0]!
  const result = await runProspectAgent(
    gov,
    cellId,
    { prospect: best.p, icp: ICP, product: PRODUCT, constraints: ["fixed scope"], kpis: KPIS },
    qualifier,
    new StubOfferProvider(),
    new HeuristicJudge(),
  )

  assert.equal(result.status, "pending_approval")
  assert.ok(result.offerScore !== undefined && result.offerScore >= 0.5)
})
