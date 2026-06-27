import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent } from "@ratio-essendi/evaluation-engine"
import { StubOfferProvider, type OfferProvider } from "@ratio-essendi/offer-builder"
import { buildSnapshot, type LiveState, type PendingOffer } from "@ratio-essendi/dashboard"

const KPIS = ["offer", "price", "margin", "call to action"]

/**
 * A live, mutable "world" the dashboard drives: a MetaGovernor plus pending
 * offers. tick() generates activity (offers and the occasional drifter); the
 * operator actions are real lifecycle changes. Nothing is ever sent externally.
 */
export class World {
  readonly gov = new MetaGovernor()
  readonly #cellId: string
  readonly #pending: PendingOffer[] = []
  readonly #provider: OfferProvider
  #paused = false
  #seq = 0

  constructor(provider: OfferProvider = new StubOfferProvider()) {
    resetIds()
    this.#provider = provider
    const cell = this.gov.registerCell({
      name: "Sales Factory",
      domain: "sales",
      purpose: "Generate profitable booked calls for the selected ICP.",
      memoryScope: "sales/offers",
      budgetLimit: 1000,
      kpis: KPIS,
    })
    this.#cellId = cell.id
  }

  setPaused(value: boolean): void {
    this.#paused = value
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
  }

  quarantine(agentId: string): void {
    this.gov.agents.setStatus(agentId, "disabled", "Operator quarantined the agent.")
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
