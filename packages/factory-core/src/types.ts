// A–N = Offer Acquisition Line agents; MA/SA/DA/RA/QAA = Daily Mission agents
export type AgentId =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N"
  | "MA" | "SA" | "DA" | "RA" | "QAA"

export type MissionAgentId = "MA" | "SA" | "DA" | "RA" | "QAA"

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

// --- Daily Mission types ---

export type DailyDigitalStatus = "draft_ready" | "accepted" | "needs_rework" | "rejected" | "archived"
export type DailyDigitalLocation = "daily_review" | "warehouse" | "trash"
export type DailyDigitalDepartment = "marketing" | "sales" | "delivery" | "research" | "qa"

export type DailyDigital = {
  id: string
  date: string
  title: string
  department: DailyDigitalDepartment
  type: string
  content: string
  status: DailyDigitalStatus
  qualityScore: number
  createdByAgentId: MissionAgentId
  linkedMissionId: string
  operatorFeedback?: string
  revisionCount: number
  createdAt: string
  updatedAt: string
  location: DailyDigitalLocation
}

export type DailyMission = {
  id: string
  date: string
  department: DailyDigitalDepartment
  taskType: string
  constraints: string[]
  status: "pending" | "complete" | "failed"
  outputId?: string
}

export type FeedbackEvent = {
  id: string
  timestamp: string
  digitalId: string
  department: DailyDigitalDepartment
  action: "accepted" | "needs_rework" | "rejected" | "warehoused"
  feedback?: string
  nextRevisionTaskId?: string
}

// --- Full factory state snapshot ---

export type FactoryState = {
  signals: Signal[]
  leads: QualifiedLead[]
  approvalQueue: ApprovalItem[]
  warehouse: WarehouseItem[]
  trash: TrashItem[]
  events: FactoryEvent[]
  dailyDigitals: DailyDigital[]
  dailyMissions: DailyMission[]
  feedbackEvents: FeedbackEvent[]
}
