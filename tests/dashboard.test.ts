import { test } from "node:test"
import assert from "node:assert/strict"
import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { runOfferAgent, StubOfferProvider } from "@ratio-essendi/offer-builder"
import { buildSnapshot, renderDashboard } from "@ratio-essendi/dashboard"

const KPIS = ["offer", "price", "margin", "call to action"]

test("dashboard renders cells, agents and decisions as standalone HTML", async () => {
  resetIds()
  const gov = new MetaGovernor()
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "p",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })
  await runOfferAgent(
    gov,
    cell.id,
    { icp: "founders", product: "sprint", constraints: ["fixed"], kpis: KPIS },
    new StubOfferProvider(),
  )

  const snapshot = buildSnapshot(gov)
  assert.ok(snapshot.cells.length >= 1)
  assert.ok(snapshot.agents.length >= 1)

  const html = renderDashboard(snapshot)
  assert.ok(html.startsWith("<!doctype html>"))
  assert.ok(html.includes("Ratio Essendi — Operations"))
  assert.ok(html.includes("Offer Builder"))
  assert.ok(html.includes("sales"))
  assert.ok(html.includes("approval.required"))
})
