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
const SERVER = join(ROOT, "tests", "factory-serve.ts")
const PORT = 7871
const BASE = `http://127.0.0.1:${PORT}`
const ACQ_AUTH = `Basic ${Buffer.from("test:secret").toString("base64")}`

const workDir = mkdtempSync(join(tmpdir(), "factory-serve-test-"))
let child: ChildProcess | undefined

async function startServer(): Promise<void> {
  child = spawn(process.execPath, ["--import", "tsx", SERVER], {
    // Resolve the tsx package from the repo, while keeping every persisted
    // runtime file inside the isolated temp directory.
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      FACTORY_DATA_DIR: join(workDir, ".factory-data"),
      ACQUISITION_ADMIN_USER: "test",
      ACQUISITION_ADMIN_PASSWORD: "secret",
    },
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
  rmSync(workDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
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
    "integrity.json",
  ]
  const before = files.map((name) => [name, rawDataFile(name)])

  const res = await fetch(`${BASE}/admin`)
  assert.equal(res.status, 200)
  const page = await res.text()
  assert.match(page, /Kokpit Szefa\/Administratora/)
  assert.match(page, /autopilot WŁ\./)
  assert.match(page, /Następna Akcja Operatora/)
  assert.match(page, /Podsumowanie Zleceń/)
  assert.match(page, /Licznik treningu/)
  assert.match(page, /Podsumowanie Magazynu/)
  assert.match(page, /Strumień Zdarzeń/)
  assert.match(page, /Kontrola Zleceń Klientów/)
  assert.match(page, /Przegląd Treningu Dziennego/)
  assert.match(page, /Warsztat Fabryki/)
  assert.match(page, /Ostatnie Przebiegi Pracy/)
  assert.match(page, /Dlaczego Stoi w Miejscu/)
  // Specific waiting reason with real counts, not a vague placeholder:
  // startup autopilot created 5 training drafts, no client orders yet.
  assert.match(page, /Fabryka czeka na przegląd operatora: zlecenia klienta — 0, szkice treningowe — 5\./)
  // Agent work cards show honest derived state and real fields
  assert.match(page, /N · Dyrektor Fabryki/)
  assert.match(page, /Ostatnie wejście:/)
  assert.match(page, /Ostatnie zadanie:/)
  assert.match(page, /czeka na przegląd/)
  // Boss status header: safe-mode indicator + persisted last cycle info
  assert.match(page, /TRYB BEZPIECZNY — brak wysyłki na zewnątrz/)
  assert.match(page, /lokalna pojedyncza instancja/)
  assert.match(page, /ostatni cykl: TRYB TRENINGOWY · zakończone · via startup/)
  assert.doesNotMatch(page, /jeszcze nic nie zarejestrowano/)
  // Operator queue is an actionable table, not a bare list
  assert.match(page, /Bezpieczna następna akcja/)
  assert.match(page, /href="#out-dd-/)

  const alias = await fetch(`${BASE}/operator`)
  assert.equal(alias.status, 200)
  assert.match(await alias.text(), /Kokpit Szefa\/Administratora/)

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
  assert.match(admin, /gotowe do przeglądu/)
  assert.match(admin, /deliverable/)
  assert.match(admin, /Kontrola Zleceń Klientów - gotowe do przeglądu/)
  assert.match(admin, /Przegląd Treningu Dziennego/)
  assert.match(admin, /Warsztat Fabryki/)
  assert.match(admin, /SA · Producent Sprzedaży/)
  assert.match(admin, /client_order_production/)
  assert.match(admin, /dd-order-/)
  // The SA card must tie the output back to the order and prompt review
  assert.match(admin, /Powiązane zlecenie:/)
  assert.match(admin, /ID wyjścia:/)
  assert.match(admin, /Przejrzyj zlecenie klienta/)
  // Output id links to the output card anchor; queue row carries the producer
  assert.match(admin, /href="#out-dd-order-/)
  assert.match(admin, /id="out-dd-order-/)
})

test("training visibility: 5/5 quota, every producer agent attributed, separated from client outputs", async () => {
  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /5\/5/)
  // every training card names its producing agent
  for (const agent of ["MA", "SA", "DA", "RA", "QAA"]) {
    assert.match(admin, new RegExp(`od ${agent}`), `training output attributed to ${agent} must be visible`)
  }
  // client outputs and training outputs live in visibly separate sections
  assert.match(admin, /Kontrola Zleceń Klientów - gotowe do przeglądu/)
  assert.match(admin, /Przegląd Treningu Dziennego/)
  const trainingSection = admin.slice(admin.indexOf("Przegląd Treningu Dziennego"))
  assert.doesNotMatch(trainingSection.slice(0, trainingSection.indexOf("Warsztat Fabryki")), /GoodCo/,
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
  assert.match(waiting, /czeka na cykl poprawek, by odtworzyć oznaczone wyniki: 1/)

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
  assert.match(admin, /TRYB POPRAWEK/)

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
  assert.equal(body.nextOperatorAction.title, "Przejrzyj zlecenie klienta")
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

test("service catalog visible on /factory-run and in /api/admin/state business loop", async () => {
  const page = await (await fetch(`${BASE}/factory-run`)).text()
  assert.match(page, /Katalog Usług \(6\)/)
  for (const name of [
    "AI Workflow Audit \\+ Mini Demo",
    "Website / Landing Page Audit",
    "Recruitment / Agency Ops Workflow Audit",
    "Client Dashboard Concept",
    "Social Content / Carousel Pack",
    "Process Automation Blueprint",
  ]) {
    assert.match(page, new RegExp(name), `service must be listed: ${name}`)
  }
  assert.match(page, /Dlaczego Stoi w Miejscu/)
  assert.match(page, /TRYB BEZPIECZNY — brak wysyłki na zewnątrz/)

  const state = (await (await fetch(`${BASE}/api/admin/state`)).json()) as {
    businessLoop: { servicesInCatalog: number; deliveryPacks: { draft: number }; caseRecords: number; trainingToday: string }
  }
  assert.equal(state.businessLoop.servicesInCatalog, 6)
  assert.equal(state.businessLoop.trainingToday, "5/5")
})

test("invalid service id is rejected cleanly: 400 JSON, no order, no order event", async () => {
  const ordersBefore = (dataFile("orders.json") as unknown[]).length
  const orderEventsBefore = (dataFile("events.json") as { eventType: string }[])
    .filter((e) => e.eventType.startsWith("order.")).length

  const res = await fetch(`${BASE}/api/order`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      clientName: "EvilCo",
      department: "sales",
      serviceId: "svc-nonexistent",
      description: "anything",
    }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string; received: string; allowed: string[] }
  assert.equal(body.error, "invalid service")
  assert.equal(body.received, "svc-nonexistent")
  assert.equal(body.allowed.length, 6)

  assert.equal((dataFile("orders.json") as unknown[]).length, ordersBefore, "no order may be created")
  const orderEventsAfter = (dataFile("events.json") as { eventType: string }[])
    .filter((e) => e.eventType.startsWith("order.")).length
  assert.equal(orderEventsAfter, orderEventsBefore, "no order.* event may be written")
})

test("demo HVAC order: explicit action creates a service-shaped internal order", async () => {
  const res = await fetch(`${BASE}/api/demo-order`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ returnTo: "/factory-run" }),
  })
  assert.equal(res.status, 200)

  const orders = dataFile("orders.json") as {
    clientName: string; serviceId?: string; serviceName?: string; status: string; deliverableId?: string
  }[]
  const hvac = orders.find((o) => o.clientName === "HVAC TestCo")!
  assert.ok(hvac, "demo order must exist")
  assert.equal(hvac.serviceId, "svc-ai-workflow-audit")
  assert.equal(hvac.status, "ready_for_review")
  assert.ok(hvac.deliverableId)

  // Output is shaped by the service, not a generic template
  const digitals = dataFile("daily-digitals.json") as { id: string; content: string }[]
  const out = digitals.find((d) => d.id === hvac.deliverableId)!
  assert.ok(out.content.includes("Workflow Diagnosis"))
  assert.ok(out.content.includes("Proposed Mini Demo"))
  assert.ok(out.content.includes("HVAC TestCo"))

  // /admin shows the service name for the client order
  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /AI Workflow Audit \+ Mini Demo/)
  assert.match(admin, /HVAC TestCo/)

  // Duplicate protection: second click does not create a second active demo
  await fetch(`${BASE}/api/demo-order`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ returnTo: "/factory-run" }),
  })
  const after = (dataFile("orders.json") as { clientName: string }[]).filter((o) => o.clientName === "HVAC TestCo")
  assert.equal(after.length, 1, "demo order must not duplicate while active")
})

