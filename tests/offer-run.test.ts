import { test } from "node:test"
import assert from "node:assert/strict"
import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { runOfferAgent, StubOfferProvider } from "@ratio-essendi/offer-builder"

const KPIS = ["offer", "price", "margin", "call to action"]

test("offer agent produces an offer, evaluates it, and never auto-sends (docs/13)", async () => {
  resetIds()
  const gov = new MetaGovernor()
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "Generate profitable booked calls.",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })

  const result = await runOfferAgent(
    gov,
    cell.id,
    {
      icp: "B2B SaaS founders",
      product: "RevOps sprint",
      constraints: ["fixed scope"],
      kpis: KPIS,
    },
    new StubOfferProvider(),
  )

  assert.equal(result.passed, true)
  assert.equal(result.status, "pending_approval")
  assert.equal(result.sent, false, "approval gate must hold — nothing is auto-sent")
  assert.ok(result.offer.toLowerCase().includes("price"))

  const events = gov.log.all()
  assert.equal(
    events.filter((e) => e.eventType === "approval.required").length,
    1,
    "an approval.required event must be logged",
  )
  assert.equal(
    events.filter((e) => e.eventType.includes("sent")).length,
    0,
    "no send event may exist",
  )
})
