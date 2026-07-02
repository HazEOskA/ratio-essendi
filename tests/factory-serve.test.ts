/**
 * HTTP-level hardening tests for the factory server. Spawns the real server
 * as a child process in a temp working dir (fresh .factory-data) on a
 * dedicated port, so nothing here touches the repo or the default 7778.
 */
import { test, after } from "node:test"
import assert from "node:assert/strict"
import { spawn, type ChildProcess } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { tmpdir } from "node:os"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const TSX_CLI = join(ROOT, "node_modules", "tsx", "dist", "cli.mjs")
const SERVER = join(ROOT, "tests", "factory-serve.ts")
const PORT = 7871
const BASE = `http://127.0.0.1:${PORT}`

const workDir = mkdtempSync(join(tmpdir(), "factory-serve-test-"))
let child: ChildProcess | undefined

async function startServer(): Promise<void> {
  child = spawn(process.execPath, [TSX_CLI, SERVER], {
    cwd: workDir,
    env: { ...process.env, PORT: String(PORT) },
    stdio: "ignore",
  })
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${BASE}/`)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error("server did not become ready within 10s")
}

async function stopServer(): Promise<void> {
  if (!child) return
  const c = child
  child = undefined
  await new Promise<void>((resolve) => {
    c.once("exit", () => resolve())
    c.kill("SIGTERM")
  })
}

after(async () => {
  await stopServer()
  rmSync(workDir, { recursive: true, force: true })
})

const dataFile = (name: string) => JSON.parse(readFileSync(join(workDir, ".factory-data", name), "utf8"))
const rawDataFile = (name: string) => readFileSync(join(workDir, ".factory-data", name), "utf8")

test("invalid department returns 400 with a clean JSON error", async () => {
  await startServer()
  const res = await fetch(`${BASE}/api/order`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientName: "EvilCo",
      department: "warp-drive",
      description: "landing page for time travelers",
    }),
  })
  assert.equal(res.status, 400)
  assert.match(res.headers.get("content-type") ?? "", /application\/json/)
  const body = (await res.json()) as { error: string; received: string; allowed: string[] }
  assert.equal(body.error, "invalid department")
  assert.equal(body.received, "warp-drive")
  assert.deepEqual(body.allowed, ["marketing", "sales", "delivery", "research", "qa"])
})

test("invalid department writes no order and no order events", () => {
  const orders = dataFile("orders.json") as unknown[]
  assert.equal(orders.length, 0, "no order may be created for an invalid department")
  const events = dataFile("events.json") as { eventType: string }[]
  const orderEvents = events.filter((e) => e.eventType.startsWith("order."))
  assert.equal(orderEvents.length, 0, `no order.* events allowed, got: ${orderEvents.map((e) => e.eventType).join(",")}`)
})

test("admin cockpit renders required sections and GET does not mutate store", async () => {
  const files = [
    "orders.json",
    "daily-digitals.json",
    "daily-missions.json",
    "events.json",
    "warehouse.json",
    "trash.json",
    "settings.json",
    "work-runs.json",
  ]
  const before = files.map((name) => [name, rawDataFile(name)])

  const res = await fetch(`${BASE}/admin`)
  assert.equal(res.status, 200)
  const page = await res.text()
  assert.match(page, /Boss\/Admin Cockpit/)
  assert.match(page, /autopilot ON/)
  assert.match(page, /Next Operator Action/)
  assert.match(page, /Orders Summary/)
  assert.match(page, /Training Count/)
  assert.match(page, /Warehouse Summary/)
  assert.match(page, /Event Stream/)
  assert.match(page, /Client Orders Control/)
  assert.match(page, /Daily Training Review/)
  assert.match(page, /Factory Workroom/)
  assert.match(page, /Recent Work Runs/)
  assert.match(page, /Why It Is Standing Still/)
  // Specific waiting reason with real counts, not a vague placeholder:
  // startup autopilot created 5 training drafts, no client orders yet.
  assert.match(page, /Factory is waiting for operator review: 0 client outputs and 5 training drafts are pending\./)
  // Agent work cards show honest derived state and real fields
  assert.match(page, /N · Factory Director/)
  assert.match(page, /Last input:/)
  assert.match(page, /Last job:/)
  assert.match(page, /waiting_review/)
  // Boss status header: safe-mode indicator + persisted last cycle info
  assert.match(page, /SAFE MODE — no external send/)
  assert.match(page, /local single-instance/)
  assert.match(page, /last cycle: NO_CLIENT_TRAINING_MODE · completed · via startup/)
  assert.doesNotMatch(page, /none recorded yet/)
  // Operator queue is an actionable table, not a bare list
  assert.match(page, /Next safe action/)
  assert.match(page, /href="#out-dd-/)

  const alias = await fetch(`${BASE}/operator`)
  assert.equal(alias.status, 200)
  assert.match(await alias.text(), /Boss\/Admin Cockpit/)

  const after = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(after, before, "GET /admin and /operator must not mutate the store")
})

test("valid department is still accepted (whitelist does not over-block)", async () => {
  const res = await fetch(`${BASE}/api/order`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientName: "GoodCo",
      department: "sales",
      description: "objection handling script",
    }),
  })
  assert.equal(res.status, 200)
  const orders = dataFile("orders.json") as { status: string }[]
  assert.equal(orders.length, 1)
  assert.equal(orders[0]!.status, "ready_for_review")

  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /GoodCo/)
  assert.match(admin, /ready_for_review/)
  assert.match(admin, /deliverable/)
  assert.match(admin, /Client Orders Control - ready_for_review/)
  assert.match(admin, /Daily Training Review/)
  assert.match(admin, /Factory Workroom/)
  assert.match(admin, /SA · Sales Producer/)
  assert.match(admin, /client_order_production/)
  assert.match(admin, /dd-order-/)
  // The SA card must tie the output back to the order and prompt review
  assert.match(admin, /Related order:/)
  assert.match(admin, /Output id:/)
  assert.match(admin, /Review client order/)
  // Output id links to the output card anchor; queue row carries the producer
  assert.match(admin, /href="#out-dd-order-/)
  assert.match(admin, /id="out-dd-order-/)
})

test("training visibility: 5/5 quota, every producer agent attributed, separated from client outputs", async () => {
  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /5\/5/)
  // every training card names its producing agent
  for (const agent of ["MA", "SA", "DA", "RA", "QAA"]) {
    assert.match(admin, new RegExp(`by ${agent}`), `training output attributed to ${agent} must be visible`)
  }
  // client outputs and training outputs live in visibly separate sections
  assert.match(admin, /Client Orders Control - ready_for_review/)
  assert.match(admin, /Daily Training Review/)
  const trainingSection = admin.slice(admin.indexOf("Daily Training Review"))
  assert.doesNotMatch(trainingSection.slice(0, trainingSection.indexOf("Factory Workroom")), /GoodCo/,
    "client order content must not appear inside the training review section")
})

test("rework flow: feedback, regeneration, revision count, and rework work run all visible on /admin", async () => {
  const orders = dataFile("orders.json") as { id: string; deliverableId?: string; clientName: string }[]
  const goodCo = orders.find((o) => o.clientName === "GoodCo")!
  assert.ok(goodCo.deliverableId, "GoodCo order must have a deliverable")

  // Operator requests rework with concrete feedback
  const feedback = "Make it more concrete. Add 3 objections and short answers."
  const rework = await fetch(`${BASE}/api/daily`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "rework", id: goodCo.deliverableId!, feedback, returnTo: "/admin" }),
  })
  assert.equal(rework.status, 200)

  // Standing-still reason must now explain the rework wait
  const waiting = await (await fetch(`${BASE}/admin`)).text()
  assert.match(waiting, /waiting for the rework cycle to regenerate 1 flagged output/)

  // Run the cycle — regenerates the flagged deliverable
  const run = await fetch(`${BASE}/api/daily`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "run", returnTo: "/admin" }),
  })
  assert.equal(run.status, 200)

  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /Make it more concrete\. Add 3 objections and short answers\./)
  assert.match(admin, /rev 1/)
  assert.match(admin, /client_order_rework/)
  assert.match(admin, /REWORK_MODE/)

  const digitals = dataFile("daily-digitals.json") as { id: string; revisionCount: number; status: string }[]
  const regenerated = digitals.find((d) => d.id === goodCo.deliverableId)!
  assert.equal(regenerated.revisionCount, 1)
  assert.equal(regenerated.status, "draft_ready")
})

test("GET /api/admin/state is read-only and returns useful cockpit state", async () => {
  const files = ["orders.json", "daily-digitals.json", "events.json", "work-runs.json", "settings.json"]
  const before = files.map((name) => [name, rawDataFile(name)])

  const res = await fetch(`${BASE}/api/admin/state`)
  assert.equal(res.status, 200)
  assert.match(res.headers.get("content-type") ?? "", /application\/json/)
  const body = (await res.json()) as {
    autopilotEnabled: boolean
    mode: string
    standingStill: string
    nextOperatorAction: { title: string; detail: string }
    waiting: { ordersReadyForReview: number; trainingDrafts: number; needsRework: number; pendingApprovals: number }
    counts: { orders: number; workRuns: number; trainingToday: string }
    orders: { id: string; status: string }[]
    latestWorkRun: { id: string; mode: string; steps: { agentId: string; inputSummary: string }[] } | null
    workRunsSummary: { id: string; mode: string; steps: number; nextOperatorAction: string }[]
  }
  assert.equal(body.autopilotEnabled, true)
  assert.ok(body.standingStill.length > 10, "standingStill must be a real explanation")
  assert.equal(body.nextOperatorAction.title, "Review client order")
  assert.ok(body.waiting.ordersReadyForReview >= 1)
  assert.equal(body.counts.trainingToday, "5/5")
  assert.ok(body.orders.length >= 1)
  assert.ok(body.latestWorkRun, "latestWorkRun must be exposed")
  assert.ok(body.latestWorkRun!.steps.length >= 1, "latestWorkRun must include full steps")
  assert.ok(body.workRunsSummary.length >= 1)
  assert.ok(body.workRunsSummary[0]!.steps >= 1)

  const after = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(after, before, "GET /api/admin/state must not mutate the store")
})

test("GET /api/work-runs is read-only and returns recent runs with full steps", async () => {
  const files = ["orders.json", "daily-digitals.json", "events.json", "work-runs.json"]
  const before = files.map((name) => [name, rawDataFile(name)])

  const res = await fetch(`${BASE}/api/work-runs`)
  assert.equal(res.status, 200)
  const body = (await res.json()) as {
    total: number
    workRuns: { id: string; mode: string; steps: { agentName: string; inputSummary: string }[]; nextOperatorAction: string }[]
  }
  assert.ok(body.total >= 1)
  assert.ok(body.workRuns.length >= 1)
  const latest = body.workRuns[0]!
  assert.ok(latest.steps.length >= 1)
  assert.ok(latest.steps[0]!.agentName.length > 0)
  assert.ok(latest.steps[0]!.inputSummary.length > 0)
  assert.ok(latest.nextOperatorAction.length > 0)
  // a rework run must exist after the previous test
  assert.ok(body.workRuns.some((r) => r.mode === "REWORK_MODE"), "REWORK_MODE run must be recorded")

  const after = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(after, before, "GET /api/work-runs must not mutate the store")
})

test("paused autopilot remains paused after a real server restart", async () => {
  // Clear the ready order first so the paused state has ONLY training drafts
  // pending — the exact scenario where "resume autopilot" would be misleading.
  const orders = dataFile("orders.json") as { clientName: string; deliverableId?: string }[]
  const goodCo = orders.find((o) => o.clientName === "GoodCo")!
  const wh = await fetch(`${BASE}/api/daily`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "warehouse", id: goodCo.deliverableId!, returnTo: "/admin" }),
  })
  assert.equal(wh.status, 200)

  // Pause via the operator endpoint
  const off = await fetch(`${BASE}/api/autopilot`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "off" }),
  })
  assert.equal(off.status, 200)
  assert.equal((dataFile("settings.json") as { autopilotEnabled: boolean }).autopilotEnabled, false)
  const pageBefore = await (await fetch(`${BASE}/`)).text()
  assert.match(pageBefore, /autopilot OFF/)

  // Full process restart on the same data dir
  await stopServer()
  await startServer()

  const pageAfter = await (await fetch(`${BASE}/`)).text()
  assert.match(pageAfter, /autopilot OFF/, "pause must survive a restart")
  const adminAfter = await (await fetch(`${BASE}/admin`)).text()
  assert.match(adminAfter, /autopilot OFF/, "admin cockpit must show the persisted OFF state")
  assert.match(adminAfter, /Factory is paused because autopilot is OFF/, "standing-still reason must explain the pause")
  // Boss header must survive the restart from persisted work runs, not an
  // in-memory summary string: last run before restart was the rework cycle.
  assert.match(adminAfter, /last cycle: REWORK_MODE · completed · via daily_run/)
  assert.doesNotMatch(adminAfter, /none recorded yet/)
  assert.equal((dataFile("settings.json") as { autopilotEnabled: boolean }).autopilotEnabled, false)

  // Paused + drafts pending: next action must point at the review queue, NOT
  // at resuming autopilot (resuming clears nothing at the review gate).
  assert.match(adminAfter, /Review training assets/)
  const state = (await (await fetch(`${BASE}/api/admin/state`)).json()) as {
    autopilotEnabled: boolean
    nextOperatorAction: { title: string }
    waiting: { trainingDrafts: number; ordersReadyForReview: number }
  }
  assert.equal(state.autopilotEnabled, false)
  assert.equal(state.waiting.ordersReadyForReview, 0)
  assert.ok(state.waiting.trainingDrafts >= 1)
  assert.equal(state.nextOperatorAction.title, "Review training assets",
    "paused autopilot must not outrank pending review queues")
})
