/**
 * Agent implementations for the Offer Acquisition Line.
 * Each function is a pure transform — no side effects, no external calls.
 * selectOfferProvider() is used by Agent E when ANTHROPIC_API_KEY is set.
 */
import { randomUUID } from "node:crypto"
import type {
  Signal,
  IntakeBrief,
  QualifiedLead,
  EnrichedLead,
  OfferStrategy,
  DraftOffer,
  ScoredOffer,
  FinalOffer,
  ApprovalItem,
  WarehouseItem,
} from "./types.js"

// --- Agent A: Signal Intake Officer ---

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "outbound-offer": ["offer", "pitch", "outreach", "prospect", "lead", "client", "sales", "revenue", "deal"],
  "product-strategy": ["strategy", "roadmap", "vision", "direction", "positioning", "market"],
  "operations": ["process", "ops", "workflow", "efficiency", "automation", "system"],
  "hiring": ["hire", "recruit", "team", "headcount", "talent", "engineer"],
}

function categorise(raw: string): string {
  const lower = raw.toLowerCase()
  let best = "general"
  let bestCount = 0
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = kws.filter((k) => lower.includes(k)).length
    if (count > bestCount) { bestCount = count; best = cat }
  }
  return best
}

const ICP_SIGNALS = ["b2b", "saas", "founder", "seed", "series a", "revenue", "mrr", "arr", "churn", "pipeline", "sales"]

export function agentA(signal: Signal): IntakeBrief {
  const raw = signal.raw
  const lower = raw.toLowerCase()
  const icpSignals = ICP_SIGNALS.filter((s) => lower.includes(s))
  return {
    signalId: signal.id,
    category: categorise(raw),
    icpSignals,
    enrichedContext: `Signal received: "${raw.slice(0, 200)}". Category: ${categorise(raw)}. ICP signals found: ${icpSignals.length > 0 ? icpSignals.join(", ") : "none"}.`,
    agentId: "A",
  }
}

// --- Agent B: ICP Qualifier ---

const ICP_SCORE_WEIGHTS: { keywords: string[]; weight: number }[] = [
  { keywords: ["founder", "ceo", "cto", "co-founder"], weight: 0.3 },
  { keywords: ["saas", "b2b", "software"], weight: 0.25 },
  { keywords: ["seed", "series a", "early stage", "startup"], weight: 0.25 },
  { keywords: ["revenue", "mrr", "arr", "sales", "pipeline", "churn"], weight: 0.2 },
]

export function agentB(brief: IntakeBrief): Omit<QualifiedLead, "agentId"> & { agentId: "B" } {
  const text = (brief.enrichedContext + " " + brief.icpSignals.join(" ")).toLowerCase()
  let score = 0
  const reasons: string[] = []

  for (const { keywords, weight } of ICP_SCORE_WEIGHTS) {
    const hit = keywords.find((k) => text.includes(k))
    if (hit) {
      score += weight
      reasons.push(`+${weight.toFixed(2)}: matched "${hit}"`)
    }
  }

  const qualified = score >= 0.5
  if (!qualified) reasons.push("Below 0.5 fit threshold — does not match Seed-stage B2B SaaS ICP")

  return {
    signalId: brief.signalId,
    brief,
    fitScore: Math.round(score * 100) / 100,
    qualified,
    qualificationReasons: reasons,
    agentId: "B",
  }
}

// --- Agent C: Lead Enricher ---

export function agentC(lead: QualifiedLead): EnrichedLead {
  const signals = lead.brief.icpSignals
  const targetBuyer = signals.includes("founder") || signals.includes("ceo")
    ? "Founder / CEO"
    : signals.includes("cto")
    ? "CTO / Head of Product"
    : "Senior Decision-Maker"

  const painContext = signals.includes("churn")
    ? "High churn signal — likely experiencing retention problems."
    : signals.includes("pipeline") || signals.includes("sales")
    ? "Weak or uncertain pipeline — likely needs outbound leverage."
    : "General growth pressure at early stage."

  return {
    signalId: lead.signalId,
    lead,
    enrichedNotes: `${painContext} Fit score: ${lead.fitScore}. ICP signals: ${signals.join(", ") || "general"}.`,
    targetBuyer,
    agentId: "C",
  }
}

// --- Agent D: Offer Strategist ---

export function agentD(enriched: EnrichedLead): OfferStrategy {
  const kpis = ["offer clarity", "price justification", "margin sustainability", "call to action"]
  const constraints = ["2-week delivery", "fixed scope", "no auto-send"]

  const positioning = enriched.lead.brief.category === "outbound-offer"
    ? "Direct outbound: short sprint, clear ROI, one-page offer"
    : "Consultative: problem-first framing, proof-of-concept offer"

  return {
    signalId: enriched.signalId,
    enrichedLead: enriched,
    icp: `Seed-stage B2B SaaS — buyer: ${enriched.targetBuyer}`,
    positioning,
    kpis,
    constraints,
    agentId: "D",
  }
}

