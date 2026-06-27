import type { SystemEvent } from "@ratio-essendi/shared"

/**
 * Module-level, in-memory event log (docs/11).
 *
 * A simple functional companion to the {@link EventLog} class: a single shared
 * array that engines can append to without holding a log instance.
 */
const events: SystemEvent[] = []

export function appendEvent(event: SystemEvent): SystemEvent {
  events.push(event)
  return event
}

export function getLog(): readonly SystemEvent[] {
  return events
}

/** Reset the shared log so a fresh run / test is reproducible. */
export function clearLog(): void {
  events.length = 0
}
