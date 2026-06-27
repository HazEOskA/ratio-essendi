import type { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent, type JudgeProvider } from "@ratio-essendi/evaluation-engine"
import type { OfferBrief, OfferProvider, OfferAgentResult } from "./types.js"

type Grade = { passed: boolean; score: number; reasons: string[] }

/**
 * Run one offer-builder agent end-to-end on a cell:
 * generate → grade → (succession if weak) → approval gate.
 *
 * Grading: with a {@link JudgeProvider} the offer is graded on quality (clarity,
 * ICP-fit, margin, CTA); without one it falls back to KPI-presence checking.
 * Either way the approval gate (docs/13) holds a good offer at `pending_approval`
 * and NEVER auto-sends.
 */
export async function runOfferAgent(
  gov: MetaGovernor,
  cellId: string,
  brief: OfferBrief,
  provider: OfferProvider,
  judge?: JudgeProvider,
): Promise<OfferAgentResult> {
  const kpis = brief.kpis

  const agent = gov.registerAndActivateAgent({
    name: brief.agentName ?? "Offer Builder",
    cellId,
    role: "offer-builder",
    purpose: "Create profitable, clear offers for the selected ICP.",
    memoryScope: "sales/offers",
    budgetLimit: 200,
    kpis,
    successCriteria: kpis,
    failureCriteria: ["off-topic", "spam", "no price"],
    allowedActions: ["draft offer", "research market"],
    forbiddenActions: ["send to client", "publish externally", "spend over budget"],
  })

  const grade = async (agentId: string, text: string): Promise<Grade> => {
    if (judge) {
      const verdict = await judge.judge({
        output: text,
        context: `ICP: ${brief.icp}; KPIs: ${kpis.join(", ")}`,
      })
      gov.agents.recordEvaluation(
        agentId,
        verdict.verdict,
        `Judge ${verdict.score}: ${verdict.reasons.join("; ") || "strong"}`,
      )
      return { passed: verdict.passed, score: verdict.score, reasons: verdict.reasons }
    }
    const result = evaluateAgent(agentId, text, kpis, gov.log)
    return { passed: result.passed, score: result.score, reasons: result.failureReasons }
  }

  let offer = await provider.generateOffer(brief)
  let result = await grade(agent.id, offer)
  let attempts = 1
  let activeAgentId = agent.id
  let successorId: string | undefined

  if (!result.passed) {
    const successionBrief = gov.requestSuccession({
      failedAgent: gov.agents.getAgent(agent.id),
      failureType: "agent_error",
      failureSummary: `Weak offer: ${result.reasons.join(", ")}`,
      repeatedWeaknesses: result.reasons,
      evidence: gov.log.byEntity(agent.id).map((e) => e.eventType),
    })
    const successor = gov.promoteSuccessor(gov.agents.getAgent(agent.id), successionBrief)
    successorId = successor.id
    activeAgentId = successor.id

    offer = await provider.generateOffer({ ...brief, emphasize: result.reasons })
    result = await grade(successor.id, offer)
    attempts = 2
  }

  if (result.passed) {
    gov.log.append({
      eventType: "approval.required",
      entityId: activeAgentId,
      entityType: "agent",
      nextState: "pending_approval",
      policy: "no-external-action-without-approval",
      reason: "Offer ready; external send blocked pending human approval (docs/13).",
    })
    return {
      agentId: activeAgentId,
      offer,
      passed: true,
      score: result.score,
      status: "pending_approval",
      sent: false,
      attempts,
      successorId,
    }
  }

  gov.log.append({
    eventType: "agent.blocked",
    entityId: activeAgentId,
    entityType: "agent",
    reason: "Offer still below quality threshold after succession; not sent.",
  })
  return {
    agentId: activeAgentId,
    offer,
    passed: false,
    score: result.score,
    status: "blocked",
    sent: false,
    attempts,
    successorId,
  }
}
