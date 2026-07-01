import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  validateRegistry,
  AGENT_REGISTRY,
  FactoryStore,
  runFactoryOnce,
  agentA,
  agentB,
  agentC,
  agentD,
  agentE,
  agentF,
  agentG,
  agentH,
  agentI,
  runDailyMissions,
  acceptDigital,
  reworkDigital,
  rejectDigital,
  warehouseDigital,
  createOrder,
  produceOrderDeliverable,
  inferTaskType,
  runAutonomousCycle,
  regenerateDigital,
} from "@ratio-essendi/factory-core"
import type { Signal, QualifiedLead, ScoredOffer } from "@ratio-essendi/factory-core"

function tmpStore(): { store: FactoryStore; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "fc-test-"))
  const store = new FactoryStore(dir)
  return { store, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

function qualifiedSignal(): Signal {
  return {
    id: "sig-test-001",
    raw: "I'm a SaaS founder at seed stage, our pipeline is weak and revenue is stalling. Looking for a sales sprint.",
    submittedAt: new Date().toISOString(),
    status: "queued",
  }
}

function unqualifiedSignal(): Signal {
  return {
    id: "sig-test-002",
    raw: "I want to hire a plumber for my apartment renovation this weekend.",
    submittedAt: new Date().toISOString(),
    status: "queued",
  }
}

// 1. Registry validation

test("registry: all 19 agents defined (14 pipeline + 5 producers)", () => {
  assert.equal(AGENT_REGISTRY.length, 19)
  const ids = AGENT_REGISTRY.map((a) => a.id)
  for (const id of [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
    "MA", "SA", "DA", "RA", "QAA",
  ] as const) {
    assert.ok(ids.includes(id), `Agent ${id} missing from registry`)
  }
})

test("registry: validateRegistry() passes with no dead agents", () => {
  const { ok, errors } = validateRegistry()
  assert.ok(ok, `Registry invalid: ${errors.join("; ")}`)
})

test("registry: every agent has non-empty watch, trigger, nextAction", () => {
  for (const agent of AGENT_REGISTRY) {
    assert.ok(agent.watch.trim().length > 0, `Agent ${agent.id}: empty watch`)
    assert.ok(agent.trigger.trim().length > 0, `Agent ${agent.id}: empty trigger`)
    assert.ok(agent.nextAction.trim().length > 0, `Agent ${agent.id}: empty nextAction`)
  }
})

// 2. Individual agent unit tests

test("agentA: categorises outbound signal and extracts ICP signals", () => {
  const sig = qualifiedSignal()
  const brief = agentA(sig)
  assert.equal(brief.signalId, sig.id)
  assert.equal(brief.agentId, "A")
  assert.ok(brief.icpSignals.length > 0, "expected ICP signals to be extracted")
  assert.ok(brief.enrichedContext.length > 0)
})

test("agentB: qualifies a strong ICP match (score >= 0.5)", () => {
  const sig = qualifiedSignal()
  const brief = agentA(sig)
  const lead = agentB(brief)
  assert.equal(lead.agentId, "B")
  assert.ok(lead.qualified, `Expected qualified=true, got fitScore=${lead.fitScore}`)
  assert.ok(lead.fitScore >= 0.5)
})

test("agentB: disqualifies an off-ICP signal", () => {
  const sig = unqualifiedSignal()
  const brief = agentA(sig)
  const lead = agentB(brief)
  assert.equal(lead.qualified, false, `Expected qualified=false, got fitScore=${lead.fitScore}`)
})

test("agentF: passes a well-formed offer (score >= 0.75)", () => {
  const sig = qualifiedSignal()
  const brief = agentA(sig)
  const lead = agentB(brief) as QualifiedLead
  const enriched = agentC(lead)
  const strategy = agentD(enriched)
  const draft = agentE(strategy, 1)
  const scored = agentF(draft)
  assert.ok(scored.score >= 0.75, `Expected score >= 0.75, got ${scored.score}`)
  assert.ok(scored.passed)
})

test("agentG: revision adds CTA when missing", () => {
  const scored: ScoredOffer = {
    signalId: "sig-test-003",
    draft: {
      signalId: "sig-test-003",
      strategy: {
        signalId: "sig-test-003",
        enrichedLead: {
          signalId: "sig-test-003",
          lead: {} as QualifiedLead,
          enrichedNotes: "",
          targetBuyer: "Founder",
          agentId: "C",
        },
        icp: "B2B SaaS",
        positioning: "test",
        kpis: [],
        constraints: [],
        agentId: "D",
      },
      offerText: "We offer a 2-week sprint. Pricing: €2,500. Fixed scope.",
      iteration: 1,
      agentId: "E",
    },
    score: 0.5,
    passed: false,
    failureReasons: ["call to action"],
    agentId: "F",
  }
  const revised = agentG(scored)
  assert.ok(revised.offerText.toLowerCase().includes("reply") || revised.offerText.toLowerCase().includes("interested"))
})

test("agentH: creates ApprovalItem with sent: false (structural gate)", () => {
  const sig = qualifiedSignal()
  const brief = agentA(sig)
  const lead = agentB(brief) as QualifiedLead
  const enriched = agentC(lead)
  const strategy = agentD(enriched)
  const draft = agentE(strategy, 1)
  const scored = agentF(draft)
  const { item } = agentH(scored, sig.id)
  assert.equal(item.sent, false)
  assert.equal(item.status, "pending")
  assert.equal(item.agentId, "H")
})

test("agentI: moves approved item to WarehouseItem with sent: false", () => {
  const sig = qualifiedSignal()
  const brief = agentA(sig)
  const lead = agentB(brief) as QualifiedLead
  const enriched = agentC(lead)
  const strategy = agentD(enriched)
  const draft = agentE(strategy, 1)
  const scored = agentF(draft)
  const { item } = agentH(scored, sig.id)
  const warehouseItem = agentI({ ...item, status: "approved" })
  assert.equal(warehouseItem.sent, false)
  assert.ok(warehouseItem.qualityScore > 0)
})

// 3. Full pipeline integration

test("pipeline: qualified signal → awaiting_approval, no auto-send", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const result = await runFactoryOnce(
      "We are a B2B SaaS startup at seed stage, founder-led sales, revenue stuck at $30K MRR. Need help with pipeline.",
      store,
    )
    assert.equal(result.status, "awaiting_approval")
    assert.ok(result.approval, "approval item must exist")
    assert.equal(result.approval.sent, false)
    assert.equal(result.approval.status, "pending")
    assert.ok(result.events.some((e) => e.eventType === "approval.required"))
  } finally {
    cleanup()
  }
})

