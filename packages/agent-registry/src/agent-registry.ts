import type { AgentContract } from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"
import { EventLog } from "@ratio-essendi/event-log"

export type RegisterAgentInput = {
  name: string
  cellId: string
  role: string
  purpose: string
  memoryScope: string
  budgetLimit: number
  kpis: string[]
  responsibilities?: string[]
  tools?: string[]
  successCriteria?: string[]
  failureCriteria?: string[]
  boundaries?: string[]
  allowedActions?: string[]
  forbiddenActions?: string[]
  version?: string
  lineage?: AgentContract["lineage"]
}

type AgentStatus = AgentContract["status"]

const STATUS_EVENT: Record<AgentStatus, string> = {
  created: "agent.created",
  active: "agent.activated",
  warning: "agent.warning_issued",
  degraded: "agent.failure_detected",
  under_review: "agent.under_review",
  succession_required: "agent.succession_requested",
  disabled: "agent.disabled",
  archived: "agent.archived",
  replaced: "agent.replaced",
}

/**
 * Registry of purpose-bound agents (docs/03). Enforces the activation gate
 * from docs/09 — no KPI means no activation — and records every lifecycle
 * transition to the event log.
 */
export class AgentRegistry {
  readonly #agents = new Map<string, AgentContract>()
  readonly #log: EventLog

  constructor(log: EventLog) {
    this.#log = log
  }

  registerAgent(input: RegisterAgentInput): AgentContract {
    if (input.kpis.length === 0) {
      throw new Error(`Agent '${input.name}' rejected: no KPI means no activation (docs/09).`)
    }
    const timestamp = nowIso()
    const agent: AgentContract = {
      id: newId("agent"),
      name: input.name,
      version: input.version ?? "v1",
      cellId: input.cellId,
      role: input.role,
      purpose: input.purpose,
      responsibilities: input.responsibilities ?? [],
      tools: input.tools ?? [],
      memoryScope: input.memoryScope,
      budgetLimit: input.budgetLimit,
      kpis: input.kpis,
      successCriteria: input.successCriteria ?? [],
      failureCriteria: input.failureCriteria ?? [],
      boundaries: input.boundaries ?? [],
      allowedActions: input.allowedActions ?? [],
      forbiddenActions: input.forbiddenActions ?? [],
      status: "created",
      lineage: input.lineage ?? {},
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.#agents.set(agent.id, agent)
    this.#log.append({
      eventType: "agent.created",
      entityId: agent.id,
      entityType: "agent",
      nextState: "created",
      reason: `Agent '${agent.name}' created for role '${agent.role}'.`,
    })
    return agent
  }

  getAgent(id: string): AgentContract {
    const agent = this.#agents.get(id)
    if (!agent) throw new Error(`Unknown agent: ${id}`)
    return agent
  }

  listAgents(): readonly AgentContract[] {
    return [...this.#agents.values()]
  }

  /** Replace all agents from a persisted snapshot. */
  restore(agents: readonly AgentContract[]): void {
    this.#agents.clear()
    for (const agent of agents) this.#agents.set(agent.id, agent)
  }

  activate(agentId: string): AgentContract {
    return this.setStatus(agentId, "active", "Agent activated.")
  }

  assignTask(agentId: string, task: string): void {
    const agent = this.getAgent(agentId)
    this.#log.append({
      eventType: "agent.task_assigned",
      entityId: agent.id,
      entityType: "agent",
      reason: task,
    })
  }

  setStatus(agentId: string, status: AgentStatus, reason: string): AgentContract {
    const agent = this.getAgent(agentId)
    const previous = agent.status
    agent.status = status
    agent.updatedAt = nowIso()
    this.#log.append({
      eventType: STATUS_EVENT[status],
      entityId: agent.id,
      entityType: "agent",
      previousState: previous,
      nextState: status,
      reason,
    })
    return agent
  }

  recordEvaluation(agentId: string, verdict: string, reason: string): void {
    const agent = this.getAgent(agentId)
    this.#log.append({
      eventType: "agent.output_evaluated",
      entityId: agent.id,
      entityType: "agent",
      nextState: verdict,
      reason,
    })
  }

  /** Persist a successor candidate and link lineage on both agents (docs/06). */
  addSuccessor(failedAgentId: string, successor: AgentContract): AgentContract {
    this.#agents.set(successor.id, successor)
    const failed = this.getAgent(failedAgentId)
    failed.lineage = { ...failed.lineage, successorId: successor.id }
    this.#log.append({
      eventType: "agent.successor_created",
      entityId: successor.id,
      entityType: "agent",
      reason: `Successor of ${failedAgentId}; lineage preserved.`,
    })
    return successor
  }
}
