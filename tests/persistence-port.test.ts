import assert from "node:assert/strict"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import {
  FactoryStore,
  JsonPersistenceAdapter,
  SupabasePostgresPersistenceAdapter,
  type LeadThread,
  type PersistenceFetch,
} from "@ratio-essendi/factory-core"

function threadFixture(): LeadThread {
  return {
    id: "lt-test-1",
    leadName: "Test Lead",
    company: "TestCo",
    source: "manual",
    status: "warm",
    qualification: { problem: "slow follow-up" },
    messages: [
      {
        id: "lm-test-1",
        author: "lead",
        kind: "message",
        text: "We lose leads because follow-up is slow.",
        at: "2026-07-11T10:00:00.000Z",
      },
    ],
    draftRevision: 0,
    createdAt: "2026-07-11T10:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
  }
}

test("JsonPersistenceAdapter survives restart and preserves legacy filenames", async () => {
  const dataDir = mkdtempSync(join(tmpdir(), "ratio-persistence-"))
  const firstAdapter = new JsonPersistenceAdapter(dataDir)
  await firstAdapter.initialize()
  const firstStore = new FactoryStore(dataDir, firstAdapter)

  firstStore.addLeadThread(threadFixture())
  firstStore.addEvent({
    id: "evt-test-1",
    timestamp: "2026-07-11T10:01:00.000Z",
    agentId: "LEA",
    eventType: "lead.thread_created",
    detail: "test event",
  })
  firstStore.addOperatorAction({
    id: "op-test-1",
    timestamp: "2026-07-11T10:01:00.000Z",
    actor: "operator",
    action: "lead.thread.create",
    targetType: "lead_thread",
    targetId: "lt-test-1",
    detail: "test action",
  })
  await firstStore.flushPersistence()

  const secondAdapter = new JsonPersistenceAdapter(dataDir)
  await secondAdapter.initialize()
  const secondStore = new FactoryStore(dataDir, secondAdapter)

  assert.equal(secondStore.snapshot().leadThreads.length, 1)
  assert.equal(secondStore.snapshot().leadThreads[0]?.messages.length, 1)
  assert.equal(secondStore.snapshot().events.length, 1)
  assert.equal(secondStore.getOperatorActions().length, 1)

  const legacyThreadFile = JSON.parse(
    readFileSync(join(dataDir, "lead-threads.json"), "utf-8"),
  ) as LeadThread[]
  assert.equal(legacyThreadFile[0]?.messages[0]?.id, "lm-test-1")
})

test("SupabasePostgresPersistenceAdapter hydrates normalized rows and flushes idempotent upserts", async () => {
  const calls: Array<{ input: string; method: string; body?: string }> = []

  const response = (data: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    async text(): Promise<string> {
      return data === undefined ? "" : JSON.stringify(data)
    },
  })

  const fetchImpl: PersistenceFetch = async (input, init) => {
    const method = init?.method ?? "GET"
    calls.push({ input, method, ...(init?.body ? { body: init.body } : {}) })

    if (method !== "GET") return response(undefined, 201)
    if (input.includes("ratio_lead_threads")) {
      return response([
        {
          id: "lt-db-1",
          lead_name: "Database Lead",
          company: "PersistCo",
          source: "linkedin",
          status: "warm",
          qualification: { problem: "manual qualification" },
          draft_revision: 0,
          created_at: "2026-07-11T09:00:00.000Z",
          updated_at: "2026-07-11T09:00:00.000Z",
        },
      ])
    }
    if (input.includes("ratio_lead_messages")) {
      return response([
        {
          id: "lm-db-1",
          thread_id: "lt-db-1",
          author: "lead",
          kind: "message",
          text: "We need a better follow-up system.",
          at: "2026-07-11T09:00:00.000Z",
          draft_mode: null,
          objective: null,
        },
      ])
    }
    if (input.includes("ratio_factory_events")) return response([])
    if (input.includes("ratio_operator_actions")) return response([])
    return response({ message: "unknown table" }, 404)
  }

  const adapter = new SupabasePostgresPersistenceAdapter({
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "service-role-test-key",
    fetchImpl,
  })
  await adapter.initialize()

  assert.equal(adapter.snapshot().leadThreads[0]?.messages[0]?.id, "lm-db-1")
  assert.equal(adapter.snapshot().leadMessages[0]?.threadId, "lt-db-1")

  adapter.updateLeadThread("lt-db-1", {
    status: "hot",
    updatedAt: "2026-07-11T09:05:00.000Z",
  })
  adapter.addFactoryEvent({
    id: "evt-db-1",
    timestamp: "2026-07-11T09:05:00.000Z",
    agentId: "LEA",
    eventType: "lead.status_changed",
    detail: "warm to hot",
  })
  adapter.addOperatorAction({
    id: "op-db-1",
    timestamp: "2026-07-11T09:05:00.000Z",
    actor: "operator",
    action: "lead.status.set",
    targetType: "lead_thread",
    targetId: "lt-db-1",
    detail: "operator changed lead status",
  })
  await adapter.flush()

  const posts = calls.filter((call) => call.method === "POST")
  assert.ok(posts.some((call) => call.input.includes("ratio_lead_threads?on_conflict=id")))
  assert.ok(posts.some((call) => call.input.includes("ratio_lead_messages?on_conflict=id")))
  assert.ok(posts.some((call) => call.input.includes("ratio_factory_events?on_conflict=id")))
  assert.ok(posts.some((call) => call.input.includes("ratio_operator_actions?on_conflict=id")))
  assert.ok(posts.every((call) => call.body?.startsWith("[")))
})
