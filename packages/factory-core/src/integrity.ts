/**
 * Agent Integrity — the factory wiring for the Pinocchio monitor + HRAR protocol.
 *
 * Signals are REAL, not simulated: the nose grows when the operator rejects
 * (+25) or sends work back for rework (+12), and when produced quality drifts
 * below the expected baseline (DriftSensor z-score, capped +15). It shrinks
 * when the operator accepts or warehouses (−10). Lying, in factory terms,
 * is producing work the operator keeps refusing.
 *
 * At nose ≥ 80 the HarakiriProtocol executes with a cleanup callback that
 * QUARANTINES the agent — it may keep training (safe, internal) but is cut off
 * from client production until the operator resets it. No process.exit here:
 * killing the whole cockpit over one drifted agent would be the single point
 * of failure forbidden by decision 011. The reset is an explicit operator
 * action — the God Layer decides about resurrection, never the system.
 */
import { randomUUID } from "node:crypto"
import { DriftSensor, PinocchioNose, HarakiriProtocol } from "@ratio-essendi/integrity-guard"
import type { AgentIntegrityRecord, MissionAgentId } from "./types.js"
import type { FactoryStore } from "./store.js"

export const INTEGRITY_LIMITS = {
  critical: 80, // nose ≥ 80 → HRAR (quarantine)
  watch: 40, // nose ≥ 40 → watch status
  growRejected: 25,
  growRework: 12,
  growQualityCap: 15,
  shrinkAccepted: 10,
} as const

/** Expected quality band for accepted factory output (see scoreContent). */
const QUALITY_BASELINE = [0.8, 0.85, 0.9, 0.85, 0.8] as const
const qualitySensor = new DriftSensor(QUALITY_BASELINE)

export const PRODUCER_AGENTS: readonly MissionAgentId[] = ["MA", "SA", "DA", "RA", "QAA"]

function freshRecord(agentId: MissionAgentId): AgentIntegrityRecord {
  return { agentId, noseLength: 0, status: "healthy", breaches: 0, updatedAt: new Date().toISOString() }
}

export function getIntegrityRecords(store: FactoryStore): AgentIntegrityRecord[] {
  return PRODUCER_AGENTS.map((id) => store.getIntegrityRecord(id) ?? freshRecord(id))
}

export function isAgentQuarantined(store: FactoryStore, agentId: MissionAgentId): boolean {
  return store.getIntegrityRecord(agentId)?.status === "quarantined"
}

function statusFor(nose: PinocchioNose, wasQuarantined: boolean): AgentIntegrityRecord["status"] {
  if (wasQuarantined) return "quarantined" // only an operator reset lifts it
  if (nose.isBreached()) return "quarantined"
  if (nose.noseLength >= INTEGRITY_LIMITS.watch) return "watch"
  return "healthy"
}

async function applyDelta(
  store: FactoryStore,
  agentId: MissionAgentId,
  deltaCm: number,
  signal: string,
): Promise<AgentIntegrityRecord> {
  const prev = store.getIntegrityRecord(agentId) ?? freshRecord(agentId)
  const nose = new PinocchioNose({
    criticalLimit: INTEGRITY_LIMITS.critical,
    initialLength: prev.noseLength,
  })
  if (deltaCm >= 0) nose.grow(deltaCm)
  else nose.shrink(-deltaCm)

  const wasQuarantined = prev.status === "quarantined"
  const breachedNow = !wasQuarantined && nose.isBreached()
  const next: AgentIntegrityRecord = {
    agentId,
    noseLength: nose.noseLength,
    status: statusFor(nose, wasQuarantined),
    breaches: prev.breaches + (breachedNow ? 1 : 0),
    lastSignal: signal,
    updatedAt: new Date().toISOString(),
  }
  store.upsertIntegrityRecord(next)

  if (breachedNow) {
    // HRAR: the executor runs the quarantine cleanup and reports. exitProcess
    // stays OFF — the factory amputates the agent, never the whole cockpit.
    const protocol = new HarakiriProtocol({
      cleanup: () => {
        store.addEvent({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          agentId,
          eventType: "integrity.harakiri",
          detail: `HRAR: nose ${nose.noseLength}cm ≥ ${INTEGRITY_LIMITS.critical} — ${agentId} quarantined from client production (training still allowed). Cause: ${signal}. Operator reset required.`,
        })
      },
      exitProcess: false,
    })
    await protocol.execute(nose.noseLength)
  }
  return next
}

/** Operator decisions are the primary truth signal. */
export async function recordOperatorIntegritySignal(
  store: FactoryStore,
  agentId: MissionAgentId,
  action: "accepted" | "needs_rework" | "rejected" | "warehoused",
  itemId: string,
): Promise<AgentIntegrityRecord> {
  const delta =
    action === "rejected"
      ? INTEGRITY_LIMITS.growRejected
      : action === "needs_rework"
        ? INTEGRITY_LIMITS.growRework
        : -INTEGRITY_LIMITS.shrinkAccepted
  return applyDelta(store, agentId, delta, `operator ${action} on ${itemId}`)
}

/** Quality drift below baseline also grows the nose (never punish being better). */
export async function recordQualityIntegritySignal(
  store: FactoryStore,
  agentId: MissionAgentId,
  qualityScore: number,
  itemId: string,
): Promise<AgentIntegrityRecord | undefined> {
  if (qualityScore >= qualitySensor.baselineMean) return undefined
  const drift = qualitySensor.calculateDrift([qualityScore])
  const grow = Math.min(INTEGRITY_LIMITS.growQualityCap, Math.round(drift * 2))
  if (grow <= 0) return undefined
  return applyDelta(store, agentId, grow, `quality ${qualityScore} below baseline on ${itemId} (drift ${drift.toFixed(1)})`)
}

/** God Layer: only an explicit operator action resurrects a quarantined agent. */
export function resetAgentIntegrity(store: FactoryStore, agentId: MissionAgentId): boolean {
  const prev = store.getIntegrityRecord(agentId)
  if (!prev || (prev.noseLength === 0 && prev.status === "healthy")) return false
  store.upsertIntegrityRecord({
    agentId,
    noseLength: 0,
    status: "healthy",
    breaches: prev.breaches,
    lastSignal: "operator reset",
    updatedAt: new Date().toISOString(),
  })
  store.addEvent({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    agentId,
    eventType: "integrity.reset",
    detail: `Operator reset ${agentId} integrity (was ${prev.status}, nose ${prev.noseLength}cm). Client production re-enabled.`,
  })
  return true
}
