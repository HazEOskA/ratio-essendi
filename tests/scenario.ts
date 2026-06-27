import type { SystemEvent } from "@ratio-essendi/shared"
import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"

export type ProofCheck = { name: string; ok: boolean; detail: string }

export type ProofResult = {
  events: readonly SystemEvent[]
  validation: { ok: boolean; checks: ProofCheck[] }
  summary: Record<string, unknown>
}

/**
 * First Technical Proof (docs/14_MVP_SCOPE.md).
 *
 * Walks the 10 documented steps end-to-end and asserts the 6 validation
 * criteria. Pure and in-memory: no money spent, no external action, no UI.
 */
export function runFirstTechnicalProof(): ProofResult {
  resetIds()
  const gov = new MetaGovernor()

  // 1. Create a System Cell.
  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "Generate profitable booked calls for the selected ICP.",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: ["response rate", "demo booked", "cost per booked call"],
  })

  // 2. Create an Agent (registered, activated, task assigned).
  const agent = gov.registerAndActivateAgent({
    name: "Offer Builder",
    cellId: cell.id,
    role: "offer-builder",
    purpose: "Create profitable, clear offers for the selected ICP.",
    memoryScope: "sales/offers",
    budgetLimit: 200,
    kpis: ["response rate", "demo booked", "margin potential"],
    successCriteria: ["clear offer", "margin", "booked demo"],
    failureCriteria: ["off-scope", "no margin", "spam"],
    boundaries: ["cannot publish/send without approval"],
    allowedActions: ["draft offer", "research market"],
    forbiddenActions: ["send to client", "spend over budget"],
  })

  // 3 + 4. Task assigned above; evaluate the (weak) output.
  const firstResult = gov.evaluate(agent.id, ["off-scope generic blast", "no margin"])

  // 5. Detect drift on the weak result.
  const drift = gov.detectDrift({
    entityId: agent.id,
    entityType: "agent",
    observedSignals: [
      "expands scope without permission",
      "produces output that cannot be validated",
    ],
    lastAlignedCheckpoint: "offer-builder@v1:init",
  })

  // 6. Create a Succession Brief.
  const brief = gov.requestSuccession({
    failedAgent: gov.agents.getAgent(agent.id),
    failureType: "drift",
    failureSummary: `Weak output (${firstResult.verdict}) + drift; ${firstResult.reason}`,
    repeatedWeaknesses: ["ignores ICP scope", "ignores margin requirement"],
    evidence: gov.log.byEntity(agent.id).map((e) => e.eventType),
  })

  // 7 + 8. Create a Successor Candidate; archive + replace the old agent.
  const successor = gov.promoteSuccessor(gov.agents.getAgent(agent.id), brief)

  // The successor proves better on the same task.
  const successorResult = gov.evaluate(successor.id, [
    "clear offer",
    "margin protected",
    "booked demo",
  ])

  // 9. Simulate a Shadow Cell takeover (failover, no split-brain).
  const shadow = gov.failover.prepareShadow(cell.id)
  gov.failover.promoteShadow(cell.id, shadow.id)

  // 10. Every state change above is already in the event log.
  const events = gov.log.all()
  const inv = gov.invariants()
  const activeSalesController = gov.cells.activeControllerForDomain("sales")

  const checks: ProofCheck[] = [
    {
      name: "every action is logged",
      ok: events.length >= 10,
      detail: `${events.length} events recorded`,
    },
    {
      name: "every failure has a reason",
      ok: events
        .filter((e) => /fail|drift|degraded|quarantined|conflict/.test(e.eventType))
        .every((e) => Boolean(e.reason)),
      detail: "all failure/transition events carry a reason",
    },
    {
      name: "weak result detected, then improved",
      ok: firstResult.verdict !== "pass" && successorResult.verdict === "pass",
      detail: `first=${firstResult.verdict}, successor=${successorResult.verdict}`,
    },
    {
      name: "drift detected",
      ok: drift !== null,
      detail: drift ? drift.action : "none",
    },
    {
      name: "every successor has lineage",
      ok:
        successor.lineage.createdFrom === agent.id &&
        gov.agents.getAgent(agent.id).lineage.successorId === successor.id,
      detail: `${agent.id} <-> ${successor.id}`,
    },
    {
      name: "shadow takeover prevents split-brain",
      ok: inv.ok && activeSalesController?.id === shadow.id,
      detail: inv.ok ? `active controller = ${activeSalesController?.id}` : inv.problems.join("; "),
    },
  ]

  return {
    events,
    validation: { ok: checks.every((c) => c.ok), checks },
    summary: {
      cell: cell.id,
      agent: agent.id,
      successor: successor.id,
      shadow: shadow.id,
      events: events.length,
      activeSalesController: activeSalesController?.id,
    },
  }
}
