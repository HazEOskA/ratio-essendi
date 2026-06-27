import type {
  AgentContract,
  AgentSuccessionBrief,
  DriftEvent,
  SystemCell,
} from "@ratio-essendi/shared"
import { EventLog } from "@ratio-essendi/event-log"
import { SystemRegistry, type RegisterCellInput } from "@ratio-essendi/system-registry"
import { AgentRegistry, type RegisterAgentInput } from "@ratio-essendi/agent-registry"
import { evaluateOutput, type EvaluationResult } from "@ratio-essendi/evaluation-engine"
import {
  createSuccessionBrief,
  createSuccessorCandidate,
  detectDrift as computeDrift,
  type DriftInput,
  type SuccessionInput,
} from "@ratio-essendi/agent-succession"
import { FailoverEngine } from "@ratio-essendi/failover-engine"

export type Invariants = { ok: boolean; problems: string[] }

/**
 * Meta-Governor (docs/01): system health, ownership rules, conflict resolution
 * and failover. It does not own all reality — it wires the cells, agents and
 * engines together and guarantees the system-wide invariants.
 */
export class MetaGovernor {
  readonly log = new EventLog()
  readonly cells = new SystemRegistry(this.log)
  readonly agents = new AgentRegistry(this.log)
  readonly failover = new FailoverEngine(this.cells, this.log)

  registerCell(input: RegisterCellInput): SystemCell {
    return this.cells.registerCell(input)
  }

  registerAndActivateAgent(input: RegisterAgentInput): AgentContract {
    const agent = this.agents.registerAgent(input)
    this.agents.activate(agent.id)
    this.agents.assignTask(
      agent.id,
      `Pursue role '${agent.role}' within budget ${agent.budgetLimit}.`,
    )
    return agent
  }

  evaluate(agentId: string, signals: string[]): EvaluationResult {
    const agent = this.agents.getAgent(agentId)
    const result = evaluateOutput({ agent, signals })
    this.agents.recordEvaluation(agentId, result.verdict, result.reason)
    return result
  }

  detectDrift(input: DriftInput): DriftEvent | null {
    const event = computeDrift(input)
    if (event) {
      // Preserve the audited entity type. SystemEvent has no "llm_session",
      // so map it to "system" while keeping it visible in the event type.
      const logEntityType = event.entityType === "llm_session" ? "system" : event.entityType
      this.log.append({
        eventType: `${event.entityType}.drift_detected`,
        entityId: event.entityId,
        entityType: logEntityType,
        nextState: event.action,
        reason: `Drift signals: ${event.driftSignals.join(", ")}.`,
      })
    }
    return event
  }

  requestSuccession(input: SuccessionInput): AgentSuccessionBrief {
    this.agents.setStatus(input.failedAgent.id, "succession_required", input.failureSummary)
    const brief = createSuccessionBrief(input)
    this.log.append({
      eventType: "agent.succession_brief_created",
      entityId: input.failedAgent.id,
      entityType: "agent",
      reason: brief.recommendedSuccessorPrompt,
    })
    return brief
  }

  promoteSuccessor(failedAgent: AgentContract, brief: AgentSuccessionBrief): AgentContract {
    const candidate = createSuccessorCandidate(failedAgent, brief)
    this.agents.addSuccessor(failedAgent.id, candidate)
    this.agents.activate(candidate.id)
    this.agents.setStatus(failedAgent.id, "archived", "Replaced by successor.")
    this.agents.setStatus(failedAgent.id, "replaced", `Replaced by ${candidate.id}.`)
    return candidate
  }

  /** System-wide invariant: at most one active controller per domain (docs/02). */
  invariants(): Invariants {
    const problems: string[] = []
    const activeByDomain = new Map<string, number>()
    for (const cell of this.cells.listCells()) {
      if (cell.activeController) {
        activeByDomain.set(cell.domain, (activeByDomain.get(cell.domain) ?? 0) + 1)
      }
    }
    for (const [domain, count] of activeByDomain) {
      if (count > 1) {
        problems.push(`Split-brain: domain '${domain}' has ${count} active controllers.`)
      }
    }
    return { ok: problems.length === 0, problems }
  }
}
