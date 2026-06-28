import {
  resetIds,
  exportIdState,
  importIdState,
  type AgentContract,
  type SystemCell,
  type SystemEvent,
} from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent, selectJudge } from "@ratio-essendi/evaluation-engine"
import { selectOfferProvider, type OfferProvider } from "@ratio-essendi/offer-builder"
import {
  HeuristicQualifier,
  runProspectAgent,
  PROSPECT_POOL,
} from "@ratio-essendi/prospecting"
import { buildSnapshot, type LiveState, type PendingOffer } from "@ratio-essendi/dashboard"
import type { FileStore } from "./store.js"

const KPIS = ["offer", "price", "margin", "call to action"]

/** Everything needed to reconstruct a World after a restart. */
export type WorldSnapshot = {
  version: 1
  cellId: string
  cells: SystemCell[]
  agents: AgentContract[]
  events: SystemEvent[]
  pending: PendingOffer[]
  paused: boolean
  seq: number
  ids: Record<string, number>
}

export type WorldOptions = {
  provider?: OfferProvider
  store?: FileStore<WorldSnapshot>
  snapshot?: WorldSnapshot
}

/**
 * A live, mutable "world" the dashboard drives. State + log persist to a file
 * store after every mutation and are restored on start, so the world survives a
 * server restart. Determinism is preserved by restoring the id counters and the
 * sim sequence, not just the data.
 */
const MAX_PENDING = Number(process.env["MAX_PENDING"] ?? 5)

export class World {
  readonly gov = new MetaGovernor()
  #cellId: string
  #pending: PendingOffer[] = []
  readonly #provider: OfferProvider
  readonly #store?: FileStore<WorldSnapshot>
  #paused = false
  #seq = 0

  constructor(opts: WorldOptions = {}) {
    this.#provider = opts.provider ?? selectOfferProvider().provider
    this.#store = opts.store

    if (opts.snapshot) {
      this.#cellId = opts.snapshot.cellId
      this.#loadSnapshot(opts.snapshot)
    } else {
      resetIds()
      const cell = this.gov.registerCell({
        name: "Sales Factory",
        domain: "sales",
        purpose: "Generate profitable booked calls for the selected ICP.",
        memoryScope: "sales/offers",
        budgetLimit: 1000,
        kpis: KPIS,
      })
      this.#cellId = cell.id
      this.#persist()
    }
  }

