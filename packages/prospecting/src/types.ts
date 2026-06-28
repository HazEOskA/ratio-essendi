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