test("delivery pack flow: approve output → pack draft → approve → warehouse → case record", async () => {
  const orders = dataFile("orders.json") as { clientName: string; id: string; deliverableId?: string }[]
  const hvac = orders.find((o) => o.clientName === "HVAC TestCo")!

  // Approve → create pack (single operator action)
  const create = await fetch(`${BASE}/api/delivery`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "create", outputId: hvac.deliverableId! }),
  })
  assert.equal(create.status, 200)

  let packs = dataFile("delivery-packs.json") as {
    id: string; status: string; clientName: string; serviceName: string
    sourceOutputId: string; orderId: string; recommendations: string[]; nextSteps: string[]
  }[]
  assert.equal(packs.length, 1)
  const pack = packs[0]!
  assert.equal(pack.status, "draft")
  assert.equal(pack.clientName, "HVAC TestCo")
  assert.equal(pack.serviceName, "AI Workflow Audit + Mini Demo")
  assert.equal(pack.sourceOutputId, hvac.deliverableId)
  assert.ok(pack.recommendations.length >= 3)
  assert.ok(pack.nextSteps.length >= 1)

  // The source order is now approved; its output sits in the warehouse
  const hvacAfter = (dataFile("orders.json") as { id: string; status: string }[]).find((o) => o.id === hvac.id)!
  assert.equal(hvacAfter.status, "approved")

  // /delivery renders the pack with client-usable markdown
  const deliveryPage = await (await fetch(`${BASE}/delivery`)).text()
  assert.match(deliveryPage, /HVAC TestCo/)
  assert.match(deliveryPage, /## Recommendations/)
  assert.match(deliveryPage, /## Next Steps/)
  assert.match(deliveryPage, /Zatwierdź Pakiet/)

  // Approve the pack
  const approve = await fetch(`${BASE}/api/delivery`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "approve", id: pack.id }),
  })
  assert.equal(approve.status, 200)
  packs = dataFile("delivery-packs.json") as typeof packs
  assert.equal(packs[0]!.status, "approved")

  // Warehouse the pack → case record
  const wh = await fetch(`${BASE}/api/delivery`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "warehouse", id: pack.id }),
  })
  assert.equal(wh.status, 200)
  packs = dataFile("delivery-packs.json") as typeof packs
  assert.equal(packs[0]!.status, "warehouse_ready")

  const cases = dataFile("case-records.json") as { clientName: string; deliveryPackId: string; followUpSuggestion: string }[]
  assert.equal(cases.length, 1)
  assert.equal(cases[0]!.clientName, "HVAC TestCo")
  assert.equal(cases[0]!.deliveryPackId, pack.id)
  assert.ok(cases[0]!.followUpSuggestion.length > 10)

  // Warehouse page shows the client-ready artifact
  const warehouse = await (await fetch(`${BASE}/warehouse`)).text()
  assert.match(warehouse, /Pakiety Dostawy \(1\)/)
  assert.match(warehouse, /gotowe do magazynu/)

  // /api/delivery-packs is read-only and reflects the loop
  const files = ["orders.json", "delivery-packs.json", "case-records.json", "events.json", "work-runs.json"]
  const before = files.map((name) => [name, rawDataFile(name)])
  const api = (await (await fetch(`${BASE}/api/delivery-packs`)).json()) as { total: number; caseRecords: unknown[] }
  assert.equal(api.total, 1)
  assert.equal(api.caseRecords.length, 1)
  const afterFiles = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(afterFiles, before, "GET /api/delivery-packs must not mutate the store")
})

