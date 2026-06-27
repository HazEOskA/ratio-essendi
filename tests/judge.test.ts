import { test } from "node:test"
import assert from "node:assert/strict"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { HeuristicJudge, type JudgeProvider } from "@ratio-essendi/evaluation-engine"
import { runOfferAgent, type OfferBrief, type OfferProvider } from "@ratio-essendi/offer-builder"

const STRONG =
  "Offer: Fractional RevOps sprint for seed-stage B2B SaaS founders.\n" +
  "Price: $4,000 fixed\nMargin: ~65% protected (no discounting below floor)\n" +
  "Call to action: Book a 20-minute scoping demo this week."
const WEAK = "off-topic blast, no targeting, generic spam"

const KPIS = ["offer", "price", "margin", "call to action"]

test("heuristic judge passes a strong offer", async () => {
  const v = await new HeuristicJudge().judge({ output: STRONG })
  assert.equal(v.passed, true)
  assert.ok(v.score >= 0.8, `score ${v.score}`)
  assert.deepEqual(v.reasons, [])
})

test("heuristic judge fails a weak/spammy offer with reasons", async () => {
  const v = await new HeuristicJudge().judge({ output: WEAK })
  assert.equal(v.passed, false)
  assert.ok(v.score < 0.5, `score ${v.score}`)
  assert.ok(v.reasons.length >= 3)
})

test("judged offer flow drives succession on a weak first draft, then passes", async () => {
  // Provider returns a weak draft first, a strong one once asked to fix weaknesses.
  const flaky: OfferProvider = {
    generateOffer: (b: OfferBrief) => Promise.resolve(b.emphasize ? STRONG : WEAK),
  }
  const judge: JudgeProvider = new HeuristicJudge()

  const gov = new MetaGovernor()
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "p",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })

  const result = await runOfferAgent(
    gov,
    cell.id,
    { icp: "founders", product: "sprint", constraints: ["fixed scope"], kpis: KPIS },
    flaky,
    judge,
  )

  assert.equal(result.passed, true)
  assert.ok(result.successorId, "a weak first draft must trigger succession")
  assert.equal(result.sent, false, "approval gate still holds")
  assert.ok(
    gov.log.all().some((e) => e.eventType === "agent.successor_created"),
    "succession recorded in the log",
  )
})

test("a fully failing offer flow disables the blocked agent (not left active)", async () => {
  const alwaysWeak: OfferProvider = { generateOffer: () => Promise.resolve(WEAK) }
  const gov = new MetaGovernor()
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "p",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })

  const result = await runOfferAgent(
    gov,
    cell.id,
    { icp: "founders", product: "sprint", constraints: ["fixed scope"], kpis: KPIS },
    alwaysWeak,
    new HeuristicJudge(),
  )

  assert.equal(result.status, "blocked")
  assert.equal(result.passed, false)
  assert.equal(result.sent, false)
  assert.equal(gov.agents.getAgent(result.agentId).status, "disabled", "blocked agent taken out of service")
  assert.equal(
    gov.agents.listAgents().filter((a) => a.status === "active").length,
    0,
    "no blocked agent is counted as active",
  )
})
