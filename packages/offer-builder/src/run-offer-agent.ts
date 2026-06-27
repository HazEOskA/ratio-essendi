import type { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent } from "@ratio-essendi/evaluation-engine"
import type { OfferBrief, OfferProvider, OfferAgentResult } from "./types.js"

/**
 * Run one offer-builder agent end-to-end on a cell:
 * generate → evaluate against KPIs → (succession if weak) → approval gate.
 *
 * The approval gate (docs/13) is the hard boundary: a good offer is held at
 * `pending_approval` and is NEVER auto-sent. No money is spent, nothing leaves
 * the system without a human.
 */
export async function runOfferAgent(
  gov: MetaGovernor,
  cellId: string,
  brief: OfferBrief,
  provider: OfferProvider,
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

  let offer = await provider.generateOffer(brief)
  let result = evaluateAgent(agent.id, offer, kpis, gov.log)
  let attempts = 1
  let activeAgentId = agent.id
  let successorId: string | undefined

  if (!result.passed) {
    // Weak value-producer → succession → regenerate with the successor (docs/06).
    const successionBrief = gov.requestSuccession({
      failedAgent: gov.agents.getAgent(agent.id),
      failureType: "agent_error",
      failureSummary: `Weak offer: ${result.failureReasons.join(", ")}`,
      repeatedWeaknesses: result.failureReasons,
      evidence: gov.log.byEntity(agent.id).map((e) => e.eventType),
    })
    const successor = gov.promoteSuccessor(gov.agents.getAgent(agent.id), successionBrief)
    successorId = successor.id
    activeAgentId = successor.id

    offer = await provider.generateOffer({ ...brief, emphasize: result.failureReasons })
    result = evaluateAgent(successor.id, offer, kpis, gov.log)
    attempts = 2
  }

  if (result.passed) {
    // Approval gate (docs/13): never auto-send.
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
    reason: "Offer still below KPI threshold after succession; not sent.",
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
