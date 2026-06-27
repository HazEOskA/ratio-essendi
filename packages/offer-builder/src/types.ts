/** Inputs the offer-builder needs to draft an offer. */
export type OfferBrief = {
  icp: string
  product: string
  constraints: string[]
  /** KPI keywords the offer must evidence (docs/09). */
  kpis: string[]
  agentName?: string
  /** Weaknesses to fix on a regeneration after a failed first attempt. */
  emphasize?: string[]
}

/** Anything that can turn a brief into a rendered offer (real LLM or stub). */
export interface OfferProvider {
  generateOffer(brief: OfferBrief): Promise<string>
}

export type OfferAgentResult = {
  agentId: string
  offer: string
  passed: boolean
  score: number
  /** `pending_approval` = good offer, held at the gate; `blocked` = failed evaluation. */
  status: "pending_approval" | "blocked"
  /** The system never auto-sends (docs/13). Always false. */
  sent: false
  attempts: number
  successorId?: string
}
