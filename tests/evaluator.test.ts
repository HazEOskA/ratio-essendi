import { test } from "node:test"
import assert from "node:assert/strict"
import { evaluateAgent } from "@ratio-essendi/evaluation-engine"
import { getLog, clearLog } from "@ratio-essendi/event-log"

test("evaluateAgent passes and emits agent.output_evaluated when score >= 0.5", () => {
  clearLog()
  const result = evaluateAgent(
    "agent-x",
    "Clear offer with strong margin and a booked demo.",
    ["offer", "margin", "demo"],
  )
  assert.equal(result.agentId, "agent-x")
  assert.equal(result.passed, true)
  assert.ok(result.score >= 0.5, `score was ${result.score}`)
  assert.deepEqual(result.failureReasons, [])
  assert.equal(typeof result.timestamp, "string")

  assert.equal(getLog().filter((e) => e.eventType === "agent.output_evaluated").length, 1)
  assert.equal(getLog().filter((e) => e.eventType === "agent.failure_detected").length, 0)
})

test("evaluateAgent fails and emits agent.failure_detected when score < 0.5", () => {
  clearLog()
  const result = evaluateAgent("agent-y", "off-topic blast", ["offer", "margin", "demo"])
  assert.equal(result.passed, false)
  assert.ok(result.score < 0.5, `score was ${result.score}`)
  assert.ok(result.failureReasons.length > 0)

  const failures = getLog().filter((e) => e.eventType === "agent.failure_detected")
  assert.equal(failures.length, 1)
  assert.equal(failures[0]?.entityId, "agent-y")
  assert.deepEqual(failures[0]?.evidence, result.failureReasons)
})
