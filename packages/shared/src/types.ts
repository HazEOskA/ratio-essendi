/**
 * Ratio Essendi — shared contract types.
 *
 * These types are transcribed exactly from the architecture documents:
 *   - SystemCell           → docs/02_SYSTEM_CELL_CONTRACT.md
 *   - AgentContract        → docs/04_AGENT_CONTRACT.md
 *   - AgentSuccessionBrief → docs/06_AGENT_SUCCESSION_LOOP.md
 *   - DriftEvent           → docs/07_DRIFT_RULE.md
 *   - StrategyExperiment   → docs/10_SANDBOX_AND_STRATEGY_TESTING.md
 *   - SystemEvent          → docs/11_EVENT_LOG_AND_STATE_TRANSITIONS.md
 *   - FailoverPolicy       → docs/12_FAILOVER_AND_SHADOW_CELLS.md
 */

// docs/02_SYSTEM_CELL_CONTRACT.md
export type SystemCell = {
  id: string
  name: string
  domain:
    | "product"
    | "sales"
    | "marketing"
    | "finance"
    | "security"
    | "research"
    | "delivery"
    | "content"
    | "customer_success"

  purpose: string
  coreAgentId?: string
  agents: string[]
  memoryScope: string
  budgetLimit: number
  kpis: string[]

  healthStatus:
    | "healthy"
    | "degraded"
    | "failed"
    | "recovering"
    | "quarantined"

  shadowCellId?: string
  failoverPolicy: string
  activeController: boolean
  createdAt: string
  updatedAt: string
}

// docs/04_AGENT_CONTRACT.md
export type AgentContract = {
  id: string
  name: string
  version: string
  cellId: string

  role: string
  purpose: string
  responsibilities: string[]

  tools: string[]
  memoryScope: string
  budgetLimit: number

  kpis: string[]
  successCriteria: string[]
  failureCriteria: string[]

  boundaries: string[]
  allowedActions: string[]
  forbiddenActions: string[]

  status:
    | "created"
    | "active"
    | "warning"
    | "degraded"
    | "under_review"
    | "succession_required"
    | "disabled"
    | "archived"
    | "replaced"

  lineage: {
    createdFrom?: string
    successorId?: string
    replacementReason?: string
  }

  createdAt: string
  updatedAt: string
}

// docs/06_AGENT_SUCCESSION_LOOP.md
export type AgentSuccessionBrief = {
  failedAgentId: string
  failedAgentVersion: string
  cellId: string

  failureSummary: string
  failureType:
    | "agent_error"
    | "tool_error"
    | "data_error"
    | "goal_error"
    | "operator_error"
    | "market_error"
    | "drift"
    | "boundary_violation"

  repeatedWeaknesses: string[]
  missingTools: string[]
  missingMemory: string[]
  wrongAssumptions: string[]
  badPatterns: string[]

  recommendedSuccessorPrompt: string
  recommendedSuccessorRole: string
  recommendedKpis: string[]
  riskNotes: string[]
  evidence: string[]

  createdAt: string
}

// docs/07_DRIFT_RULE.md
export type DriftEvent = {
  entityId: string
  entityType: "agent" | "cell" | "strategy" | "llm_session"
  detectedAt: string
  driftSignals: string[]
  lastAlignedCheckpoint: string
  action: "input_cutoff" | "archive" | "successor_required" | "shadow_failover"
}

// docs/10_SANDBOX_AND_STRATEGY_TESTING.md
export type StrategyExperiment = {
  id: string
  name: string
  cellId: string
  proposedBy: string

  hypothesis: string
  targetKpi: string
  budgetLimit: number
  riskLevel: "low" | "medium" | "high"

  status:
    | "proposed"
    | "sandbox"
    | "evaluated"
    | "promoted"
    | "rejected"
    | "revised"

  expectedOutcome: string
  actualOutcome?: string
  evaluationSummary?: string
  createdAt: string
  updatedAt: string
}

// docs/11_EVENT_LOG_AND_STATE_TRANSITIONS.md
export type SystemEvent = {
  id: string
  eventType: string
  entityId: string
  entityType: "agent" | "cell" | "strategy" | "system"
  previousState?: string
  nextState?: string
  policy?: string
  reason?: string
  evidence?: string[]
  createdAt: string
}

// docs/12_FAILOVER_AND_SHADOW_CELLS.md
export type FailoverPolicy = {
  cellId: string
  shadowCellId: string
  healthCheckInterval: string
  maxFailureCount: number
  recoveryAttempts: number
  promoteShadowOnFailure: boolean
  quarantineFailedCell: boolean
  requireManualApprovalForExternalActions: boolean
}
