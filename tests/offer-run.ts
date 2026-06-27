import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { runOfferAgent, selectOfferProvider } from "@ratio-essendi/offer-builder"

const brief = {
  icp: "Seed-stage B2B SaaS founders (10-50 employees)",
  product: "Fractional RevOps sprint",
  constraints: ["2-week delivery", "fixed scope", "no discounting below 60% margin"],
  kpis: ["offer", "price", "margin", "call to action"],
}

resetIds()
const { provider, mode } = selectOfferProvider()

console.log("\n=== Ratio Essendi — Offer Agent (real output) ===")
console.log(
  mode === "anthropic"
    ? "Provider: Anthropic claude-opus-4-8 (LIVE)\n"
    : "Provider: stub (no ANTHROPIC_API_KEY — deterministic offline output)\n",
)

const gov = new MetaGovernor()
const cell = gov.registerCell({
  name: "Sales Factory",
  domain: "sales",
  purpose: "Generate profitable booked calls for the selected ICP.",
  memoryScope: "sales/offers",
  budgetLimit: 1000,
  kpis: brief.kpis,
})

const result = await runOfferAgent(gov, cell.id, brief, provider)

console.log("--- Generated offer ---")
console.log(result.offer)
console.log("\n--- Decision ---")
console.log(`evaluated:        passed=${result.passed}  score=${result.score}`)
console.log(`status:           ${result.status}`)
console.log(
  `sent to client:   ${result.sent}  ${result.sent ? "" : "(blocked by approval gate — docs/13)"}`,
)

console.log("\n--- Event log ---")
for (const e of gov.log.all()) {
  console.log(`  ${e.eventType.padEnd(26)} ${e.entityId}${e.reason ? `  — ${e.reason}` : ""}`)
}
console.log()