  #loadSnapshot(snap: WorldSnapshot): void {
    importIdState(snap.ids)
    this.gov.cells.restore(snap.cells)
    this.gov.agents.restore(snap.agents)
    this.gov.log.restore(snap.events)
    this.#pending = snap.pending.map((p) => ({ ...p }))
    this.#paused = snap.paused
    this.#seq = snap.seq
  }

  toSnapshot(): WorldSnapshot {
    return {
      version: 1,
      cellId: this.#cellId,
      cells: [...this.gov.cells.listCells()],
      agents: [...this.gov.agents.listAgents()],
      events: [...this.gov.log.all()],
      pending: this.#pending.map((p) => ({ ...p })),
      paused: this.#paused,
      seq: this.#seq,
      ids: exportIdState(),
    }
  }

  #persist(): void {
    this.#store?.save(this.toSnapshot())
  }

  setPaused(value: boolean): void {
    this.#paused = value
    this.#persist()
  }

  #register(name: string) {
    return this.gov.registerAndActivateAgent({
      name,
      cellId: this.#cellId,
      role: "offer-builder",
      purpose: "Create profitable, clear offers for the selected ICP.",
      memoryScope: "sales/offers",
      budgetLimit: 200,
      kpis: KPIS,
      successCriteria: KPIS,
      failureCriteria: ["off-topic", "spam", "no price"],
      allowedActions: ["draft offer"],
      forbiddenActions: ["send to client", "publish externally"],
    })
  }

  async spawnOffer(): Promise<void> {
    if (this.#pending.filter((p) => p.status === "pending").length >= MAX_PENDING) return
    this.#seq += 1
    const agent = this.#register(`Offer Builder ${this.#seq}`)
    const offer = await this.#provider.generateOffer({
      icp: "Seed-stage B2B SaaS founders (10-50 employees)",
      product: "Fractional RevOps sprint",
      constraints: ["2-week delivery", "fixed scope"],
      kpis: KPIS,
    })
    const result = evaluateAgent(agent.id, offer, KPIS, this.gov.log)
    if (result.passed) {
      this.gov.log.append({
        eventType: "approval.required",
        entityId: agent.id,
        entityType: "agent",
        nextState: "pending_approval",
        policy: "no-external-action-without-approval",
        reason: "Offer ready; awaiting operator approval (docs/13).",
      })
      this.#pending.push({
        id: `po-${this.#pending.length + 1}`,
        agentId: agent.id,
        agentName: agent.name,
        offer,
        score: result.score,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
    }
    this.#persist()
  }

  injectDrift(): void {
    this.#seq += 1
    const agent = this.#register(`Drifter ${this.#seq}`)
    const result = evaluateAgent(agent.id, "off-topic blast, no targeting, generic spam", KPIS, this.gov.log)
    if (!result.passed) {
      this.gov.detectDrift({
        entityId: agent.id,
        entityType: "agent",
        observedSignals: ["expands scope without permission", "produces output that cannot be validated"],
        lastAlignedCheckpoint: `${agent.name}:init`,
      })
      this.gov.agents.setStatus(agent.id, "succession_required", `Drift detected: ${result.failureReasons.join(", ")}`)
    }
    this.#persist()
  }

  async tick(): Promise<void> {
    if (this.#paused) return
    if (this.#seq % 3 === 2) this.injectDrift()
    else await this.spawnOffer()
  }

  approve(offerId: string): void {
    const po = this.#pending.find((p) => p.id === offerId)
    if (!po || po.status !== "pending") return
    po.status = "approved"
    this.gov.log.append({
      eventType: "approval.granted",
      entityId: po.agentId,
      entityType: "agent",
      previousState: "pending_approval",
      nextState: "approved",
      reason: "Operator approved offer (decision recorded; no external send is wired).",
    })
    this.#persist()
  }

  reject(offerId: string): void {
    const po = this.#pending.find((p) => p.id === offerId)
    if (!po || po.status !== "pending") return
    po.status = "rejected"
    this.gov.agents.setStatus(po.agentId, "under_review", "Operator rejected offer.")
    this.gov.log.append({
      eventType: "approval.rejected",
      entityId: po.agentId,
      entityType: "agent",
      previousState: "pending_approval",
      nextState: "rejected",
      reason: "Operator rejected offer.",
    })
    this.#persist()
  }

  quarantine(agentId: string): void {
    this.gov.agents.setStatus(agentId, "disabled", "Operator quarantined the agent.")
    this.#persist()
  }

  forceSuccession(agentId: string): void {
    const brief = this.gov.requestSuccession({
      failedAgent: this.gov.agents.getAgent(agentId),
      failureType: "drift",
      failureSummary: "Operator forced succession.",
      repeatedWeaknesses: ["operator-flagged drift"],
      evidence: this.gov.log.byEntity(agentId).map((e) => e.eventType),
    })
    this.gov.promoteSuccessor(this.gov.agents.getAgent(agentId), brief)
    this.#persist()
  }

  /**
   * Rank the prospect pool by ICP fit, pick the best uncontacted prospect,
   * run the qualification + offer pipeline, and surface the result in the
   * pending queue for operator approval.
   */
  async findClient(): Promise<void> {
    if (this.#pending.filter((p) => p.status === "pending").length >= MAX_PENDING) return
    const ICP = "Seed-stage B2B SaaS founders (10-50 employees)"
    const qualifier = new HeuristicQualifier()
    const { judge } = selectJudge()

    const contactedIds = this.#pending.map((p) => p.agentName?.split("→ ")[1]?.trim()).filter(Boolean)
    const candidates = PROSPECT_POOL.filter((p) => !contactedIds.includes(p.company))

    if (candidates.length === 0) {
      this.gov.log.append({
        eventType: "prospect.pool_exhausted",
        entityId: this.#cellId,
        entityType: "system",
        reason: "All prospects in the pool have been contacted. Add more to continue.",
      })
      this.#persist()
      return
    }

    const scored = await Promise.all(
      candidates.map(async (p) => ({ p, q: await qualifier.qualify(p, ICP) })),
    )
    scored.sort((a, b) => b.q.fitScore - a.q.fitScore)
    const best = scored[0]!

    const result = await runProspectAgent(
      this.gov,
      this.#cellId,
      {
        prospect: best.p,
        icp: ICP,
        product: "Fractional RevOps sprint",
        constraints: ["2-week delivery", "fixed scope"],
        kpis: KPIS,
      },
      qualifier,
      this.#provider,
      judge,
    )

    if (result.status === "pending_approval" && result.offer) {
      this.#pending.push({
        id: `po-${this.#pending.length + 1}`,
        agentId: result.agentId,
        agentName: `Prospector → ${best.p.company}`,
        offer: result.offer,
        score: result.offerScore ?? 0,
        status: "pending",
        createdAt: new Date().toISOString(),
      })
    }

    this.#persist()
  }

  async action(action: string, id: string): Promise<void> {
    switch (action) {
      case "approve":
        this.approve(id)
        break
      case "reject":
        this.reject(id)
        break
      case "quarantine":
        this.quarantine(id)
        break
      case "succeed":
        this.forceSuccession(id)
        break
      case "pause":
        this.setPaused(true)
        break
      case "resume":
        this.setPaused(false)
        break
      case "tick":
        await this.tick()
        break
      case "findClient":
        await this.findClient()
        break
    }
  }

  state(): LiveState {
    return {
      snapshot: buildSnapshot(this.gov),
      pending: [...this.#pending],
      paused: this.#paused,
      generatedAt: new Date().toISOString(),
    }
  }
}
