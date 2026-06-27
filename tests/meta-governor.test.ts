import { test } from "node:test"
import assert from "node:assert/strict"
import { MetaGovernor } from "@ratio-essendi/meta-governor"

const drift = (gov: MetaGovernor) =>
  gov.log.all().find((e) => e.eventType.endsWith("drift_detected"))

test("detectDrift preserves a cell entity type in the log", () => {
  const gov = new MetaGovernor()
  const event = gov.detectDrift({
    entityId: "cell-x",
    entityType: "cell",
    observedSignals: ["ownership conflict"],
    lastAlignedCheckpoint: "cell-x:init",
  })
  assert.ok(event)
  const logged = drift(gov)
  assert.equal(logged?.eventType, "cell.drift_detected")
  assert.equal(logged?.entityType, "cell")
})

test("detectDrift maps llm_session to a valid system entity type but keeps it in the event type", () => {
  const gov = new MetaGovernor()
  gov.detectDrift({
    entityId: "sess-1",
    entityType: "llm_session",
    observedSignals: ["repeats old architecture after correction"],
    lastAlignedCheckpoint: "sess-1:init",
  })
  const logged = drift(gov)
  assert.equal(logged?.eventType, "llm_session.drift_detected")
  assert.equal(logged?.entityType, "system")
})

test("agent drift still logs agent.drift_detected (unchanged)", () => {
  const gov = new MetaGovernor()
  gov.detectDrift({
    entityId: "agent-x",
    entityType: "agent",
    observedSignals: ["overplans instead of acting"],
    lastAlignedCheckpoint: "agent-x:init",
  })
  const logged = drift(gov)
  assert.equal(logged?.eventType, "agent.drift_detected")
  assert.equal(logged?.entityType, "agent")
})
