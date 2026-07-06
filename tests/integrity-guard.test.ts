import { test } from "node:test"
import assert from "node:assert/strict"
import {
  DriftSensor,
  PinocchioNose,
  HRARProtocol,
  RatioEssendiGuard,
  mean,
  stdDev,
} from "@ratio-essendi/integrity-guard"

// ─── DriftSensor ──────────────────────────────────────────────────────────────

test("DriftSensor: z-score math matches the spec", () => {
  assert.equal(mean([100, 102, 99, 101, 100]), 100.4)
  const sensor = new DriftSensor([100, 102, 99, 101, 100])
  // stable window near baseline → small drift
  const calm = sensor.calculateDrift([101, 100, 102])
  assert.ok(calm < 1, `calm drift should be < 1, got ${calm}`)
  // anomaly window far from baseline → huge drift
  const anomaly = sensor.calculateDrift([350, 400, 380])
  assert.ok(anomaly > 100, `anomaly drift should be large, got ${anomaly}`)
})

test("DriftSensor: flat baseline falls back to std=1 (no divide-by-zero)", () => {
  const sensor = new DriftSensor([5, 5, 5, 5])
  assert.equal(sensor.baselineStd, 1)
  assert.equal(sensor.calculateDrift([8]), 3)
})

test("DriftSensor: empty baseline throws; empty window reads 0", () => {
  assert.throws(() => new DriftSensor([]))
  const sensor = new DriftSensor([1, 2, 3])
  assert.equal(sensor.calculateDrift([]), 0)
  assert.equal(stdDev([2, 2, 2]), 0)
})

// ─── PinocchioNose ────────────────────────────────────────────────────────────

test("PinocchioNose: spec mode — nose = min(100, drift*20), breach at limit", () => {
  const nose = new PinocchioNose({ criticalLimit: 80 })
  assert.equal(nose.setFromDrift(1), false)
  assert.equal(nose.noseLength, 20)
  assert.equal(nose.setFromDrift(3.9), false)
  assert.equal(nose.noseLength, 78)
  assert.equal(nose.setFromDrift(4), true)
  assert.equal(nose.noseLength, 80)
  assert.equal(nose.setFromDrift(999), true)
  assert.equal(nose.noseLength, 100, "nose is capped at 100")
})

test("PinocchioNose: cumulative mode — grow/shrink with clamping", () => {
  const nose = new PinocchioNose({ criticalLimit: 80 })
  assert.equal(nose.grow(25), false)
  assert.equal(nose.grow(25), false)
  assert.equal(nose.grow(25), false) // 75
  assert.equal(nose.grow(25), true) // 100 → breach
  nose.shrink(500)
  assert.equal(nose.noseLength, 0, "shrink clamps at 0")
  assert.equal(nose.isBreached(), false)
})

// ─── HRARProtocol ─────────────────────────────────────────────────────────────

test("HRARProtocol: runs cleanup, reports, and does NOT exit by default", async () => {
  let cleaned = false
  const protocol = new HRARProtocol({ cleanup: () => { cleaned = true } })
  const report = await protocol.execute(85)
  // The fact this line runs at all proves no process.exit happened.
  assert.equal(cleaned, true)
  assert.equal(report.cleanupRan, true)
  assert.equal(report.finalNoseLength, 85)
  assert.equal(report.processExitRequested, false)
})

test("HRARProtocol: cleanup failure is captured, not thrown", async () => {
  const protocol = new HRARProtocol({
    cleanup: () => { throw new Error("cleanup boom") },
  })
  const report = await protocol.execute(90)
  assert.equal(report.cleanupRan, false)
  assert.equal(report.cleanupError, "cleanup boom")
})

// ─── RatioEssendiGuard (facade) ───────────────────────────────────────────────

test("RatioEssendiGuard: stable data → action runs with its arguments", async () => {
  const guard = new RatioEssendiGuard({ baselineData: [100, 102, 99, 101, 100], criticalNoseLimit: 75 })
  const verdict = await guard.monitorAction(
    [101, 100, 102],
    (pair: string, amount: number) => `trade ${pair} ${amount}`,
    "SOL/USDC",
    500,
  )
  assert.equal(verdict.allowed, true)
  assert.equal(verdict.result, "trade SOL/USDC 500")
  assert.ok(verdict.noseLength < 75)
})

test("RatioEssendiGuard: drifted data → action blocked, HRAR executed with cleanup", async () => {
  let positionsClosed = false
  const guard = new RatioEssendiGuard({
    baselineData: [100, 102, 99, 101, 100],
    criticalNoseLimit: 75,
    cleanup: () => { positionsClosed = true },
  })
  let actionRan = false
  const verdict = await guard.monitorAction([350, 400, 380], () => { actionRan = true })
  assert.equal(verdict.allowed, false)
  assert.equal(actionRan, false, "the agent action must never run after a breach")
  assert.equal(positionsClosed, true, "emergency cleanup must run")
  assert.equal(verdict.noseLength, 100)
  assert.ok(verdict.hrar)
  assert.equal(verdict.hrar!.cleanupRan, true)
})

test("RatioEssendiGuard: supports async actions", async () => {
  const guard = new RatioEssendiGuard({ baselineData: [10, 11, 9, 10] })
  const verdict = await guard.monitorAction([10], async (x: number) => x * 2, 21)
  assert.equal(verdict.allowed, true)
  assert.equal(verdict.result, 42)
})