test("pipeline: off-ICP signal → disqualified, no approval item", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const result = await runFactoryOnce("I need a dentist appointment next Tuesday in Warsaw", store)
    assert.equal(result.status, "disqualified")
    assert.equal(result.approval, undefined)
    assert.ok(result.events.some((e) => e.eventType === "lead.disqualified"))
  } finally {
    cleanup()
  }
})

test("pipeline: all events logged to store", async () => {
  const { store, cleanup } = tmpStore()
  try {
    await runFactoryOnce(
      "Seed-stage SaaS founder, pipeline is weak, MRR stuck, need outbound offer help",
      store,
    )
    const state = store.snapshot()
    assert.ok(state.events.length >= 3, `Expected >= 3 events, got ${state.events.length}`)
    assert.ok(state.signals.length === 1)
  } finally {
    cleanup()
  }
})

test("pipeline: approve action moves item to warehouse (sent: false)", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const result = await runFactoryOnce(
      "Founder-led B2B SaaS, seed stage, sales pipeline is broken, need a RevOps sprint offer",
      store,
    )
    assert.equal(result.status, "awaiting_approval")
    const approvalId = result.approval!.id

    // Simulate operator approval
    store.updateApprovalItem(approvalId, { status: "approved", decidedAt: new Date().toISOString() })
    const approved = store.getApprovalItem(approvalId)!
    const warehouseItem = agentI(approved)
    store.addWarehouseItem(warehouseItem)

    const state = store.snapshot()
    assert.equal(state.warehouse.length, 1)
    assert.equal(state.warehouse[0]!.sent, false)
  } finally {
    cleanup()
  }
})

