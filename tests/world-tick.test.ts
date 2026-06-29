import { test } from "node:test"
import assert from "node:assert/strict"
import { World } from "./world.js"

// Helper: fresh world, no file store, stub provider
function makeWorld() {
  return new World()
}

test("background tick() called 8 times creates zero pending offers", async () => {
  const w = makeWorld()
  for (let i = 0; i < 8; i++) await w.tick()
  const pending = w.state().pending.filter((p) => p.status === "pending")
  assert.equal(pending.length, 0, `Expected 0 pending offers, got ${pending.length}`)
})

test("background tick() called 8 times creates drift/succession events on tick 4 and 8", async () => {
  const w = makeWorld()
  for (let i = 0; i < 8; i++) await w.tick()
  const log = w.gov.log.all()
  const driftEvents = log.filter((e) => e.eventType === "agent.drift_detected")
  // seq % 4 === 0 triggers at seq=4 and seq=8
  assert.ok(driftEvents.length >= 2, `Expected at least 2 drift events, got ${driftEvents.length}`)
})

test("manual action('tick') creates exactly one pending offer", async () => {
  const w = makeWorld()
  await w.action("tick", "")
  const pending = w.state().pending.filter((p) => p.status === "pending")
  assert.equal(pending.length, 1, `Expected exactly 1 pending offer, got ${pending.length}`)
  assert.ok(
    w.gov.log.all().some((e) => e.eventType === "approval.required"),
    "approval.required must be in the log",
  )
})

test("injectDrift() creates drift events but no pending offers", () => {
  const w = makeWorld()
  w.injectDrift()
  const pending = w.state().pending.filter((p) => p.status === "pending")
  assert.equal(pending.length, 0, "injectDrift must not create any pending offers")
  const log = w.gov.log.all()
  assert.ok(
    log.some((e) => e.eventType === "agent.drift_detected"),
    "injectDrift must log agent.drift_detected",
  )
})
