import type { AgentContract } from "@ratio-essendi/shared"

export type Verdict = "pass" | "weak" | "fail"

export type EvaluationInput = {
  agent: Pick<AgentContract, "successCriteria" | "failureCriteria">
  signals: string[]
}

export type EvaluationResult = {
  verdict: Verdict
  score: number
  reason: string
  matchedSuccess: string[]
  matchedFailure: string[]
}

/**
 * Deterministic evaluation against the agent's own success/failure criteria
 * (docs/09 KPI model). Every failure carries a reason (docs/14 validation).
 */
export function evaluateOutput(input: EvaluationInput): EvaluationResult {
  const signals = input.signals.map((s) => s.toLowerCase())
  const has = (needle: string): boolean =>
    signals.some((s) => s.includes(needle.toLowerCase()))

  const matchedSuccess = input.agent.successCriteria.filter(has)
  const matchedFailure = input.agent.failureCriteria.filter(has)

  const total = input.agent.successCriteria.length
  const ratio = total === 0 ? 0 : matchedSuccess.length / total
  const score = Math.round((ratio - matchedFailure.length * 0.5) * 100) / 100

  let verdict: Verdict
  let reason: string
  if (matchedFailure.length > 0) {
    verdict = "fail"
    reason = `Failure criteria hit: ${matchedFailure.join(", ")}.`
  } else if (ratio >= 0.5) {
    verdict = "pass"
    reason = `Met ${matchedSuccess.length}/${total} success criteria.`
  } else {
    verdict = "weak"
    reason = `Only met ${matchedSuccess.length}/${total} success criteria (below threshold).`
  }

  return { verdict, score, reason, matchedSuccess, matchedFailure }
}