test("production line: /production-line shows all 8 stations and all 6 agents", async () => {
  const page = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(page, /Linia Produkcyjna Agentów/)
  for (const station of ["Przyjęcie", "Badania", "Strategia", "Treść", "Realizacja", "QA", "Pakowanie", "Przegląd Operatora"]) {
    assert.match(page, new RegExp(station), `station must be visible: ${station}`)
  }
  for (const agent of ["N ·", "RA ·", "SA ·", "MA ·", "DA ·", "QAA ·"]) {
    assert.match(page, new RegExp(agent.replace("·", "·")), `agent must be visible: ${agent}`)
  }
  assert.match(page, /TRYB BEZPIECZNY — brak wysyłki na zewnątrz/)
  assert.match(page, /uczciwy widok synchroniczny/)
  assert.match(page, /Tablica Stacji/)
})

test("production line: training line shows 5/5 today with per-agent attribution", async () => {
  const page = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(page, /Limit treningu/)
  assert.match(page, /5\/5/)
  assert.match(page, /Linia Treningowa \(5\)/)
  // training tasks carry a source badge and their producing agent
  assert.match(page, /trening/)
  for (const agent of ["MA", "SA", "DA", "RA", "QAA"]) {
    assert.match(page, new RegExp(`>${agent}<`), `training task by ${agent} must be visible`)
  }
})

