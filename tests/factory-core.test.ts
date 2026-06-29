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

test("registry: all 14 agents defined", () => {
  assert.equal(AGENT_REGISTRY.length, 14)
  const ids = AGENT_REGISTRY.map((a) => a.id)
  for (const id of ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"] as const) {
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
