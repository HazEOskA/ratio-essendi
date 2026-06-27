import { runFactorySeason, VALUE_PER_QUALIFIED_LEAD } from "./factory-season.js"

const r = runFactorySeason()
const usd = (n: number): string => `$${n.toLocaleString("en-US")}`
const pct = (n: number): string => `${Math.round(n * 100)}%`

console.log("\n=== Ratio Essendi — Factory Season (value demonstration) ===\n")

console.log("Per-agent (initial → final score):")
for (const row of r.rows) {
  const tag = row.replacedBy ? `  replaced by ${row.replacedBy}` : "  (kept)"
  console.log(
    `  ${row.agent.padEnd(16)} ${row.initialScore.toFixed(2)} → ${row.finalScore.toFixed(2)}${tag}`,
  )
}

console.log("\nScorecard:")
console.log(`  agents evaluated:          ${r.after.evaluated}`)
console.log(`  pass rate:                 ${pct(r.before.passRate)} → ${pct(r.after.passRate)}`)
console.log(`  qualified leads:           ${r.before.qualifiedLeads} → ${r.after.qualifiedLeads}`)
console.log(
  `  modeled pipeline value:    ${usd(r.before.modeledValue)} → ${usd(r.after.modeledValue)}  (+${r.upliftPct}%)`,
)
console.log(`  weak producers replaced:   ${r.replaced}`)
console.log(`  events logged (one log):   ${r.events.length}`)
console.log(`  split-brain invariants:    ${r.invariants.ok ? "OK" : r.invariants.problems.join("; ")}`)
console.log(`  [model assumption: ${usd(VALUE_PER_QUALIFIED_LEAD)} per qualified lead]`)

console.log(
  `\nThe system autonomously detected ${r.replaced} weak value-producer(s) and replaced them,\n` +
    `raising modeled pipeline value by +${r.upliftPct}% — every decision logged, no split-brain.\n`,
)

if (r.after.modeledValue <= r.before.modeledValue || !r.invariants.ok) process.exit(1)
