import type { SystemEvent } from "@ratio-essendi/shared"
import { resetIds } from "@ratio-essendi/shared"
import { MetaGovernor } from "@ratio-essendi/meta-governor"
import { evaluateAgent } from "@ratio-essendi/evaluation-engine"

/**
 * Factory Season — value demonstration.
 *
 * The thesis of Ratio Essendi (docs/00, docs/09): the system creates value by
 * making every value-producer measurable and replaceable. Here a Sales Factory
 * cell runs a season of agents; weak producers are detected against KPIs and
 * auto-replaced via succession; we then quantify the uplift in a
 * revenue-relevant metric — every decision recorded in ONE log.
 *
 * No money is spent and no external action is taken: outputs are simulated,
 * and the dollar figure is an explicit model assumption for the scorecard.
 */

/** Modeled assumption (USD), scorecard only — not real revenue. */
export const VALUE_PER_QUALIFIED_LEAD = 400

const KPIS = ["clear offer", "margin", "booked demo"]

type AgentSpec = {
  name: string
  initialOutput: string
  improvedOutput: string
}

const SEASON: AgentSpec[] = [
  {
    name: "Generic Blaster",
    initialOutput: "off-topic mass blast, no targeting",
    improvedOutput: "clear offer for the ICP with margin and a booked demo",
  },
  {
    name: "Margin Misser",
    initialOutput: "clear offer but no pricing and no demo",
    improvedOutput: "clear offer with a healthy margin and a booked demo",
  },
  {
    name: "Solid Closer",
    initialOutput: "clear offer, strong margin, booked demo",
    improvedOutput: "clear offer, strong margin, booked demo",
  },
]

export type Metrics = {
  evaluated: number
  passed: number
  passRate: number
  qualifiedLeads: number
  modeledValue: number
}

export type FactoryRow = {
  agent: string
  initialScore: number
  finalScore: number
  replacedBy?: string
}

export type FactoryReport = {
  before: Metrics
  after: Metrics
  replaced: number
  upliftPct: number
  rows: FactoryRow[]
  events: readonly SystemEvent[]
  invariants: { ok: boolean; problems: string[] }
}

function metrics(evaluated: number, passed: number): Metrics {
  const passRate = evaluated === 0 ? 0 : Math.round((passed / evaluated) * 100) / 100
  return {
    evaluated,
    passed,
    passRate,
    qualifiedLeads: passed,
    modeledValue: passed * VALUE_PER_QUALIFIED_LEAD,
  }
}

export function runFactorySeason(): FactoryReport {
  resetIds()
  const gov = new MetaGovernor()

  const cell = gov.registerCell({
    name: "Sales Factory",
    domain: "sales",
    purpose: "Generate profitable booked calls for the selected ICP.",
    memoryScope: "sales/offers",
    budgetLimit: 1000,
    kpis: KPIS,
  })

  let initialPass = 0
  let finalPass = 0
  let replaced = 0
  const rows: FactoryRow[] = []

  for (const spec of SEASON) {
    const agent = gov.registerAndActivateAgent({
      name: spec.name,
      cellId: cell.id,
      role: "offer-builder",
      purpose: "Create profitable, clear offers for the selected ICP.",
      memoryScope: "sales/offers",
      budgetLimit: 200,
      kpis: KPIS,
      successCriteria: KPIS,
      failureCriteria: ["off-topic", "no pricing", "no demo", "spam"],
      allowedActions: ["draft offer", "research market"],
      forbiddenActions: ["send to client", "spend over budget"],
    })

    // Evaluate the agent's first output against its KPIs (writes to the gov log).
    const first = evaluateAgent(agent.id, spec.initialOutput, KPIS, gov.log)
    if (first.passed) initialPass += 1

    let finalScore = first.score
    let replacedBy: string | undefined

    if (!first.passed) {
      // Weak value-producer → drift → succession → better-aligned successor.
      gov.detectDrift({
        entityId: agent.id,
        entityType: "agent",
        observedSignals: ["output below KPI threshold", ...first.failureReasons],
        lastAlignedCheckpoint: `${spec.name}:init`,
      })
      const brief = gov.requestSuccession({
        failedAgent: gov.agents.getAgent(agent.id),
        failureType: "agent_error",
        failureSummary: `Weak output: ${first.failureReasons.join(", ")}`,
        repeatedWeaknesses: first.failureReasons,
        evidence: gov.log.byEntity(agent.id).map((e) => e.eventType),
      })
      const successor = gov.promoteSuccessor(gov.agents.getAgent(agent.id), brief)
      replaced += 1
      replacedBy = successor.id

      const second = evaluateAgent(successor.id, spec.improvedOutput, KPIS, gov.log)
      finalScore = second.score
      if (second.passed) finalPass += 1
    } else {
      finalPass += 1
    }

    rows.push({ agent: spec.name, initialScore: first.score, finalScore, replacedBy })
  }

  const n = SEASON.length
  const before = metrics(n, initialPass)
  const after = metrics(n, finalPass)
  const upliftPct =
    before.modeledValue === 0
      ? after.modeledValue > 0
        ? 100
        : 0
      : Math.round(((after.modeledValue - before.modeledValue) / before.modeledValue) * 100)

  return {
    before,
    after,
    replaced,
    upliftPct,
    rows,
    events: gov.log.all(),
    invariants: gov.invariants(),
  }
}
