import { selectJudge } from "@ratio-essendi/evaluation-engine"

const STRONG =
  "Offer: Fractional RevOps sprint for seed-stage B2B SaaS founders.\n" +
  "Price: $4,000 fixed\nMargin: ~65% protected (no discounting below floor)\n" +
  "Call to action: Book a 20-minute scoping demo this week."
const WEAK = "off-topic blast, no targeting, generic spam, no pricing"

const { judge, mode } = selectJudge()

console.log("\n=== Ratio Essendi — Offer Quality Judge ===")
console.log(
  mode === "anthropic"
    ? "Judge: Anthropic claude-opus-4-8 (LIVE)\n"
    : "Judge: heuristic (no ANTHROPIC_API_KEY — deterministic offline grading)\n",
)

for (const [label, offer] of [
  ["STRONG draft", STRONG],
  ["WEAK draft", WEAK],
] as const) {
  const v = await judge.judge({ output: offer, context: "ICP: seed-stage B2B SaaS founders" })
  console.log(`${label}: verdict=${v.verdict}  score=${v.score}  passed=${v.passed}`)
  if (v.reasons.length) console.log(`  reasons: ${v.reasons.join("; ")}`)
}

console.log(
  "\nNote: a KPI-presence check passes anything with the right labels. The judge grades\n" +
    "quality, so a label-only or off-topic draft is caught and routed to succession.\n",
)
