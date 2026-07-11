import type { FactoryEvent, LeadThread, LeadThreadMessage } from "../types.js"

export type PersistenceDriver = "json" | "postgres"

export type OperatorActionTarget =
  | "lead_thread"
  | "approval"
  | "daily_digital"
  | "order"
  | "delivery_pack"
  | "integrity"
  | "factory"
  | "other"

export type OperatorActionMetadataValue = string | number | boolean | null

/**
 * Append-only audit record for an explicit God Layer / operator action.
 * Model output is never an operator action. External sends remain manual.
 */
export type OperatorAction = {
  id: string
  timestamp: string
  actor: "operator"
  action: string
  targetType: OperatorActionTarget
  targetId?: string
  detail: string
  metadata?: Record<string, OperatorActionMetadataValue>
}

export type PersistedLeadMessage = LeadThreadMessage & { threadId: string }

export type PersistenceSnapshot = {
  leadThreads: LeadThread[]
  leadMessages: PersistedLeadMessage[]
  factoryEvents: FactoryEvent[]
  operatorActions: OperatorAction[]
}

/**
 * Boundary between the synchronous factory domain and durable storage.
 *
 * Adapters keep an in-process cache so existing domain methods stay synchronous.
 * Remote writes are queued and must be awaited through flush() at the request
 * boundary. JSON writes immediately and flush() is a no-op.
 */
export interface PersistencePort {
  readonly driver: PersistenceDriver

  initialize(): Promise<void>
  snapshot(): PersistenceSnapshot

  addFactoryEvent(event: FactoryEvent): void
  addLeadThread(thread: LeadThread): void
  updateLeadThread(id: string, patch: Partial<LeadThread>): void
  addOperatorAction(action: OperatorAction): void

  flush(): Promise<void>
}
