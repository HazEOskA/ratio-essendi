import type { SystemCell } from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"
import { EventLog } from "@ratio-essendi/event-log"
import { SystemRegistry } from "@ratio-essendi/system-registry"

/**
 * Failover engine (docs/12). Prepares standby shadow cells and promotes them
 * when a primary fails — always preserving the single-active-controller rule
 * so a failover never causes split-brain.
 */
export class FailoverEngine {
  readonly #registry: SystemRegistry
  readonly #log: EventLog

  constructor(registry: SystemRegistry, log: EventLog) {
    this.#registry = registry
    this.#log = log
  }

  /** Prepare a standby shadow copy that observes but cannot act (docs/12). */
  prepareShadow(primaryId: string): SystemCell {
    const primary = this.#registry.getCell(primaryId)
    const timestamp = nowIso()
    const shadow: SystemCell = {
      ...primary,
      id: newId("shadow"),
      name: `${primary.name} (shadow)`,
      healthStatus: "recovering",
      activeController: false,
      shadowCellId: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    primary.shadowCellId = shadow.id
    this.#registry.attachCell(shadow)
    this.#log.append({
      eventType: "cell.shadow_prepared",
      entityId: shadow.id,
      entityType: "cell",
      reason: `Shadow prepared for ${primary.id} (${primary.domain}).`,
    })
    return shadow
  }

  /**
   * Promote a shadow to active controller. Split-brain rule (docs/02, docs/12):
   * the failed primary must lose control BEFORE the shadow takes over.
   */
  promoteShadow(primaryId: string, shadowId: string): SystemCell {
    const primary = this.#registry.getCell(primaryId)
    const shadow = this.#registry.getCell(shadowId)

    if (primary.healthStatus !== "failed" && primary.healthStatus !== "quarantined") {
      this.#registry.setHealth(primary.id, "failed", "Primary failed; releasing control.")
    }
    if (primary.healthStatus !== "quarantined") {
      this.#registry.setHealth(primary.id, "quarantined", "Primary quarantined before failover.")
    }

    this.#registry.setHealth(shadow.id, "healthy", "Shadow validated for promotion.")
    this.#registry.setActiveController(shadow.id, true)

    this.#log.append({
      eventType: "cell.shadow_promoted",
      entityId: shadow.id,
      entityType: "cell",
      previousState: "recovering",
      nextState: "active_controller",
      policy: "single-active-controller-per-domain",
      reason: `Shadow ${shadow.id} promoted; ${primary.id} quarantined (no split-brain).`,
    })
    return shadow
  }
}
