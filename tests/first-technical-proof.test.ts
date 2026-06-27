import { test } from "node:test"
import assert from "node:assert/strict"
import { runFirstTechnicalProof } from "./scenario.js"

test("first technical proof satisfies docs/14 validation", () => {
  const result = runFirstTechnicalProof()
  for (const check of result.validation.checks) {
    assert.ok(check.ok, `${check.name} — ${check.detail}`)
  }
  assert.ok(result.validation.ok, "overall validation must pass")
})

test("event log captures the full 10-step lifecycle", () => {
  const result = runFirstTechnicalProof()
  const types = new Set(result.events.map((e) => e.eventType))
  const required = [
    "cell.created",
    "cell.activated",
    "agent.created",
    "agent.activated",
    "agent.task_assigned",
    "agent.output_evaluated",
    "agent.drift_detected",
    "agent.succession_brief_created",
    "agent.successor_created",
    "agent.replaced",
    "cell.shadow_prepared",
    "cell.shadow_promoted",
  ]
  for (const eventType of required) {
    assert.ok(types.has(eventType), `missing event: ${eventType}`)
  }
})