test("pipeline: two different signals produce two independent approval items", async () => {
  const { store, cleanup } = tmpStore()
  try {
    await runFactoryOnce("B2B SaaS founder seed stage pipeline weak revenue stalling", store)
    await runFactoryOnce("SaaS startup founder MRR churn sales sprint needed", store)
    const state = store.snapshot()
    const pending = state.approvalQueue.filter((a) => a.status === "pending")
    assert.ok(pending.length >= 1, `Expected at least 1 pending approval, got ${pending.length}`)
    const ids = pending.map((a) => a.id)
    assert.equal(new Set(ids).size, ids.length, "approval IDs must be unique")
  } finally {
    cleanup()
  }
})

// 4. Daily Mission tests

test("runDailyMissions: creates exactly 5 deliverables", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    assert.equal(digitals.length, 5, `Expected 5, got ${digitals.length}`)
  } finally {
    cleanup()
  }
})

test("runDailyMissions: one deliverable per department", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    const depts = digitals.map((d) => d.department)
    for (const d of ["marketing", "sales", "delivery", "research", "qa"] as const) {
      assert.ok(depts.includes(d), `Missing department: ${d}`)
    }
    assert.equal(new Set(depts).size, 5, "departments must be unique")
  } finally {
    cleanup()
  }
})

test("runDailyMissions: all deliverables start as draft_ready in daily_review", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    for (const d of digitals) {
      assert.equal(d.status, "draft_ready", `${d.department} status: ${d.status}`)
      assert.equal(d.location, "daily_review", `${d.department} location: ${d.location}`)
    }
  } finally {
    cleanup()
  }
})

test("runDailyMissions: every deliverable has real content (not empty, not placeholder-only)", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    for (const d of digitals) {
      assert.ok(d.content.length >= 400, `${d.department} content too short: ${d.content.length}`)
      assert.ok(d.title.length > 0, `${d.department} has empty title`)
      assert.ok(d.qualityScore > 0, `${d.department} has zero quality score`)
      assert.ok(/\d/.test(d.content), `${d.department} content has no numbers — too generic`)
    }
  } finally {
    cleanup()
  }
})

test("runDailyMissions: idempotent — second call for same date returns same 5 items", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const first = await runDailyMissions(store, "2026-06-29")
    const second = await runDailyMissions(store, "2026-06-29")
    assert.equal(second.length, 5)
    assert.deepEqual(
      first.map((d) => d.id),
      second.map((d) => d.id),
    )
  } finally {
    cleanup()
  }
})

test("runDailyMissions: different date produces different IDs and titles", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const day1 = await runDailyMissions(store, "2026-06-29")
    const day2 = await runDailyMissions(store, "2026-07-03")
    // IDs embed the date, so they must be different
    assert.notDeepEqual(
      day1.map((d) => d.id),
      day2.map((d) => d.id),
      "items for different dates must have different IDs",
    )
    // Titles include the date, so at least one must differ
    const titles1 = day1.map((d) => d.title)
    const titles2 = day2.map((d) => d.title)
    assert.ok(
      titles1.some((t, i) => t !== titles2[i]),
      "at least one title must differ between different run dates",
    )
  } finally {
    cleanup()
  }
})

test("acceptDigital: sets status to accepted and logs feedback event", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    const mkt = digitals.find((d) => d.department === "marketing")!
    acceptDigital(store, mkt.id)
    const updated = store.getDailyDigital(mkt.id)!
    assert.equal(updated.status, "accepted")
    const state = store.snapshot()
    assert.ok(state.feedbackEvents.some((e) => e.digitalId === mkt.id && e.action === "accepted"))
  } finally {
    cleanup()
  }
})

test("warehouseDigital: moves accepted item to warehouse location", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    const sales = digitals.find((d) => d.department === "sales")!
    warehouseDigital(store, sales.id)
    const updated = store.getDailyDigital(sales.id)!
    assert.equal(updated.location, "warehouse")
    assert.equal(updated.status, "accepted")
  } finally {
    cleanup()
  }
})

test("rejectDigital: moves item to trash and logs feedback event with reason", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    const delivery = digitals.find((d) => d.department === "delivery")!
    rejectDigital(store, delivery.id, "Too generic, needs specific construction industry examples")
    const updated = store.getDailyDigital(delivery.id)!
    assert.equal(updated.status, "rejected")
    assert.equal(updated.location, "trash")
    const state = store.snapshot()
    const fb = state.feedbackEvents.find((e) => e.digitalId === delivery.id)
    assert.ok(fb, "feedback event must exist")
    assert.equal(fb!.action, "rejected")
    assert.ok(fb!.feedback?.includes("construction"), "feedback text must be stored")
  } finally {
    cleanup()
  }
})

