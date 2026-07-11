import type { AgentDefinition, AgentId } from "./types.js"

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: "A",
    name: "Signal Intake Officer",
    role: "intake",
    watch: "JobQueue — incoming operator signals",
    trigger: "signal.status === 'queued'",
    nextAction: "Categorise signal, extract ICP signals → produce IntakeBrief",
  },
  {
    id: "B",
    name: "ICP Qualifier",
    role: "qualification",
    watch: "IntakeBriefs — output of Agent A",
    trigger: "new IntakeBrief available",
    nextAction: "Score brief vs ICP dimensions → QualifiedLead or TrashItem",
  },
  {
    id: "C",
    name: "Lead Enricher",
    role: "enrichment",
    watch: "QualifiedLeads where qualified === true",
    trigger: "new qualified lead",
    nextAction: "Add context, buyer persona, pain sharpening → EnrichedLead",
  },
  {
    id: "D",
    name: "Offer Strategist",
    role: "strategy",
    watch: "EnrichedLeads — output of Agent C",
    trigger: "new EnrichedLead available",
    nextAction: "Define ICP statement, positioning, KPIs, constraints → OfferStrategy",
  },
  {
    id: "E",
    name: "Offer Builder",
    role: "offer-builder",
    watch: "OfferStrategies — output of Agent D",
    trigger: "new OfferStrategy available",
    nextAction: "Draft offer text aligned to strategy → DraftOffer",
  },
  {
    id: "F",
    name: "Offer Evaluator",
    role: "evaluation",
    watch: "DraftOffers — output of Agent E or G",
    trigger: "new DraftOffer available",
    nextAction: "Score against KPIs → ScoredOffer (passed or failed)",
  },
  {
    id: "G",
    name: "Offer Editor",
    role: "editing",
    watch: "ScoredOffers where passed === false",
    trigger: "score below threshold (max 1 revision cycle)",
    nextAction: "Strengthen weak KPI dimensions → revised DraftOffer back to Agent F",
  },
  {
    id: "H",
    name: "Approval Gatekeeper",
    role: "approval-gate",
    watch: "ScoredOffers where passed === true",
    trigger: "offer passes evaluation",
    nextAction: "Create ApprovalItem (sent: false), log approval.required → operator decides",
  },
  {
    id: "I",
    name: "Approval Monitor",
    role: "routing",
    watch: "ApprovalQueue — items approved by operator",
    trigger: "item.status === 'approved'",
    nextAction: "Move approved item to Warehouse, log warehouse.received",
  },
  {
    id: "J",
    name: "Succession Watcher",
    role: "succession",
    watch: "All pipeline agents",
    trigger: "agent failure or repeated low scores detected",
    nextAction: "Flag agent for succession, log agent.drift_detected",
  },
  {
    id: "K",
    name: "Lineage Tracker",
    role: "lineage",
    watch: "SuccessionFlags — output of Agent J",
    trigger: "succession flag logged",
    nextAction: "Create succession brief with failure summary and repeatedWeaknesses",
  },
  {
    id: "L",
    name: "Quality Auditor",
    role: "quality",
    watch: "WarehouseItems — approved offers",
    trigger: "new item arrives in Warehouse",
    nextAction: "Score quality, log quality.metric, update scorecard",
  },
  {
    id: "M",
    name: "Performance Reporter",
    role: "reporting",
    watch: "Quality metrics — output of Agent L",
    trigger: "quality.metric logged",
    nextAction: "Aggregate metrics, update performance scorecards, log report.generated",
  },
  {
    id: "N",
    name: "Factory Director",
    role: "direction",
    watch: "All pipeline stages and event log",
    trigger: "drift in any stage or pipeline stall detected",
    nextAction: "Issue correction brief, reset stalled stage, log factory.correction_issued",
  },
  {
    id: "MA",
    name: "Marketing Producer",
    role: "production-marketing",
    watch: "Client orders routed to marketing + daily marketing mission slot",
    trigger: "open order (dept=marketing) or missing marketing training asset for today",
    nextAction: "Generate marketing_asset with client brief / feedback constraints → daily_review",
  },
  {
    id: "SA",
    name: "Sales Producer",
    role: "production-sales",
    watch: "Client orders routed to sales + daily sales mission slot",
    trigger: "open order (dept=sales) or missing sales training asset for today",
    nextAction: "Generate sales_asset with client brief / feedback constraints → daily_review",
  },
  {
    id: "DA",
    name: "Delivery Producer",
    role: "production-delivery",
    watch: "Client orders routed to delivery + daily delivery mission slot",
    trigger: "open order (dept=delivery) or missing delivery training asset for today",
    nextAction: "Generate delivery_asset with client brief / feedback constraints → daily_review",
  },
  {
    id: "RA",
    name: "Research Producer",
    role: "production-research",
    watch: "Client orders routed to research + daily research mission slot",
    trigger: "open order (dept=research) or missing research training asset for today",
    nextAction: "Generate research_asset with client brief / feedback constraints → daily_review",
  },
  {
    id: "QAA",
    name: "QA Producer",
    role: "production-qa",
    watch: "Client orders routed to qa + daily qa mission slot + needs_rework flags",
    trigger: "open order (dept=qa), missing qa training asset for today, or revision job pending",
    nextAction: "Generate qa_asset / regenerate flagged assets with feedback → daily_review",
  },
  {
    id: "LEA",
    name: "Dyrektor Wzrostu (Lead Engine)",
    role: "lead-engine",
    watch: "Lead threads: incoming lead messages + qualification gaps (problem/budżet/decydent)",
    trigger: "new lead message recorded, operator redraft request, or proposal request",
    nextAction: "Draft persona-styled reply/proposal → operator reviews, edits, and sends manually",
  },
]

export function getAgent(id: AgentId): AgentDefinition {
  const agent = AGENT_REGISTRY.find((a) => a.id === id)
  if (!agent) throw new Error(`Agent ${id} not in registry`)
  return agent
}

/** Validates every registered agent has watch, trigger, and nextAction. */
export function validateRegistry(): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  for (const agent of AGENT_REGISTRY) {
    if (!agent.watch.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing watch`)
    if (!agent.trigger.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing trigger`)
    if (!agent.nextAction.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing nextAction`)
  }
  return { ok: errors.length === 0, errors }
}
