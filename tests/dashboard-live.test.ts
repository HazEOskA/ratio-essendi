import { test } from "node:test"
import assert from "node:assert/strict"
import { localReport } from "@ratio-essendi/dashboard"
import { World } from "./world.js"

test("operator can approve a pending offer (decision recorded, nothing sent)", async () => {
  const world = new World()
  await world.spawnOffer()

  const pending = world.state().pending.filter((p) => p.status === "pending")
  assert.ok(pending.length >= 1, "an offer should be pending")

  const target = pending[0]
  assert.ok(target)
  world.approve(target.id)

  const after = world.state()
  assert.equal(after.pending.find((p) => p.id === target.id)?.status, "approved")
  assert.ok(after.snapshot.events.some((e) => e.eventType === "approval.granted"))
  assert.equal(after.snapshot.events.filter((e) => e.eventType.includes("sent")).length, 0)
})

test("operator can quarantine a drifting agent", () => {
  const world = new World()
  world.injectDrift()

  const drifter = world.state().snapshot.agents.find((a) => a.status === "succession_required")
  assert.ok(drifter, "a drifting agent should be flagged")

  world.quarantine(drifter.id)
  assert.equal(world.gov.agents.getAgent(drifter.id).status, "disabled")
})

test("operator can force succession, preserving lineage", () => {
  const world = new World()
  world.injectDrift()
  const drifter = world.state().snapshot.agents.find((a) => a.status === "succession_required")
  assert.ok(drifter)

  world.forceSuccession(drifter.id)
  const failed = world.gov.agents.getAgent(drifter.id)
  assert.equal(failed.status, "replaced")
  assert.ok(failed.lineage.successorId, "failed agent must point to its successor")
})

test("local report summarizes pending approvals and attention", async () => {
  const world = new World()
  await world.spawnOffer()
  world.injectDrift()

  const report = localReport(world.state())
  assert.ok(report.includes("operator report"))
  assert.match(report, /Pending your approval/)
  assert.match(report, /Needs attention/)
})
