import type {
  FactoryEvent,
  LeadThread,
  LeadThreadMessage,
  LeadThreadQualification,
  LeadThreadStatus,
} from "../types.js"
import type {
  OperatorAction,
  OperatorActionMetadataValue,
  OperatorActionTarget,
  PersistencePort,
  PersistenceSnapshot,
} from "./persistence-port.js"

type FetchResponse = {
  ok: boolean
  status: number
  text(): Promise<string>
}

export type PersistenceFetch = (
  input: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    body?: string
  },
) => Promise<FetchResponse>

type LeadThreadRow = {
  id: string
  lead_name: string
  company: string | null
  source: string | null
  status: LeadThreadStatus
  qualification: LeadThreadQualification | null
  draft_revision: number
  created_at: string
  updated_at: string
}

type LeadMessageRow = {
  id: string
  thread_id: string
  author: LeadThreadMessage["author"]
  kind: LeadThreadMessage["kind"]
  text: string
  at: string
  draft_mode: LeadThreadMessage["draftMode"] | null
  objective: string | null
}

type FactoryEventRow = {
  id: string
  timestamp: string
  agent_id: FactoryEvent["agentId"]
  event_type: string
  signal_id: string | null
  detail: string
}

type OperatorActionRow = {
  id: string
  timestamp: string
  actor: "operator"
  action: string
  target_type: OperatorActionTarget
  target_id: string | null
  detail: string
  metadata: Record<string, OperatorActionMetadataValue> | null
}

type QueuedWrite = {
  label: string
  run: () => Promise<void>
}

const defaultFetch: PersistenceFetch = async (input, init) => fetch(input, init)

function threadToRow(thread: LeadThread): LeadThreadRow {
  return {
    id: thread.id,
    lead_name: thread.leadName,
    company: thread.company ?? null,
    source: thread.source ?? null,
    status: thread.status,
    qualification: thread.qualification,
    draft_revision: thread.draftRevision,
    created_at: thread.createdAt,
    updated_at: thread.updatedAt,
  }
}

function messageToRow(threadId: string, message: LeadThreadMessage): LeadMessageRow {
  return {
    id: message.id,
    thread_id: threadId,
    author: message.author,
    kind: message.kind,
    text: message.text,
    at: message.at,
    draft_mode: message.draftMode ?? null,
    objective: message.objective ?? null,
  }
}

function eventToRow(event: FactoryEvent): FactoryEventRow {
  return {
    id: event.id,
    timestamp: event.timestamp,
    agent_id: event.agentId,
    event_type: event.eventType,
    signal_id: event.signalId ?? null,
    detail: event.detail,
  }
}

function actionToRow(action: OperatorAction): OperatorActionRow {
  return {
    id: action.id,
    timestamp: action.timestamp,
    actor: action.actor,
    action: action.action,
    target_type: action.targetType,
    target_id: action.targetId ?? null,
    detail: action.detail,
    metadata: action.metadata ?? {},
  }
}

/**
 * Durable adapter using Supabase's PostgREST endpoint over PostgreSQL.
 * No browser client and no anon key are used: this module is server-only and
 * requires SUPABASE_SERVICE_ROLE_KEY. Rows use stable ids, so retries are
 * idempotent upserts rather than duplicate inserts.
 */
export class SupabasePostgresPersistenceAdapter implements PersistencePort {
  readonly driver = "postgres" as const

  readonly #baseUrl: string
  readonly #serviceRoleKey: string
  readonly #fetch: PersistenceFetch
  #initialized = false
  #leadThreads: LeadThread[] = []
  #factoryEvents: FactoryEvent[] = []
  #operatorActions: OperatorAction[] = []
  readonly #writes: QueuedWrite[] = []

  constructor(options: {
    supabaseUrl: string
    serviceRoleKey: string
    fetchImpl?: PersistenceFetch
  }) {
    this.#baseUrl = options.supabaseUrl.replace(/\/$/, "")
    this.#serviceRoleKey = options.serviceRoleKey
    this.#fetch = options.fetchImpl ?? defaultFetch
  }

