import { runFirstTechnicalProof } from "./scenario.js"

const result = runFirstTechnicalProof()

console.log("\n=== Ratio Essendi — First Technical Proof (docs/14) ===\n")
console.log("Event log (state transitions):")
for (const [i, e] of result.events.entries()) {
  const transition =
    e.previousState ?? e.nextState
      ? `  [${e.previousState ?? "∅"} → ${e.nextState ?? "∅"}]`
      : ""
  const line = `${String(i + 1).padStart(2, "0")}. ${e.eventType.padEnd(28)} ${e.entityId.padEnd(10)}${transition}`
  console.log(line + (e.reason ? `\n      reason: ${e.reason}` : ""))
}

console.log("\nValidation (docs/14):")
for (const c of result.validation.checks) {
  console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.name} — ${c.detail}`)
}

console.log("\nSummary:", JSON.stringify(result.summary, null, 2))
console.log(`\nProof ${result.validation.ok ? "PASSED" : "FAILED"}\n`)

if (!result.validation.ok) process.exit(1)