test("production line: client line shows demo client, service, path, output id, next action", async () => {
  const page = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(page, /Linia Klienta/)
  assert.match(page, /HVAC TestCo/)
  assert.match(page, /AI Workflow Audit \+ Mini Demo/)
  assert.match(page, /GoodCo/)
  // client task ties to its output + order and states the next operator action
  assert.match(page, /stacja: (Realizacja|Strategia)/)
  assert.match(page, /output dd-order-/)
  assert.match(page, /Dalej:/)
})

test("production line: rework line shows feedback, constraints, and revision after a cycle", async () => {
  const orders = dataFile("orders.json") as { clientName: string; deliverableId?: string }[]
  const goodCo = orders.find((o) => o.clientName === "GoodCo")!
  const revBefore = (dataFile("daily-digitals.json") as { id: string; revisionCount: number }[])
    .find((d) => d.id === goodCo.deliverableId)!.revisionCount

  // Flag GoodCo's deliverable for rework with concrete feedback
  const feedback = "Make it specific for a 10-person HVAC install team."
  const rw = await fetch(`${BASE}/api/daily`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "rework", id: goodCo.deliverableId!, feedback, returnTo: "/production-line" }),
  })
  assert.equal(rw.status, 200)

  // Before running the cycle, the rework line must show the flagged item + feedback
  const flagged = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(flagged, /Linia Poprawek \(1\)/)
  assert.match(flagged, /Make it specific for a 10-person HVAC install team\./)
  assert.match(flagged, /ograniczenia:/)

  // Run the cycle → regenerates; GoodCo returns to ready_for_review, rev bumped
  const run = await fetch(`${BASE}/api/daily`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "run", returnTo: "/production-line" }),
  })
  assert.equal(run.status, 200)
  const digitals = dataFile("daily-digitals.json") as { id: string; revisionCount: number; status: string }[]
  const regenerated = digitals.find((d) => d.id === goodCo.deliverableId)!
  assert.equal(regenerated.revisionCount, revBefore + 1, "revision count must increment by exactly one")
  assert.equal(regenerated.status, "draft_ready")
  const page = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(page, new RegExp(`rev ${revBefore + 1}`))
})

test("production line: delivery pack line shows the warehoused pack + packaging station", async () => {
  const page = await (await fetch(`${BASE}/production-line`)).text()
  assert.match(page, /Linia Pakietów Dostawy \(1\)/)
  assert.match(page, /gotowe do magazynu|Pakowanie/)
  assert.match(page, /pack-/)
})

