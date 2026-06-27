import type { SystemEvent } from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"

/** An event without the fields the log assigns itself. */
export type NewEvent = Omit<SystemEvent, "id" | "createdAt">

/** Anything that can absorb a fully-formed event (the log, a sink, a router). */
export type EventSink = { record(event: SystemEvent): SystemEvent }

/**
 * Append-only event log — the system memory of what happened
 * (docs/11_EVENT_LOG_AND_STATE_TRANSITIONS.md).
 *
 * Logs are operational, not metaphysical (docs/08): state, policy, event,
 * transition, result.
 */
export class EventLog {
  readonly #events: SystemEvent[] = []

  append(event: NewEvent): SystemEvent {
    const recorded: SystemEvent = {
      ...event,
      id: newId("evt"),
      createdAt: nowIso(),
    }
    this.#events.push(recorded)
    return recorded
  }

  /** Append an already-formed event (id + createdAt already set). */
  record(event: SystemEvent): SystemEvent {
    this.#events.push(event)
    return event
  }

  /** Reset the log so a fresh run / test is reproducible. */
  clear(): void {
    this.#events.length = 0
  }

  all(): readonly SystemEvent[] {
    return this.#events
  }

  byEntity(entityId: string): readonly SystemEvent[] {
    return this.#events.filter((e) => e.entityId === entityId)
  }

  byType(eventType: string): readonly SystemEvent[] {
    return this.#events.filter((e) => e.eventType === eventType)
  }

  get size(): number {
    return this.#events.length
  }
}
