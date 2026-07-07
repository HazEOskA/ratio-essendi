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
  { id: "intake", name: "Przyjęcie", agentId: "N", purpose: "Odczytuje kontekst zlecenia/treningu/usługi i wybiera ścieżkę produkcji" },
  { id: "research", name: "Badania", agentId: "RA", purpose: "Wyodrębnia kontekst, ryzyka, założenia, odbiorców, niewiadome" },
  { id: "strategy", name: "Strategia", agentId: "SA", purpose: "Definiuje kąt komercyjny, logikę oferty, argument dla klienta" },
  { id: "content", name: "Treść", agentId: "MA", purpose: "Tworzy szkic właściwych sekcji deliverabla" },
  { id: "delivery", name: "Realizacja", agentId: "DA", purpose: "Zamienia surową pracę w użyteczny artefakt dla klienta / plan wdrożenia" },
  { id: "qa", name: "QA", agentId: "QAA", purpose: "Sprawdza bezpieczeństwo, jasność, brakujące sekcje, ryzyka operatora" },
  { id: "packaging", name: "Pakowanie", agentId: "N", purpose: "Przygotowuje pakiet dostawy / kandydata do magazynu" },
  { id: "operator_review", name: "Przegląd Operatora", agentId: "N", purpose: "Człowiek-operator: zatwierdza, poprawia, odrzuca, magazynuje (God Layer)" },
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
    nextOperatorAction = "Uruchom cykl, by wyprodukować deliverable tego zlecenia"
  } else if (digital.status === "needs_rework") {
    status = "blocked"
    nextStation = station
    nextOperatorAction = "Uruchom cykl, by odtworzyć oznaczony deliverable"
  } else if (digital.status === "draft_ready") {
    status = "waiting_review"
    nextStation = "operator_review"
    nextOperatorAction = "Przejrzyj wynik klienta → Zatwierdź do Pakietu Dostawy, Popraw lub Odrzuć"
  } else {
    // accepted / warehoused
    status = "completed"
    nextStation = "packaging"
    nextOperatorAction = "Utwórz / przenieś dalej pakiet dostawy"
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
    outputSummary: digital ? short(digital.title, 120) : "Jeszcze nie wyprodukowano",
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
    nextOperatorAction = "Uruchom cykl, by odtworzyć ten szkic treningowy"
  } else if (d.status === "draft_ready") {
    status = "waiting_review"
    nextOperatorAction = "Zaakceptuj, Zmagazynuj, Popraw lub Odrzuć ten zasób treningowy"
  } else if (d.status === "rejected") {
    status = "skipped"
    nextOperatorAction = "Odrzucono — nie wymaga akcji"
  } else {
    status = "completed"
    nextOperatorAction = d.location === "warehouse" ? "Zmagazynowano — nie wymaga akcji" : "Zaakceptowano — nie wymaga akcji"
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
    inputSummary: `Dzienna misja treningowa — ${d.department}/${d.taskType ?? "task"} (${d.date})`,
    outputSummary: `${d.type} · wynik ${d.qualityScore}`,
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
    title: `Poprawka: ${short(d.title, 100)}`,
    inputSummary: `Feedback operatora: ${short(d.operatorFeedback ?? "(brak tekstu)", 120)}`,
    outputSummary: `Oczekuje na odtworzenie (obecnie rev ${d.revisionCount})`,
    outputId: d.id,
    ...(d.orderId ? { orderId: d.orderId } : {}),
    ...(order ? { clientName: order.clientName } : {}),
    ...(order?.serviceName ? { serviceName: order.serviceName } : {}),
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    constraintsApplied: [
      ...(order ? [`Brief klienta od ${order.clientName}: ${short(order.description, 100)}`] : []),
      ...(d.operatorFeedback ? [d.operatorFeedback] : []),
    ],
    nextStation: station,
    nextOperatorAction: "Uruchom cykl, by zastosować feedback i odtworzyć",
  }
}

function packTask(p: DeliveryPack): AgentProductionTask {
  let status: AgentProductionTask["status"]
  let nextStation: ProductionStationId | undefined
  let nextOperatorAction: string
  if (p.status === "draft") {
    status = "ready_for_operator"
    nextStation = "operator_review"
    nextOperatorAction = "Zatwierdź pakiet dostawy na /delivery"
  } else if (p.status === "approved") {
    status = "ready_for_operator"
    nextStation = "operator_review"
    nextOperatorAction = "Zmagazynuj zatwierdzony pakiet → tworzy kartę sprawy"
  } else {
    status = "completed"
    nextOperatorAction = "gotowe do magazynu — skopiuj pakiet i dostarcz go samodzielnie"
  }
  return {
    id: `plt-pack-${p.id}`,
    source: "delivery_pack",
    station: "packaging",
    status,
    agentId: "N",
    agentName: agentName("N"),
    title: `${p.serviceName} — ${p.clientName}`,
    inputSummary: `Wyjście źródłowe ${p.sourceOutputId} (zlecenie ${p.orderId})`,
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
            title: "Przyjęcie i wybór ścieżki",
            inputSummary: `Zlecenia: ${state.orders.length}, zadania treningowe dziś: ${trainingLine.length}`,
            outputSummary: `Tryb ${ctx.mode}; ścieżki produkcji przypisane do stacji producentów`,
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
