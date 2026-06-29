export type AgentId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N"

// --- Pipeline data types ---

export type Signal = {
  id: string
  raw: string
  submittedAt: string
  status: "queued" | "processing" | "processed" | "disqualified" | "failed"
}

export type IntakeBrief = {
  signalId: string
  category: string
  icpSignals: string[]
  enrichedContext: string
  agentId: "A"
}

export type QualifiedLead = {
  signalId: string
  brief: IntakeBrief
  fitScore: number
  qualified: boolean
  qualificationReasons: string[]
  agentId: "B"
}

export type EnrichedLead = {
  signalId: string
  lead: QualifiedLead
  enrichedNotes: string
  targetBuyer: string
  agentId: "C"
}

export type OfferStrategy = {
  signalId: string
  enrichedLead: EnrichedLead
  icp: string
  positioning: string
  kpis: string[]
  constraints: string[]
  agentId: "D"
}

export type DraftOffer = {
  signalId: string
  strategy: OfferStrategy
  offerText: string
  iteration: number
  agentId: "E"
}

export type ScoredOffer = {
  signalId: string
  draft: DraftOffer
  score: number
  passed: boolean
  failureReasons: string[]
  agentId: "F"
}

export type FinalOffer = {
  signalId: string
  offerText: string
  score: number
  iterations: number
  agentId: "G" | "E"
}

export type ApprovalItem = {
  id: string
  signalId: string
  finalOffer: FinalOffer
  status: "pending" | "approved" | "rejected"
  createdAt: string
  decidedAt?: string
  agentId: "H"
  sent: false
}

export type WarehouseItem = {
  id: string
  signalId: string
  finalOffer: FinalOffer
  approvedAt: string
  qualityScore: number
  agentId: "I"
  sent: false
}

export type TrashItem = {
  id: string
  signalId: string
  reason: string
  trashedAt: string
}

export type FactoryEvent = {
  id: string
  timestamp: string
  agentId: AgentId
  eventType: string
  signalId?: string
  detail: string
}

// --- Agent definition: every agent MUST have watch + trigger + nextAction ---

export type AgentDefinition = {
  id: AgentId
  name: string
  role: string
  watch: string
  trigger: string
  nextAction: string
}

// --- Pipeline result ---

export type PipelineResult = {
  signal: Signal
  brief?: IntakeBrief
  lead?: QualifiedLead
  enriched?: EnrichedLead
  strategy?: OfferStrategy
  draft?: DraftOffer
  scored?: ScoredOffer
  final?: FinalOffer
  approval?: ApprovalItem
  status: "awaiting_approval" | "disqualified" | "failed"
  events: FactoryEvent[]
}

// --- Full factory state snapshot ---

export type FactoryState = {
  signals: Signal[]
  leads: QualifiedLead[]
  approvalQueue: ApprovalItem[]
  warehouse: WarehouseItem[]
  trash: TrashItem[]
  events: FactoryEvent[]
}