  static fromEnvironment(env: NodeJS.ProcessEnv = process.env): SupabasePostgresPersistenceAdapter {
    const supabaseUrl = env["SUPABASE_URL"]?.trim()
    const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"]?.trim()
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "FACTORY_STORE_DRIVER=postgres requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      )
    }
    return new SupabasePostgresPersistenceAdapter({ supabaseUrl, serviceRoleKey })
  }

  async initialize(): Promise<void> {
    if (this.#initialized) return

    const [threadRows, messageRows, eventRows, actionRows] = await Promise.all([
      this.#request<LeadThreadRow[]>("/rest/v1/ratio_lead_threads?select=*&order=created_at.asc"),
      this.#request<LeadMessageRow[]>("/rest/v1/ratio_lead_messages?select=*&order=at.asc"),
      this.#request<FactoryEventRow[]>("/rest/v1/ratio_factory_events?select=*&order=timestamp.asc"),
      this.#request<OperatorActionRow[]>("/rest/v1/ratio_operator_actions?select=*&order=timestamp.asc"),
    ])

    const messagesByThread = new Map<string, LeadThreadMessage[]>()
    for (const row of messageRows) {
      const messages = messagesByThread.get(row.thread_id) ?? []
      messages.push({
        id: row.id,
        author: row.author,
        kind: row.kind,
        text: row.text,
        at: row.at,
        ...(row.draft_mode ? { draftMode: row.draft_mode } : {}),
        ...(row.objective ? { objective: row.objective } : {}),
      })
      messagesByThread.set(row.thread_id, messages)
    }

    this.#leadThreads = threadRows.map((row) => ({
      id: row.id,
      leadName: row.lead_name,
      ...(row.company ? { company: row.company } : {}),
      ...(row.source ? { source: row.source } : {}),
      status: row.status,
      qualification: row.qualification ?? {},
      messages: messagesByThread.get(row.id) ?? [],
      draftRevision: row.draft_revision,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    this.#factoryEvents = eventRows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      agentId: row.agent_id,
      eventType: row.event_type,
      ...(row.signal_id ? { signalId: row.signal_id } : {}),
      detail: row.detail,
    }))

    this.#operatorActions = actionRows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      actor: "operator",
      action: row.action,
      targetType: row.target_type,
      ...(row.target_id ? { targetId: row.target_id } : {}),
      detail: row.detail,
      ...(row.metadata && Object.keys(row.metadata).length > 0 ? { metadata: row.metadata } : {}),
    }))

    this.#initialized = true
  }

  snapshot(): PersistenceSnapshot {
    this.#assertInitialized()
    return {
      leadThreads: this.#leadThreads,
      leadMessages: this.#leadThreads.flatMap((thread) =>
        thread.messages.map((message) => ({ ...message, threadId: thread.id })),
      ),
      factoryEvents: this.#factoryEvents,
      operatorActions: this.#operatorActions,
    }
  }

  addFactoryEvent(event: FactoryEvent): void {
    this.#assertInitialized()
    this.#factoryEvents = [...this.#factoryEvents, event]
    this.#enqueue(`factory event ${event.id}`, async () => {
      await this.#upsert("ratio_factory_events", [eventToRow(event)])
    })
  }

  addLeadThread(thread: LeadThread): void {
    this.#assertInitialized()
    this.#leadThreads = [...this.#leadThreads, thread]
    this.#enqueueThread(thread)
  }

  updateLeadThread(id: string, patch: Partial<LeadThread>): void {
    this.#assertInitialized()
    const current = this.#leadThreads.find((thread) => thread.id === id)
    if (!current) return
    const updated = { ...current, ...patch }
    this.#leadThreads = this.#leadThreads.map((thread) => (thread.id === id ? updated : thread))
    this.#enqueueThread(updated)
  }

  addOperatorAction(action: OperatorAction): void {
    this.#assertInitialized()
    this.#operatorActions = [...this.#operatorActions, action]
    this.#enqueue(`operator action ${action.id}`, async () => {
      await this.#upsert("ratio_operator_actions", [actionToRow(action)])
    })
  }

  async flush(): Promise<void> {
    this.#assertInitialized()
    while (this.#writes.length > 0) {
      const write = this.#writes.shift()!
      try {
        await write.run()
      } catch (error) {
        this.#writes.unshift(write)
        throw new Error(`Persistence flush failed at ${write.label}: ${String(error)}`)
      }
    }
  }

  #enqueueThread(thread: LeadThread): void {
    this.#enqueue(`lead thread ${thread.id}`, async () => {
      await this.#upsert("ratio_lead_threads", [threadToRow(thread)])
    })
    if (thread.messages.length > 0) {
      this.#enqueue(`lead messages for ${thread.id}`, async () => {
        await this.#upsert(
          "ratio_lead_messages",
          thread.messages.map((message) => messageToRow(thread.id, message)),
        )
      })
    }
  }

  #enqueue(label: string, run: () => Promise<void>): void {
    this.#writes.push({ label, run })
  }

  async #upsert(table: string, rows: unknown[]): Promise<void> {
    if (rows.length === 0) return
    await this.#request(`/rest/v1/${table}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    })
  }

  async #request<T = unknown>(
    path: string,
    init: {
      method?: string
      headers?: Record<string, string>
      body?: string
    } = {},
  ): Promise<T> {
    const response = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers: {
        apikey: this.#serviceRoleKey,
        Authorization: `Bearer ${this.#serviceRoleKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
      ...(init.body ? { body: init.body } : {}),
    })
    const text = await response.text()
    if (!response.ok) {
      throw new Error(
        `Supabase persistence request failed (${response.status}) ${path}: ${text || "empty response"}`,
      )
    }
    return (text ? JSON.parse(text) : undefined) as T
  }

  #assertInitialized(): void {
    if (!this.#initialized) {
      throw new Error("Supabase persistence is not initialized. Call initializeRegisteredPersistence() first.")
    }
  }
}
