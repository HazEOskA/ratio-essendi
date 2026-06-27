import type { MetaGovernor } from "@ratio-essendi/meta-governor"
import type { AgentContract, SystemCell, SystemEvent } from "@ratio-essendi/shared"

export type DashboardSnapshot = {
  generatedAt: string
  cells: readonly SystemCell[]
  agents: readonly AgentContract[]
  events: readonly SystemEvent[]
}

/** Take a read-only snapshot of everything the governor currently knows. */
export function buildSnapshot(gov: MetaGovernor): DashboardSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    cells: gov.cells.listCells(),
    agents: gov.agents.listAgents(),
    events: gov.log.all(),
  }
}
