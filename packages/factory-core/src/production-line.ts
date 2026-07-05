/**
 * Production Line — an HONEST projection over the current factory state.
 *
 * The factory is synchronous and single-agent per job: one producer builds a
 * whole deliverable in one step. So this is not a fake multi-station pipeline
 * with agents "currently running". It is a derived floor view that answers, for
 * the real state right now: which station a task sits at, who produced it, what
 * went in, what came out, and what the operator should do next.
 *
 * Stations that a synchronous producer folds into a single step are shown
 * truthfully as "skipped" (folded), never as fake work.
 */
import type {
  AgentId,
  AgentProductionTask,
  ClientOrder,
  DailyDigital,
  DailyDigitalDepartment,
  DeliveryPack,
  FactoryState,
  ProductionLineStation,
  ProductionLineView,
  ProductionStationId,
} from "./types.js"
import { getAgent } from "./registry.js"

const STATION_DEFS: { id: ProductionStationId; name: string; agentId: AgentId; purpose: string }[] = [
  { id: "intake", name: "Intake", agentId: "N", purpose: "Read order/training/service context and decide the production path" },
  { id: "research", name: "Research", agentId: "RA", purpose: "Extract context, risks, assumptions, audience, unknowns" },
  { id: "strategy", name: "Strategy", agentId: "SA", purpose: "Define commercial angle, offer logic, client-facing argument" },
  { id: "content", name: "Content", agentId: "MA", purpose: "Draft the actual deliverable sections" },
  { id: "delivery", name: "Delivery", agentId: "DA", purpose: "Turn raw work into a usable client artifact / implementation plan" },
  { id: "qa", name: "QA", agentId: "QAA", purpose: "Check safety, clarity, missing sections, operator risks" },
  { id: "packaging", name: "Packaging", agentId: "N", purpose: "Prepare the delivery pack / warehouse candidate" },
  { id: "operator_review", name: "Operator Review", agentId: "N", purpose: "Human operator: approve, rework, reject, warehouse (God Layer)" },
]

/** Which producing station a department maps to. */
const DEPT_STATION: Record<DailyDigitalDepartment, ProductionStationId> = {
  research: "research",
  sales: "strategy",
  marketing: "content",
  delivery: "delivery",
  qa: "qa",
}

