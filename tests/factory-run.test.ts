import { test } from "node:test"
import assert from "node:assert/strict"
import { runFactorySeason } from "./factory-season.js"

test("factory season increases pass rate and modeled value via succession", () => {
  const r = runFactorySeason()
  assert.ok(r.replaced >= 1, "at least one weak producer should be replaced")
  assert.ok(r.after.passRate > r.before.passRate, "pass rate must improve")
  assert.ok(r.after.modeledValue > r.before.modeledValue, "modeled value must improve")
  assert.ok(r.upliftPct > 0, "uplift must be positive")
})

test("factory season keeps the system coherent (no split-brain, one log)", () => {
  const r = runFactorySeason()
  assert.ok(r.invariants.ok, r.invariants.problems.join("; "))
  // Evaluation events land in the same log as cell/agent/succession events.
  const types = new Set(r.events.map((e) => e.eventType))
  assert.ok(types.has("cell.created"))
  assert.ok(types.has("agent.failure_detected"))
  assert.ok(types.has("agent.output_evaluated"))
  assert.ok(types.has("agent.successor_created"))
})
