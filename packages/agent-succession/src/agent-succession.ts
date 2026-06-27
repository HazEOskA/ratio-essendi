import type {
  AgentContract,
  AgentSuccessionBrief,
  DriftEvent,
} from "@ratio-essendi/shared"
import { newId, nowIso } from "@ratio-essendi/shared"

export type DriftInput = {
  entityId: string
  entityType: DriftEvent["entityType"]
  observedSignals: string[]
  lastAlignedCheckpoint: string
  threshold?: number
}

/**
 * Drift = disconnection (docs/07). When observed signals cross the threshold,
 * the entity loses input and a successor is required.
 */
export function detectDrift(input: DriftInput): DriftEvent | null {
  const threshold = input.threshold ?? 1
  if (input.observedSignals.length < threshold) return null
  return {
    entityId: input.entityId,
    entityType: input.entityType,
    detectedAt: nowIso(),
    driftSignals: input.observedSignals,
    lastAlignedCheckpoint: input.lastAlignedCheckpoint,
    action: "successor_required",
  }
}

export type SuccessionInput = {
  failedAgent: AgentContract
  failureType: AgentSuccessionBrief["failureType"]
  failureSummary: string
  repeatedWeaknesses: string[]
  evidence: string[]
}

/** A failed agent passes forward what it learned before replacement (docs/06). */
export function createSuccessionBrief(input: SuccessionInput): AgentSuccessionBrief {
  const a = input.failedAgent
  return {
    failedAgentId: a.id,
    failedAgentVersion: a.version,
    cellId: a.cellId,
    failureSummary: input.failureSummary,
    failureType: input.failureType,
    repeatedWeaknesses: input.repeatedWeaknesses,
    missingTools: [],
    missingMemory: [],
    wrongAssumptions: [],
    badPatterns: input.repeatedWeaknesses,
    recommendedSuccessorPrompt: `Improve on: ${input.repeatedWeaknesses.join("; ")}`,
    recommendedSuccessorRole: a.role,
    recommendedKpis: a.kpis,
    riskNotes: [],
    evidence: input.evidence,
    createdAt: nowIso(),
  }
}

/** Build a better-aligned successor candidate with preserved lineage (docs/06). */
export function createSuccessorCandidate(
  failedAgent: AgentContract,
  brief: AgentSuccessionBrief,
): AgentContract {
  const timestamp = nowIso()
  return {
    ...failedAgent,
    id: newId("agent"),
    version: nextVersion(failedAgent.version),
    status: "created",
    kpis: brief.recommendedKpis,
    lineage: {
      createdFrom: failedAgent.id,
      replacementReason: brief.failureSummary,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function nextVersion(version: string): string {
  const match = /^v(\d+)$/.exec(version)
  if (!match) return `${version}-successor`
  return `v${Number(match[1]) + 1}`
}