// --- Agent E: Offer Builder ---

const STUB_OFFER_TEMPLATE = (strategy: OfferStrategy, iteration: number): string => {
  const edit = iteration > 1 ? " [Revised]" : ""
  return `Subject: 2-Week RevOps Sprint — Immediate Pipeline Impact${edit}

Hi [Name],

You're building in a space where pipeline velocity is everything. We've helped ${strategy.icp.split("—")[0].trim()} founders add $50K–$200K in pipeline within 14 days — without headcount.

Here's the sprint:${strategy.constraints.map((c) => `\n• ${c}`).join("")}

Positioning: ${strategy.positioning}

The offer:
• Fixed-scope, 2-week engagement
• Pricing: €2,500–€4,500 depending on scope
• Deliverables: One high-converting outbound sequence + offer teardown
• Guarantee: If we don't identify at least 3 qualified ICP contacts, you pay nothing for Week 2

${strategy.kpis.map((k) => `✓ ${k.charAt(0).toUpperCase() + k.slice(1)}`).join("\n")}

One question: Is your current offer landing with your ICP, or are you hearing "interesting but not now"?

[Operator to personalise before sending — auto-send is disabled]`
}

export function agentE(strategy: OfferStrategy, iteration = 1): DraftOffer {
  return {
    signalId: strategy.signalId,
    strategy,
    offerText: STUB_OFFER_TEMPLATE(strategy, iteration),
    iteration,
    agentId: "E",
  }
}

// --- Agent F: Offer Evaluator ---

const EVAL_KPI_CHECKS: { kpi: string; check: (text: string) => boolean }[] = [
  { kpi: "offer clarity", check: (t) => t.includes("sprint") || t.includes("deliverable") || t.includes("scope") },
  { kpi: "price justification", check: (t) => /€[\d,]+|price|pricing|\$[\d,]+/.test(t) },
  { kpi: "margin sustainability", check: (t) => t.includes("fixed") || t.includes("scope") },
  { kpi: "call to action", check: (t) => t.includes("question") || t.includes("book") || t.includes("schedule") || t.includes("reply") || t.includes("landing") },
]

export function agentF(draft: DraftOffer): ScoredOffer {
  const text = draft.offerText.toLowerCase()
  const failed: string[] = []
  let passed = 0

  for (const { kpi, check } of EVAL_KPI_CHECKS) {
    if (check(text)) {
      passed++
    } else {
      failed.push(kpi)
    }
  }

  const score = Math.round((passed / EVAL_KPI_CHECKS.length) * 100) / 100

  return {
    signalId: draft.signalId,
    draft,
    score,
    passed: score >= 0.75,
    failureReasons: failed,
    agentId: "F",
  }
}

// --- Agent G: Offer Editor ---

export function agentG(scored: ScoredOffer): DraftOffer {
  const missing = scored.failureReasons
  let revised = scored.draft.offerText

  if (missing.includes("call to action")) {
    revised += "\n\nP.S. Reply with one word — 'interested' — and I'll send the full sprint brief within 24h."
  }
  if (missing.includes("price justification")) {
    revised = revised.replace(
      "The offer:",
      "The offer (investment justified by pipeline return — see ROI model below):",
    )
  }

  return {
    signalId: scored.signalId,
    strategy: scored.draft.strategy,
    offerText: revised,
    iteration: scored.draft.iteration + 1,
    agentId: "E",
  }
}

// --- Agent H: Approval Gatekeeper ---

export function agentH(scored: ScoredOffer, signalId: string): { final: FinalOffer; item: ApprovalItem } {
  const final: FinalOffer = {
    signalId,
    offerText: scored.draft.offerText,
    score: scored.score,
    iterations: scored.draft.iteration,
    agentId: scored.draft.iteration > 1 ? "G" : "E",
  }
  const item: ApprovalItem = {
    // Random id, not a module counter — a counter resets on restart and
    // collides with approval items already persisted in the store.
    id: `ai-${randomUUID().slice(0, 8)}`,
    signalId,
    finalOffer: final,
    status: "pending",
    createdAt: new Date().toISOString(),
    agentId: "H",
    sent: false,
  }
  return { final, item }
}

// --- Agent I: Approval Monitor (used by action handler, not pipeline) ---

export function agentI(
  item: ApprovalItem,
): WarehouseItem {
  return {
    id: `wi-${item.id}`,
    signalId: item.signalId,
    finalOffer: item.finalOffer,
    approvedAt: new Date().toISOString(),
    qualityScore: item.finalOffer.score,
    agentId: "I",
    sent: false,
  }
}