test("admin: compact Agent Production Line section links to /production-line", async () => {
  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /Linia Produkcyjna Agentów/)
  assert.match(admin, /href="\/production-line"/)
  assert.match(admin, /Aktywne zadania klienckie/)
  assert.match(admin, /Zadania poprawek/)
  assert.match(admin, /Zadania pakietów czekające/)
  // the compact station table renders all stations
  assert.match(admin, /Przegląd Operatora/)
})

test("/api/production-line is read-only and returns a useful production view", async () => {
  const files = ["orders.json", "daily-digitals.json", "events.json", "work-runs.json", "delivery-packs.json", "case-records.json"]
  const before = files.map((name) => [name, rawDataFile(name)])

  const res = await fetch(`${BASE}/api/production-line`)
  assert.equal(res.status, 200)
  assert.match(res.headers.get("content-type") ?? "", /application\/json/)
  const body = (await res.json()) as {
    mode: string; safeMode: boolean; trainingToday: string; nextOperatorAction: string
    stations: { id: string; agentId: string; status: string }[]
    clientLine: { clientName?: string; source: string }[]
    trainingLine: unknown[]; reworkLine: unknown[]; deliveryPackLine: unknown[]
    deliveryPacks: { warehouseReady: number }
  }
  assert.equal(body.safeMode, true)
  assert.equal(body.stations.length, 8)
  assert.ok(body.stations.some((st) => st.id === "operator_review"))
  assert.ok(body.trainingLine.length >= 5)
  assert.ok(body.clientLine.some((t) => t.clientName === "HVAC TestCo"))
  assert.ok(body.deliveryPacks.warehouseReady >= 1)
  assert.ok(body.nextOperatorAction.length > 3)

  const after = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(after, before, "GET /api/production-line must not mutate the store")
})

test("GET /production-line does not mutate the store", async () => {
  const files = ["orders.json", "daily-digitals.json", "events.json", "work-runs.json", "delivery-packs.json", "case-records.json"]
  const before = files.map((name) => [name, rawDataFile(name)])
  const res = await fetch(`${BASE}/production-line`)
  assert.equal(res.status, 200)
  const after = files.map((name) => [name, rawDataFile(name)])
  assert.deepEqual(after, before, "GET /production-line must not mutate the store")
})

test("client acquisition HTTP: verified prospect is registered and exposed read-only", async () => {
  const res = await fetch(`${BASE}/api/acquisition`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: ACQ_AUTH },
    body: new URLSearchParams({
      action: "register",
      company: "Dutch Recruit Test",
      website: "dutch-recruit-test.nl",
      country: "Netherlands",
      segment: "Recruitment agency",
      contactName: "Alex",
      contactRole: "Director",
      email: "hello@dutch-recruit-test.nl",
      emailSourceUrl: "https://dutch-recruit-test.nl/contact",
      painSignals: "Several active vacancies; manual candidate follow-up",
      evidenceUrl: "https://dutch-recruit-test.nl/vacatures",
      evidenceSummary: "Public vacancy page shows multiple active recruitment workflows.",
    }),
  })
  assert.equal(res.status, 200)
  assert.match(await res.text(), /Dutch Recruit Test/)

  const before = rawDataFile("acquisition-prospects.json")
  const api = await fetch(`${BASE}/api/acquisition`, { headers: { authorization: ACQ_AUTH } })
  assert.equal(api.status, 200)
  const body = (await api.json()) as {
    autoSendEnabled: boolean
    dailyLimit: number
    prospects: { company: string; status: string; fitScore: number }[]
  }
  assert.equal(body.autoSendEnabled, false)
  assert.equal(body.dailyLimit, 3)
  const prospect = body.prospects.find((item) => item.company === "Dutch Recruit Test")!
  assert.equal(prospect.status, "outreach_ready")
  assert.equal(prospect.fitScore, 1)
  assert.equal(rawDataFile("acquisition-prospects.json"), before, "GET /api/acquisition must be read-only")
})

