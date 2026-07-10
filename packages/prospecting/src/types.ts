export type ProspectProfile = {
  id: string
  name: string
  company: string
  role: string
  /** "10-50", "50-200", "1-10", etc. */
  companySize: string
  industry: string
  painPoints: string[]
  notes?: string
}

export type QualificationResult = {
  qualified: boolean
  /** 0..1 composite ICP fit */
  fitScore: number
  reasons: string[]
}

export type LeadBrief = {
  prospect: ProspectProfile
  icp: string
  product: string
  constraints: string[]
  kpis: string[]
}

export type ProspectAgentResult = {
  prospectId: string
  agentId: string
  qualification: QualificationResult
  /** Populated only when qualified; offer text held at the approval gate. */
  offer?: string
  offerScore?: number
  status: "pending_approval" | "blocked" | "disqualified"
  /** Always false — structural approval gate (docs/13). */
  sent: false
}

// --- Real client acquisition loop ---

export type ProspectEvidence = {
  url: string
  summary: string
  observedAt: string
}

export type VerifiedEmailChannel = {
  type: "email"
  address: string
  sourceUrl: string
  verifiedAt: string
}

export type AcquisitionProspectStatus =
  | "researched"
  | "qualified"
  | "outreach_ready"
  | "contacted"
  | "replied"
  | "interested"
  | "not_interested"
  | "client_acquired"
  | "do_not_contact"

export type AcquisitionProspect = {
  id: string
  company: string
  website: string
  country: string
  segment: string
  contactName?: string
  contactRole?: string
  channel?: VerifiedEmailChannel
  painSignals: string[]
  evidence: ProspectEvidence[]
  fitScore: number
  qualificationReasons: string[]
  status: AcquisitionProspectStatus
  outreachSubject?: string
  outreachBody?: string
  providerMessageId?: string
  firstContactAt?: string
  lastContactAt?: string
  replySummary?: string
  clientProof?: string
  clientOrderId?: string
  createdAt: string
  updatedAt: string
}

export type AcquisitionProspectInput = {
  id?: string
  company: string
  website: string
  country: string
  segment: string
  contactName?: string
  contactRole?: string
  email?: string
  emailSourceUrl?: string
  painSignals: string[]
  evidence: Omit<ProspectEvidence, "observedAt">[]
}

export type OutreachMessage = {
  to: string
  subject: string
  body: string
}

export type OutreachSendResult = {
  providerMessageId: string
  sentAt: string
}

export interface OutreachSender {
  send(message: OutreachMessage): Promise<OutreachSendResult>
}
