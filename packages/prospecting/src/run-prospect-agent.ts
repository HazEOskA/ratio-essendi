import type { MetaGovernor } from "@ratio-essendi/meta-governor"
import { runOfferAgent, type OfferProvider } from "@ratio-essendi/offer-builder"
import type { JudgeProvider } from "@ratio-essendi/evaluation-engine"
import type { QualifierProvider } from "./qualifier.js"
import type { LeadBrief, ProspectAgentResult } from "./types.js"

/**
 * Full prospecting pipeline for one lead:
 *   qualify → (if fit) run offer pipeline → approval gate.
 *
 * A disqualified lead gets a "disqualified" result with no offer generated.
 * A qualified lead runs through `runOfferAgent` which enforces the approval gate
 * from docs/13 — the offer is NEVER auto-sent.
 */
export async function runProspectAgent(
  gov: MetaGovernor,
  cellId: string,
  brief: LeadBrief,
  qualifier: QualifierProvider,
  offerProvider: OfferProvider,
  judge?: JudgeProvider,
): Promise<ProspectAgentResult> {
  const qualification = await qualifier.qualify(brief.prospect, brief.icp)

  gov.log.append({
    eventType: qualification.qualified ? "prospect.qualified" : "prospect.disqualified",
    entityId: brief.prospect.id,
    entityType: "system",
    reason: qualification.qualified
      ? `ICP fit ${(qualification.fitScore * 100).toFixed(0)}% — ${brief.prospect.name} at ${brief.prospect.company}`
      : `ICP fit ${(qualification.fitScore * 100).toFixed(0)}% — ${qualification.reasons.join("; ")}`,
  })

  if (!qualification.qualified) {
    return {
      prospectId: brief.prospect.id,
      agentId: "none",
      qualification,
      status: "disqualified",
      sent: false,
    }
  }

  const offerResult = await runOfferAgent(
    gov,
    cellId,
    {
      icp: `${brief.icp} — specifically ${brief.prospect.name} at ${brief.prospect.company} (${brief.prospect.role})`,
      product: brief.product,
      constraints: brief.constraints,
      kpis: brief.kpis,
      agentName: `Prospector → ${brief.prospect.company}`,
    },
    offerProvider,
    judge,
  )

  return {
    prospectId: brief.prospect.id,
    agentId: offerResult.agentId,
    qualification,
    offer: offerResult.offer,
    offerScore: offerResult.score,
    status: offerResult.status === "pending_approval" ? "pending_approval" : "blocked",
    sent: false,
  }
}
