import type { AgentContract, SystemEvent } from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"
import { defaultLog, type EventSink } from "@ratio-essendi/event-log"

export type EvaluationResult = {
  agentId: string
  passed: boolean
  score: number
  failureReasons: string[]
  timestamp: string
}

const PASS_THRESHOLD = 0.5

/**
 * Evaluate an agent's output against its KPIs (docs/09, docs/14).
 *
 * Score is the fraction of KPIs evidenced in the output. Either way the result
 * is logged: a pass emits `agent.output_evaluated`, a fail emits
 * `agent.failure_detected` — and every failure carries a reason (docs/14).
 */
export function evaluateAgent(
  agentId: string,
  output: string,
  kpis: AgentContract["kpis"],
  sink: EventSink = defaultLog,
): EvaluationResult {
  const haystack = output.toLowerCase()
  const failureReasons: string[] = []
  let met = 0
  for (const kpi of kpis) {
    if (haystack.includes(kpi.toLowerCase())) {
      met += 1
    } else {
      failureReasons.push(`KPI not met: ${kpi}`)
    }
  }

  const score = kpis.length === 0 ? 0 : Math.round((met / kpis.length) * 100) / 100
  const passed = score >= PASS_THRESHOLD
  const timestamp = nowIso()

  if (passed) {
    const event: SystemEvent = {
      id: newId("evt"),
      eventType: "agent.output_evaluated",
      entityId: agentId,
      entityType: "agent",
      nextState: "active",
      reason: `Agent ${agentId} scored ${score} (>= ${PASS_THRESHOLD}).`,
      createdAt: timestamp,
    }
    sink.record(event)
  } else {
    const event: SystemEvent = {
      id: newId("evt"),
      eventType: "agent.failure_detected",
      entityId: agentId,
      entityType: "agent",
      nextState: "degraded",
      reason: `Agent ${agentId} scored ${score} (< ${PASS_THRESHOLD}).`,
      evidence: failureReasons,
      createdAt: timestamp,
    }
    sink.record(event)
  }

  return { agentId, passed, score, failureReasons, timestamp }
}
