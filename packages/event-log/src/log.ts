import type { SystemEvent } from "@ratio-essendi/shared"
import { EventLog } from "./event-log.js"

/**
 * Default shared log instance — the single source of truth behind the
 * functional API. Engines that hold their own {@link EventLog} (e.g. the
 * Meta-Governor) can be passed directly as a sink instead, so the whole
 * system can converge on one log.
 */
export const defaultLog = new EventLog()

export function appendEvent(event: SystemEvent): SystemEvent {
  return defaultLog.record(event)
}

export function getLog(): SystemEvent[] {
  return [...defaultLog.all()]
}

/** Reset the shared log so a fresh run / test is reproducible. */
export function clearLog(): void {
  defaultLog.clear()
}