test("client acquisition HTTP: external send fails closed when webhook policy is disabled", async () => {
  const prospects = dataFile("acquisition-prospects.json") as { id: string; company: string; status: string }[]
  const prospect = prospects.find((item) => item.company === "Dutch Recruit Test")!
  const before = rawDataFile("acquisition-prospects.json")
  const res = await fetch(`${BASE}/api/acquisition`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: ACQ_AUTH },
    body: new URLSearchParams({ action: "send", id: prospect.id }),
  })
  assert.equal(res.status, 400)
  assert.match(await res.text(), /ACQUISITION_AUTO_SEND is not enabled/)
  assert.equal(rawDataFile("acquisition-prospects.json"), before, "failed send must not mutate the prospect")
})

test("client acquisition HTTP: unauthenticated public reads and writes are rejected", async () => {
  const before = rawDataFile("acquisition-prospects.json")
  const read = await fetch(`${BASE}/api/acquisition`)
  assert.equal(read.status, 401)
  assert.match(read.headers.get("www-authenticate") ?? "", /Basic/)
  const write = await fetch(`${BASE}/api/acquisition`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "register", company: "Injected" }),
  })
  assert.equal(write.status, 401)
  assert.equal(rawDataFile("acquisition-prospects.json"), before, "unauthorized requests must not mutate acquisition state")
})

test("integrity guard: /admin renders the Pinocchio panel with all 5 producers healthy", async () => {
  const admin = await (await fetch(`${BASE}/admin`)).text()
  assert.match(admin, /Integrity Guard — Monitor Pinokia/)
  assert.match(admin, /Reset \(God Layer\)|—/)
  for (const agent of ["MA", "SA", "DA", "RA", "QAA"]) {
    assert.match(admin, new RegExp(`<td class="mono">${agent}</td>`), `producer ${agent} must be listed`)
  }
  // HRAR explanation is visible so the operator understands the rule
  assert.match(admin, /kwarantannuje agenta z produkcji klienckiej/)
  assert.match(admin, /trening pozostaje dozwolony/i)

  // /api/admin/state exposes the same records, read-only
  const state = (await (await fetch(`${BASE}/api/admin/state`)).json()) as {
    integrity: { agentId: string; noseLength: number; status: string }[]
  }
  assert.equal(state.integrity.length, 5)
  // reworks earlier in this suite grew SA's nose (+12 each) — records are real
  const sa = state.integrity.find((r) => r.agentId === "SA")!
  assert.ok(sa.noseLength > 0, "SA nose must reflect earlier rework signals")
})

test("integrity guard: invalid agent id → 400 JSON, no store writes", async () => {
  const before = rawDataFile("integrity.json")
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", agentId: "ZZ" }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string; allowed: string[] }
  assert.equal(body.error, "invalid agent")
  assert.deepEqual(body.allowed, ["MA", "SA", "DA", "RA", "QAA"])
  assert.equal(rawDataFile("integrity.json"), before, "invalid reset must not write")
})

test("integrity guard reset audit: missing agentId → 400, zero writes", async () => {
  const before = rawDataFile("integrity.json")
  const eventsBefore = (dataFile("events.json") as unknown[]).length
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", reason: "operator_override" }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string }
  assert.equal(body.error, "missing agentId")
  assert.equal(rawDataFile("integrity.json"), before, "no integrity write on missing agentId")
  assert.equal((dataFile("events.json") as unknown[]).length, eventsBefore, "no event on missing agentId")
})

test("integrity guard reset audit: unknown agent → 400, zero writes", async () => {
  const before = rawDataFile("integrity.json")
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", agentId: "ZZ", reason: "operator_override" }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string; allowed: string[] }
  assert.equal(body.error, "invalid agent")
  assert.deepEqual(body.allowed, ["MA", "SA", "DA", "RA", "QAA"])
  assert.equal(rawDataFile("integrity.json"), before, "no integrity write on unknown agent")
})

test("integrity guard reset audit: missing reason → 400, zero writes", async () => {
  const before = rawDataFile("integrity.json")
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", agentId: "SA" }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string; allowed: string[] }
  assert.equal(body.error, "missing reason")
  assert.deepEqual(body.allowed, ["false_positive", "retrained", "accepted_risk", "operator_override", "other"])
  assert.equal(rawDataFile("integrity.json"), before, "no integrity write on missing reason")
})