function short(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function agentName(id: AgentId): string {
  try {
    return getAgent(id).name
  } catch {
    return id
  }
}

// ─── Task builders ─────────────────────────────────────────────────────────────

function clientOrderTask(order: ClientOrder, digital: DailyDigital | undefined): AgentProductionTask {
  const station = DEPT_STATION[order.department]
  const agentId = STATION_DEFS.find((s) => s.id === station)!.agentId
  let status: AgentProductionTask["status"]
  let nextStation: ProductionStationId | undefined
  let nextOperatorAction: string
  if (!digital) {
    status = "queued"
    nextStation = station
    nextOperatorAction = "Run cycle to produce this order's deliverable"
  } else if (digital.status === "needs_rework") {
    status = "blocked"
    nextStation = station
    nextOperatorAction = "Run cycle to regenerate the flagged deliverable"
  } else if (digital.status === "draft_ready") {
    status = "waiting_review"
    nextStation = "operator_review"
    nextOperatorAction = "Review client output → Approve to Delivery Pack, Rework, or Reject"
  } else {
    // accepted / warehoused
    status = "completed"
    nextStation = "packaging"
    nextOperatorAction = "Create / advance the delivery pack"
  }
  return {
    id: `plt-order-${order.id}`,
    source: "client",
    station,
    status,
    agentId,
    agentName: agentName(agentId),
    department: order.department,
    title: order.serviceName ? `${order.serviceName} — ${order.clientName}` : `${order.department} — ${order.clientName}`,
    inputSummary: short(order.description),
    outputSummary: digital ? short(digital.title, 120) : "Not produced yet",
    ...(digital ? { outputId: digital.id } : {}),
    orderId: order.id,
    clientName: order.clientName,
    ...(order.serviceName ? { serviceName: order.serviceName } : {}),
    revisionCount: order.revisionCount,
    ...(digital ? { qualityScore: digital.qualityScore } : {}),
    ...(nextStation ? { nextStation } : {}),
    nextOperatorAction,
  }
}

function trainingTask(d: DailyDigital): AgentProductionTask {
  const station = DEPT_STATION[d.department]
  let status: AgentProductionTask["status"]
  let nextOperatorAction: string
  if (d.status === "needs_rework") {
    status = "blocked"
    nextOperatorAction = "Run cycle to regenerate this training draft"
  } else if (d.status === "draft_ready") {
    status = "waiting_review"
    nextOperatorAction = "Accept, Warehouse, Rework, or Reject this training asset"
  } else if (d.status === "rejected") {
    status = "skipped"
    nextOperatorAction = "Rejected — no action needed"
  } else {
    status = "completed"
    nextOperatorAction = d.location === "warehouse" ? "Warehoused — no action needed" : "Accepted — no action needed"
  }
  return {
    id: `plt-train-${d.id}`,
    source: "training",
    station,
    status,
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: short(d.title, 120),
    inputSummary: `Daily training mission — ${d.department}/${d.taskType ?? "task"} (${d.date})`,
    outputSummary: `${d.type} · score ${d.qualityScore}`,
    outputId: d.id,
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    ...(d.status === "draft_ready" ? { nextStation: "operator_review" as ProductionStationId } : {}),
    nextOperatorAction,
  }
}

function reworkTask(d: DailyDigital, order: ClientOrder | undefined): AgentProductionTask {
  const station = DEPT_STATION[d.department]
  return {
    id: `plt-rework-${d.id}`,
    source: "rework",
    station,
    status: "blocked",
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: `Rework: ${short(d.title, 100)}`,
    inputSummary: `Operator feedback: ${short(d.operatorFeedback ?? "(no text)", 120)}`,
    outputSummary: `Awaiting regeneration (currently rev ${d.revisionCount})`,
    outputId: d.id,
    ...(d.orderId ? { orderId: d.orderId } : {}),
    ...(order ? { clientName: order.clientName } : {}),
    ...(order?.serviceName ? { serviceName: order.serviceName } : {}),
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    constraintsApplied: [
      ...(order ? [`Client brief from ${order.clientName}: ${short(order.description, 100)}`] : []),
      ...(d.operatorFeedback ? [d.operatorFeedback] : []),
    ],
    nextStation: station,
    nextOperatorAction: "Run cycle to apply the feedback and regenerate",
  }
}

function packTask(p: DeliveryPack): AgentProductionTask {
  let status: AgentProductionTask["status"]
  let nextStation: ProductionStationId | undefined
  let nextOperatorAction: string
  if (p.status === "draft") {
    status = "ready_for_operator"
    nextStation = "operator_review"
    nextOperatorAction = "Approve the delivery pack on /delivery"
  } else if (p.status === "approved") {
    status = "ready_for_operator"
    nextStation = "operator_review"
    nextOperatorAction = "Warehouse the approved pack → creates a case record"
  } else {
    status = "completed"
    nextOperatorAction = "warehouse_ready — copy the pack and deliver it yourself"
  }
  return {
    id: `plt-pack-${p.id}`,
    source: "delivery_pack",
    station: "packaging",
    status,
    agentId: "N",
    agentName: agentName("N"),
    title: `${p.serviceName} — ${p.clientName}`,
    inputSummary: `Source output ${p.sourceOutputId} (order ${p.orderId})`,
    outputSummary: short(p.executiveSummary, 140),
    outputId: p.sourceOutputId,
    orderId: p.orderId,
    clientName: p.clientName,
    serviceName: p.serviceName,
    packId: p.id,
    revisionCount: p.revisionCount,
    ...(nextStation ? { nextStation } : {}),
    nextOperatorAction,
  }
}

// ─── Station board derivation ──────────────────────────────────────────────────

function stationStatus(id: ProductionStationId, tasks: AgentProductionTask[]): AgentProductionTask["status"] {
  if (tasks.length === 0) {
    // Producer stations with no task, or stations a synchronous producer folds in.
    if (id === "operator_review" || id === "packaging" || id === "intake") return "idle"
    return "idle"
  }
  if (tasks.some((t) => t.status === "blocked")) return "blocked"
  if (tasks.some((t) => t.status === "waiting_review")) return "waiting_review"
  if (tasks.some((t) => t.status === "ready_for_operator")) return "ready_for_operator"
  if (tasks.some((t) => t.status === "queued")) return "queued"
  if (tasks.some((t) => t.status === "completed")) return "completed"
  return "idle"
}

/**
 * Pure projection: derive the whole production floor from a state snapshot.
 * `mode`, `autopilotEnabled`, and `nextOperatorAction` come from the caller
 * (server deriveOps) so the line and the cockpit never disagree.
 */
export function deriveProductionLine(
  state: FactoryState,
  ctx: { mode: ProductionLineView["mode"]; autopilotEnabled: boolean; nextOperatorAction: string; trainingToday: string },
): ProductionLineView {
  const today = new Date().toISOString().slice(0, 10)
  const orderById = new Map(state.orders.map((o) => [o.id, o]))
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]))

  // Client line: one task per order, at its current station.
  const clientLine = [...state.orders]
    .reverse()
    .map((o) => clientOrderTask(o, o.deliverableId ? digitalById.get(o.deliverableId) : undefined))

  // Training line: today's training-only outputs (max shown 5+ if reworked).
  const trainingLine = state.dailyDigitals
    .filter((d) => !d.orderId && d.date === today)
    .map(trainingTask)

  // Rework line: everything flagged needs_rework (training + client).
  const reworkLine = state.dailyDigitals
    .filter((d) => d.status === "needs_rework")
    .map((d) => reworkTask(d, d.orderId ? orderById.get(d.orderId) : undefined))

  // Delivery pack line.
  const deliveryPackLine = [...state.deliveryPacks].reverse().map(packTask)

  // Assemble the station board. Each station collects the tasks currently on it.
  const allTasks = [...clientLine, ...trainingLine, ...reworkLine, ...deliveryPackLine]
  const stations: ProductionLineStation[] = STATION_DEFS.map((def) => {
    let tasks: AgentProductionTask[]
    if (def.id === "operator_review") {
      tasks = allTasks.filter((t) => t.status === "waiting_review" || t.status === "ready_for_operator")
    } else if (def.id === "packaging") {
      tasks = deliveryPackLine
    } else if (def.id === "intake") {
      // Intake completes as soon as any order/training exists this session.
      tasks = clientLine.length + trainingLine.length > 0
        ? [{
            id: "plt-intake",
            source: "client" as const,
            station: "intake" as ProductionStationId,
            status: "completed" as AgentProductionTask["status"],
            agentId: "N" as AgentId,
            agentName: agentName("N"),
            title: "Intake & path decision",
            inputSummary: `${state.orders.length} order(s), ${trainingLine.length} training task(s) today`,
            outputSummary: `Mode ${ctx.mode}; production paths assigned to producer stations`,
            nextOperatorAction: ctx.nextOperatorAction,
          }]
        : []
    } else {
      tasks = allTasks.filter((t) => t.station === def.id)
    }
    const status = stationStatus(def.id, tasks)
    // Producer stations a synchronous run folds in (no task landed here) read
    // "skipped" rather than "idle" when there IS active production elsewhere.
    const producerIds: ProductionStationId[] = ["research", "strategy", "content", "delivery", "qa"]
    const foldedSkip =
      tasks.length === 0 && producerIds.includes(def.id) && allTasks.some((t) => t.source === "client" || t.source === "training")
    const lastTask = tasks[tasks.length - 1]
    // HRAR override: a quarantined producer's station reads "blocked" no matter
    // what sits on it — the integrity guard has cut it off from client work.
    const quarantined = state.integrity.some(
      (r) => r.status === "quarantined" && r.agentId === def.agentId,
    )
    return {
      id: def.id,
      name: def.name,
      agentId: def.agentId,
      purpose: def.purpose,
      status: quarantined ? "blocked" : foldedSkip ? "skipped" : status,
      ...(lastTask ? { lastTask } : {}),
      taskCount: tasks.length,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    mode: ctx.mode,
    autopilotEnabled: ctx.autopilotEnabled,
    safeMode: true,
    trainingToday: ctx.trainingToday,
    activeClientOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production" || o.status === "ready_for_review").length,
    deliveryPacks: {
      draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
      approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
      warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length,
    },
    nextOperatorAction: ctx.nextOperatorAction,
    stations,
    trainingLine,
    clientLine,
    reworkLine,
    deliveryPackLine,
  }
}

export const PRODUCTION_STATIONS = STATION_DEFS
