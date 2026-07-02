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
  assert.match(page, /Factory is waiting for operator review|training quota/)

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
})

test("paused autopilot remains paused after a real server restart", async () => {
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
  assert.equal((dataFile("settings.json") as { autopilotEnabled: boolean }).autopilotEnabled, false)
})