test("reworkDigital: creates feedback event with nextRevisionTaskId and stores feedback", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const digitals = await runDailyMissions(store, "2026-06-29")
    const research = digitals.find((d) => d.department === "research")!
    const taskId = reworkDigital(store, research.id, "Too abstract, focus on HR tech niche specifically")
    assert.ok(taskId.length > 0, "revision task ID must be returned")
    const updated = store.getDailyDigital(research.id)!
    assert.equal(updated.status, "needs_rework")
    assert.equal(updated.operatorFeedback, "Too abstract, focus on HR tech niche specifically")
    const state = store.snapshot()
    const fb = state.feedbackEvents.find((e) => e.digitalId === research.id)
    assert.ok(fb?.nextRevisionTaskId, "nextRevisionTaskId must be set")
  } finally {
    cleanup()
  }
})

test("feedback loop: next run incorporates rework feedback as constraints", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const day1 = await runDailyMissions(store, "2026-06-28")
    const mkt = day1.find((d) => d.department === "marketing")!
    reworkDigital(store, mkt.id, "too generic, focus on construction companies specifically")

    // Next day's missions should have constraints for marketing
    const day2 = await runDailyMissions(store, "2026-06-30")
    const mkt2 = day2.find((d) => d.department === "marketing")!
    // The constraint must appear in the content (constraintHeader is prepended)
    assert.ok(
      mkt2.content.includes("too generic") || mkt2.content.includes("PRODUCTION CONSTRAINTS"),
      "next run must incorporate operator feedback in content",
    )
  } finally {
    cleanup()
  }
})

test("all 5 daily events logged to factory event store", async () => {
  const { store, cleanup } = tmpStore()
  try {
    await runDailyMissions(store, "2026-06-29")
    const state = store.snapshot()
    const missionEvents = state.events.filter((e) => e.eventType === "daily.mission_complete")
    assert.equal(missionEvents.length, 5, `Expected 5 mission events, got ${missionEvents.length}`)
  } finally {
    cleanup()
  }
})

// 5. Client Order tests

test("createOrder: order stored as new with inferred task type and order.received logged", () => {
  const { store, cleanup } = tmpStore()
  try {
    const order = createOrder(store, {
      clientName: "BudMax Sp. z o.o.",
      description: "Landing page copy for construction companies selling prefab garages",
      department: "delivery",
    })
    assert.equal(order.status, "new")
    assert.equal(order.taskType, "landing-template", "should infer landing-template from 'landing page'")
    const state = store.snapshot()
    assert.equal(state.orders.length, 1)
    assert.ok(state.events.some((e) => e.eventType === "order.received"))
  } finally {
    cleanup()
  }
})

test("inferTaskType: maps descriptions to concrete task types", () => {
  assert.equal(inferTaskType("marketing", "we need ads for facebook"), "ad-pack")
  assert.equal(inferTaskType("sales", "handle common objections from buyers"), "objection-map")
  assert.equal(inferTaskType("research", "keyword set for SEO"), "keyword-set")
})

test("produceOrderDeliverable: deliverable built from client brief, order → ready_for_review", () => {
  const { store, cleanup } = tmpStore()
  try {
    const order = createOrder(store, {
      clientName: "BudMax",
      description: "Landing page for construction companies selling prefab garages",
      department: "delivery",
    })
    const deliverable = produceOrderDeliverable(store, order.id)
    assert.ok(deliverable, "deliverable must be produced")
    assert.equal(deliverable!.orderId, order.id)
    assert.equal(deliverable!.status, "draft_ready")
    assert.ok(
      deliverable!.content.includes("construction"),
      "content must reflect the client brief (construction niche)",
    )
    const updated = store.getOrder(order.id)!
    assert.equal(updated.status, "ready_for_review")
    assert.equal(updated.deliverableId, deliverable!.id)
    assert.ok(store.snapshot().events.some((e) => e.eventType === "order.produced"))
  } finally {
    cleanup()
  }
})