test("integrity guard reset audit: invalid reason → 400, zero writes", async () => {
  const before = rawDataFile("integrity.json")
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", agentId: "SA", reason: "because_i_said_so" }),
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error: string }
  assert.equal(body.error, "invalid reason")
  assert.equal(rawDataFile("integrity.json"), before, "no integrity write on invalid reason")
})

test("integrity guard: valid reset (with reason) clears nose, preserves breaches, logs full audit trail", async () => {
  // SA accumulated rework signals earlier in the suite (breaches may be 0 or more)
  const before = (dataFile("integrity.json") as { agentId: string; breaches: number }[]).find((r) => r.agentId === "SA")!
  const res = await fetch(`${BASE}/api/integrity`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ action: "reset", agentId: "SA", reason: "retrained", note: "swapped weak template" }),
  })
  assert.equal(res.status, 200)
  const records = JSON.parse(rawDataFile("integrity.json")) as { agentId: string; noseLength: number; status: string; breaches: number }[]
  const sa = records.find((r) => r.agentId === "SA")!
  assert.equal(sa.noseLength, 0)
  assert.equal(sa.status, "healthy")
  assert.equal(sa.breaches, before.breaches, "breach history must be preserved across a reset")

  const events = dataFile("events.json") as { eventType: string; agentId: string; detail: string }[]
  const resetEvent = events.find((e) => e.eventType === "integrity.reset" && e.agentId === "SA")
  assert.ok(resetEvent, "integrity.reset event must be logged")
  assert.ok(resetEvent!.detail.includes("Reason: retrained"))
  assert.ok(resetEvent!.detail.includes("Note: swapped weak template"))
  assert.ok(resetEvent!.detail.includes("Breach history preserved"))
  assert.ok(resetEvent!.detail.includes("God Layer"))
})

test("GET endpoints never mutate integrity.json", async () => {
  const before = rawDataFile("integrity.json")
  await fetch(`${BASE}/admin`)
  await fetch(`${BASE}/api/admin/state`)
  await fetch(`${BASE}/production-line`)
  assert.equal(rawDataFile("integrity.json"), before, "GET requests must never write integrity.json")
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
  assert.match(pageBefore, /autopilot WYŁ\./)

  // Full process restart on the same data dir
  await stopServer()
  await startServer()

  const pageAfter = await (await fetch(`${BASE}/`)).text()
  assert.match(pageAfter, /autopilot WYŁ\./, "pause must survive a restart")
  const adminAfter = await (await fetch(`${BASE}/admin`)).text()
  assert.match(adminAfter, /autopilot WYŁ\./, "admin cockpit must show the persisted OFF state")
  assert.match(adminAfter, /Fabryka jest wstrzymana, bo autopilot jest WYŁĄCZONY/, "standing-still reason must explain the pause")
  // Boss header must survive the restart from persisted work runs, not an
  // in-memory summary string: the last run before restart was the rework cycle
  // triggered by the production-line rework test above.
  assert.match(adminAfter, /ostatni cykl: TRYB POPRAWEK · zakończone · via daily_run/)
  assert.doesNotMatch(adminAfter, /jeszcze nic nie zarejestrowano/)
  assert.equal((dataFile("settings.json") as { autopilotEnabled: boolean }).autopilotEnabled, false)

  // Paused + drafts pending: next action must point at the review queue, NOT
  // at resuming autopilot (resuming clears nothing at the review gate).
  assert.match(adminAfter, /Przejrzyj zasoby treningowe/)
  const state = (await (await fetch(`${BASE}/api/admin/state`)).json()) as {
    autopilotEnabled: boolean
    nextOperatorAction: { title: string }
    waiting: { trainingDrafts: number; ordersReadyForReview: number }
  }
  assert.equal(state.autopilotEnabled, false)
  assert.equal(state.waiting.ordersReadyForReview, 0)
  assert.ok(state.waiting.trainingDrafts >= 1)
  assert.equal(state.nextOperatorAction.title, "Przejrzyj zasoby treningowe",
    "paused autopilot must not outrank pending review queues")
})
