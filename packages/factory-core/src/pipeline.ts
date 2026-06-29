/**
 * runFactoryOnce: processes one Signal through the full Offer Acquisition Line (A→H).
 * Every step is logged. Operator approval is required at Agent H — nothing auto-sends.
 * runOfferAcquisitionForSignal: alias for server convenience.
 */
import { randomUUID } from "node:crypto"
import type { Signal, FactoryEvent, PipelineResult, AgentId } from "./types.js"
import { agentA, agentB, agentC, agentD, agentE, agentF, agentG, agentH } from "./agents.js"
import type { FactoryStore } from "./store.js"
import { validateRegistry } from "./registry.js"

function evt(agentId: AgentId, eventType: string, signalId: string, detail: string): FactoryEvent {
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    agentId,
    eventType,
    signalId,
    detail,
  }
}

export async function runFactoryOnce(rawSignal: string, store: FactoryStore): Promise<PipelineResult> {
  const validation = validateRegistry()
  if (!validation.ok) throw new Error(`Registry invalid: ${validation.errors.join("; ")}`)

  const signal: Signal = {
    id: `sig-${randomUUID().slice(0, 8)}`,
    raw: rawSignal,
    submittedAt: new Date().toISOString(),
    status: "queued",
  }
  store.addSignal(signal)

  const events: FactoryEvent[] = []
  const log = (e: FactoryEvent) => { events.push(e); store.addEvent(e) }

  // Agent A — intake
  store.updateSignal(signal.id, { status: "processing" })
  const brief = agentA(signal)
  log(evt("A", "signal.intake_complete", signal.id, `category=${brief.category} icpSignals=${brief.icpSignals.length}`))

  // Agent B — qualification
  const lead = agentB(brief)
  log(evt("B", lead.qualified ? "lead.qualified" : "lead.disqualified", signal.id, `fitScore=${lead.fitScore}`))

  if (!lead.qualified) {
    store.addTrashItem({
      id: `trash-${randomUUID().slice(0, 8)}`,
      signalId: signal.id,
      reason: `Disqualified by Agent B: ${lead.qualificationReasons.slice(-1)[0] ?? "below threshold"}`,
      trashedAt: new Date().toISOString(),
    })
    store.updateSignal(signal.id, { status: "disqualified" })
    return { signal, brief, lead, status: "disqualified", events }
  }
  store.addLead(lead)

  // Agent C — enrichment
  const enriched = agentC(lead)
  log(evt("C", "lead.enriched", signal.id, `buyer=${enriched.targetBuyer}`))

  // Agent D — strategy
  const strategy = agentD(enriched)
  log(evt("D", "offer.strategy_set", signal.id, `positioning=${strategy.positioning.slice(0, 50)}`))

  // Agent E — draft
  const draft = agentE(strategy, 1)
  log(evt("E", "offer.drafted", signal.id, `iteration=1 length=${draft.offerText.length}`))

  // Agent F — evaluate
  let scored = agentF(draft)
  log(evt("F", scored.passed ? "offer.passed" : "offer.failed_eval", signal.id, `score=${scored.score}`))

  // Agent G — edit once if failed
  if (!scored.passed) {
    const revised = agentG(scored)
    log(evt("G", "offer.revised", signal.id, `iteration=${revised.iteration} failedKPIs=${scored.failureReasons.join(",")}`))
    const rescored = agentF(revised)
    log(evt("F", rescored.passed ? "offer.passed" : "offer.failed_after_edit", signal.id, `score=${rescored.score}`))

    if (!rescored.passed) {
      store.addTrashItem({
        id: `trash-${randomUUID().slice(0, 8)}`,
        signalId: signal.id,
        reason: `Offer failed evaluation after edit: ${rescored.failureReasons.join(", ")}`,
        trashedAt: new Date().toISOString(),
      })
      store.updateSignal(signal.id, { status: "failed" })
      return { signal, brief, lead, enriched, strategy, draft, scored: rescored, status: "failed", events }
    }
    scored = rescored
  }

  // Agent H — approval gate
  const { final, item } = agentH(scored, signal.id)
  store.addApprovalItem(item)
  store.updateSignal(signal.id, { status: "processed" })
  log(evt("H", "approval.required", signal.id, `approvalId=${item.id} score=${final.score}`))

  return { signal, brief, lead, enriched, strategy, draft, scored, final, approval: item, status: "awaiting_approval", events }
}

/** Alias used by the server and tests — same semantics as runFactoryOnce. */
export async function runOfferAcquisitionForSignal(rawSignal: string, store: FactoryStore): Promise<PipelineResult> {
  return runFactoryOnce(rawSignal, store)
}