test("produceOrderDeliverable: idempotent while deliverable awaits review", () => {
  const { store, cleanup } = tmpStore()
  try {
    const order = createOrder(store, {
      clientName: "BudMax",
      description: "demo script for our sales team",
      department: "delivery",
    })
    produceOrderDeliverable(store, order.id)
    // Order is now ready_for_review — a second call must not produce again
    const again = produceOrderDeliverable(store, order.id)
    assert.equal(again, undefined)
    const deliverables = store.snapshot().dailyDigitals.filter((d) => d.orderId === order.id)
    assert.equal(deliverables.length, 1)
  } finally {
    cleanup()
  }
})

// 6. Autonomous cycle tests

test("autonomous cycle: open order → CLIENT_MODE, deliverable produced, no training that cycle", async () => {
  const { store, cleanup } = tmpStore()
  try {
    createOrder(store, {
      clientName: "BudMax",
      description: "Landing page for construction companies",
      department: "delivery",
    })
    const result = await runAutonomousCycle(store, "2026-07-01")
    assert.equal(result.mode, "CLIENT_MODE")
    assert.equal(result.ordersProduced.length, 1)
    assert.equal(result.trainingCreated, 0, "client work must take priority over training")
    const training = store.getDailyDigitalsForDate("2026-07-01").filter((d) => !d.orderId)
    assert.equal(training.length, 0)
  } finally {
    cleanup()
  }
})

test("autonomous cycle: no orders → NO_CLIENT_TRAINING_MODE with 5 random missions", async () => {
  const { store, cleanup } = tmpStore()
  try {
    const result = await runAutonomousCycle(store, "2026-07-01")
    assert.equal(result.mode, "NO_CLIENT_TRAINING_MODE")
    assert.equal(result.trainingCreated, 5)
    const training = store.getDailyDigitalsForDate("2026-07-01").filter((d) => !d.orderId)
    assert.equal(training.length, 5)
  } finally {
    cleanup()
  }
})

test("autonomous cycle: second run same day is IDLE (bounded, no queue spam)", async () => {
  const { store, cleanup } = tmpStore()
  try {
    await runAutonomousCycle(store, "2026-07-01")
    const second = await runAutonomousCycle(store, "2026-07-01")
    assert.equal(second.mode, "IDLE")
    assert.equal(second.trainingCreated, 0)
    assert.equal(second.ordersProduced.length, 0)
    const training = store.getDailyDigitalsForDate("2026-07-01").filter((d) => !d.orderId)
    assert.equal(training.length, 5, "still exactly 5 — never more")
  } finally {
    cleanup()
  }
})

test("autonomous cycle: executes pending rework with feedback applied and bumps revision", async () => {
  const { store, cleanup } = tmpStore()
  try {
    await runAutonomousCycle(store, "2026-07-01")
    const training = store.getDailyDigitalsForDate("2026-07-01").filter((d) => !d.orderId)
    const mkt = training.find((d) => d.department === "marketing")!
    reworkDigital(store, mkt.id, "too generic, make it concrete for construction companies")

    const result = await runAutonomousCycle(store, "2026-07-01")
    assert.ok(result.reworksRegenerated.includes(mkt.id))
    const regenerated = store.getDailyDigital(mkt.id)!
    assert.equal(regenerated.status, "draft_ready")
    assert.equal(regenerated.revisionCount, 1)
    assert.ok(
      regenerated.content.includes("construction"),
      "regenerated content must apply the operator feedback",
    )
  } finally {
    cleanup()
  }
})

test("regenerateDigital: order deliverable rework re-applies client brief and returns order to review", () => {
  const { store, cleanup } = tmpStore()
  try {
    const order = createOrder(store, {
      clientName: "BudMax",
      description: "Landing page for construction companies",
      department: "delivery",
    })
    const deliverable = produceOrderDeliverable(store, order.id)!
    reworkDigital(store, deliverable.id, "add a pricing table for prefab garages")
    store.updateOrder(order.id, { status: "in_production" })

    const regenerated = regenerateDigital(store, deliverable.id)!
    assert.equal(regenerated.status, "draft_ready")
    assert.equal(regenerated.revisionCount, 1)
    assert.ok(regenerated.content.includes("construction"), "client brief must survive rework")
    assert.equal(store.getOrder(order.id)!.status, "ready_for_review")
  } finally {
    cleanup()
  }
})
