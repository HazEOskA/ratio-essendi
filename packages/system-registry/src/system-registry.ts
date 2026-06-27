import type { SystemCell } from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"
import { EventLog } from "@ratio-essendi/event-log"
import { assertHealthTransition, type HealthStatus } from "@ratio-essendi/cell-health"

export type RegisterCellInput = {
  name: string
  domain: SystemCell["domain"]
  purpose: string
  memoryScope: string
  budgetLimit: number
  kpis?: string[]
  agents?: string[]
  coreAgentId?: string
  failoverPolicy?: string
  activeController?: boolean
  healthStatus?: HealthStatus
}

const HEALTH_EVENT: Record<HealthStatus, string> = {
  healthy: "cell.recovered",
  degraded: "cell.degraded",
  failed: "cell.failed",
  recovering: "cell.health_checked",
  quarantined: "cell.quarantined",
}

/**
 * Registry of system cells. Enforces the core ownership rule (docs/02):
 * only one active controller per domain — split-brain is forbidden.
 */
export class SystemRegistry {
  readonly #cells = new Map<string, SystemCell>()
  readonly #log: EventLog

  constructor(log: EventLog) {
    this.#log = log
  }

  registerCell(input: RegisterCellInput): SystemCell {
    const activeController = input.activeController ?? true
    if (activeController) {
      this.#assertNoActiveController(input.domain)
    }

    const timestamp = nowIso()
    const cell: SystemCell = {
      id: newId("cell"),
      name: input.name,
      domain: input.domain,
      purpose: input.purpose,
      coreAgentId: input.coreAgentId,
      agents: input.agents ?? [],
      memoryScope: input.memoryScope,
      budgetLimit: input.budgetLimit,
      kpis: input.kpis ?? [],
      healthStatus: input.healthStatus ?? "healthy",
      shadowCellId: undefined,
      failoverPolicy: input.failoverPolicy ?? "promote-shadow-on-failure",
      activeController,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.#cells.set(cell.id, cell)

    this.#log.append({
      eventType: "cell.created",
      entityId: cell.id,
      entityType: "cell",
      nextState: cell.healthStatus,
      reason: `Cell '${cell.name}' registered for domain '${cell.domain}'.`,
    })
    if (activeController) {
      this.#log.append({
        eventType: "cell.activated",
        entityId: cell.id,
        entityType: "cell",
        nextState: "active_controller",
        policy: "single-active-controller-per-domain",
      })
    }
    return cell
  }

  getCell(id: string): SystemCell {
    const cell = this.#cells.get(id)
    if (!cell) throw new Error(`Unknown cell: ${id}`)
    return cell
  }

  listCells(): readonly SystemCell[] {
    return [...this.#cells.values()]
  }

  activeControllerForDomain(domain: SystemCell["domain"]): SystemCell | undefined {
    return this.listCells().find((c) => c.domain === domain && c.activeController)
  }

  setHealth(cellId: string, status: HealthStatus, reason: string): SystemCell {
    const cell = this.getCell(cellId)
    assertHealthTransition(cell.healthStatus, status)
    const previous = cell.healthStatus
    cell.healthStatus = status
    cell.updatedAt = nowIso()
    // A failed or quarantined cell cannot perform external actions (docs/02).
    if (status === "failed" || status === "quarantined") {
      cell.activeController = false
    }
    this.#log.append({
      eventType: HEALTH_EVENT[status],
      entityId: cell.id,
      entityType: "cell",
      previousState: previous,
      nextState: status,
      reason,
    })
    return cell
  }

  /** Attach an already-built cell (used by the failover engine for shadows). */
  attachCell(cell: SystemCell): void {
    this.#cells.set(cell.id, cell)
  }

  /** Replace all cells from a persisted snapshot. */
  restore(cells: readonly SystemCell[]): void {
    this.#cells.clear()
    for (const cell of cells) this.#cells.set(cell.id, cell)
  }

  setActiveController(cellId: string, active: boolean): void {
    const cell = this.getCell(cellId)
    if (active) this.#assertNoActiveController(cell.domain)
    cell.activeController = active
    cell.updatedAt = nowIso()
  }

  #assertNoActiveController(domain: SystemCell["domain"]): void {
    const existing = this.activeControllerForDomain(domain)
    if (existing) {
      this.#log.append({
        eventType: "system.ownership_conflict",
        entityId: existing.id,
        entityType: "system",
        policy: "single-active-controller-per-domain",
        reason: `Domain '${domain}' already controlled by ${existing.id}; split-brain prevented.`,
      })
      throw new Error(
        `Split-brain prevented: domain '${domain}' already has active controller ${existing.id}`,
      )
    }
  }
}
