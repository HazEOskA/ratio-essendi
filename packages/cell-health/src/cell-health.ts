import type { SystemCell } from "@ratio-essendi/shared"

export type HealthStatus = SystemCell["healthStatus"]

/**
 * Allowed health-state transitions (docs/02 Cell Contract, docs/12 Failover).
 * A failed cell is quarantined; a quarantined cell is terminal until rebuilt.
 */
const HEALTH_TRANSITIONS: Record<HealthStatus, readonly HealthStatus[]> = {
  healthy: ["healthy", "degraded", "failed"],
  degraded: ["degraded", "recovering", "failed", "healthy"],
  failed: ["failed", "quarantined", "recovering"],
  recovering: ["recovering", "healthy", "failed"],
  quarantined: ["quarantined"],
}

export function canTransitionHealth(from: HealthStatus, to: HealthStatus): boolean {
  return HEALTH_TRANSITIONS[from].includes(to)
}

export function assertHealthTransition(from: HealthStatus, to: HealthStatus): void {
  if (!canTransitionHealth(from, to)) {
    throw new Error(`Illegal health transition: ${from} -> ${to}`)
  }
}
