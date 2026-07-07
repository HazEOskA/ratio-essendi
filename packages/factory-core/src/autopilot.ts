/**
 * Autonomous factory cycle — the arbitration loop.
 *
 * Priority order on every cycle:
 *   1. CLIENT WORK  — produce deliverables for every open client order
 *   2. REWORK       — execute pending revision jobs (operator feedback applied)
 *   3. TRAINING     — if no open client orders: ensure today's 5 random
 *                     training missions exist (NO_CLIENT_TRAINING_MODE)
 *
 * Every operation is idempotent and bounded:
 *   - orders are produced once (status gate),
 *   - reworks only run on operator-flagged items,
 *   - training is capped at 5 per day.
 * The cycle can therefore run on a timer without ever spamming queues, and
 * every output still stops at the operator review gate. Nothing auto-sends.
 */
import { randomUUID } from "node:crypto"
import type {
  AgentId,
  AgentWorkStep,
  CycleResult,
  DailyDigitalDepartment,
  FactoryMode,
  FactoryWorkRunTrigger,
} from "./types.js"
import type { FactoryStore } from "./store.js"
import { produceOrderDeliverable } from "./orders.js"
import { DEPT_AGENT, runDailyMissions, regenerateDigital } from "./missions.js"
import { getAgent } from "./registry.js"
import { isAgentQuarantined } from "./integrity.js"

type StepInput = {
  agentId: AgentId
  department?: DailyDigitalDepartment
  jobType: string
  status?: AgentWorkStep["status"]
  inputSummary: string
  outputSummary?: string
  outputId?: string
  constraintsApplied?: string[]
  startedAt?: string
}

function short(text: string, max = 140): string {
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function completedStep(input: StepInput): AgentWorkStep {
  const startedAt = input.startedAt ?? new Date().toISOString()
  const finishedAt = new Date().toISOString()
  const agent = getAgent(input.agentId)
  return {
    id: `aws-${randomUUID().slice(0, 8)}`,
    agentId: input.agentId,
    agentName: agent.name,
    ...(input.department ? { department: input.department } : {}),
    jobType: input.jobType,
    status: input.status ?? "completed",
    inputSummary: input.inputSummary,
    ...(input.outputSummary ? { outputSummary: input.outputSummary } : {}),
    ...(input.outputId ? { outputId: input.outputId } : {}),
    startedAt,
    finishedAt,
    ...(input.constraintsApplied && input.constraintsApplied.length > 0 ? { constraintsApplied: input.constraintsApplied } : {}),
  }
}

function nextOperatorAction(store: FactoryStore): string {
  const state = store.snapshot()
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review")
  if (readyOrders.length > 0) return "Przejrzyj zlecenie klienta"

  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework")
  if (reworks.length > 0) return "Poczekaj na cykl poprawek lub go uruchom"

  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready")
  if (trainingDrafts.length > 0) return "Przejrzyj zasoby treningowe"

  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending")
  if (pendingApprovals.length > 0) return "Przejrzyj pozycję do zatwierdzenia w pipeline"

  return "System jest bezczynny / brak pilnej akcji"
}

function idleReason(store: FactoryStore, date: string): string {
  const state = store.snapshot()
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length
  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready").length
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length
  if (readyOrders + trainingDrafts + pendingApprovals > 0) {
    return "Fabryka czeka na przegląd operatora."
  }

  const todayTraining = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length
  if (todayTraining >= 5) {
    return "Brak otwartych zleceń klienta, brak poprawek, a dzienny limit treningu jest już wykonany."
  }

  return "Brak otwartych zleceń klienta, brak poprawek i nie utworzono żadnego uruchamialnego zadania treningowego."
}

function directorInputSummary(store: FactoryStore, date: string): string {
  const state = store.snapshot()
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length
  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework").length
  const trainingToday = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length
  return `otwarte zlecenia=${openOrders}; gotowe do przeglądu=${readyOrders}; wymaga poprawek=${reworks}; trening dziś=${trainingToday}/5`
}

export async function runAutonomousCycle(
  store: FactoryStore,
  date?: string,
  trigger: FactoryWorkRunTrigger = "manual",
): Promise<CycleResult> {
  const today = date ?? new Date().toISOString().slice(0, 10)
  const startedAt = new Date().toISOString()
  const steps: AgentWorkStep[] = []
  const outputsCreated: string[] = []
  const knownOutputIds = new Set(store.snapshot().dailyDigitals.map((d) => d.id))
  const directorInput = directorInputSummary(store, today)
  let mode: FactoryMode = "IDLE"
  let ordersProduced: string[] = []
  let reworksRegenerated: string[] = []
  let trainingCreated = 0

  try {
    // 1. Client work first — real orders always beat training. If an order's
    // existing deliverable is marked needs_rework, the rework stage handles it.
    const runnable = store.getOpenOrders().filter((order) => {
      const existing = order.deliverableId ? store.getDailyDigital(order.deliverableId) : undefined
      return existing?.status !== "needs_rework"
    })
    // HRAR quarantine: a quarantined producer may keep training, but is cut
    // off from client production until the operator resets it (God Layer).
    const integrityBlocked = runnable.filter((order) => isAgentQuarantined(store, DEPT_AGENT[order.department]))
    const openOrders = runnable.filter((order) => !isAgentQuarantined(store, DEPT_AGENT[order.department]))
    for (const order of integrityBlocked) {
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: `BLOCKED by integrity guard: ${DEPT_AGENT[order.department]} is quarantined (HRAR). Training allowed; client production halted until operator reset.`,
      }))
    }
    ordersProduced = []
    for (const order of openOrders) {
      const stepStartedAt = new Date().toISOString()
      const constraints = [`Client brief from ${order.clientName}: ${order.description}`]
      if (order.operatorFeedback) constraints.push(order.operatorFeedback)
      const deliverable = produceOrderDeliverable(store, order.id)
      if (deliverable) {
        ordersProduced.push(order.id)
        if (!knownOutputIds.has(deliverable.id)) {
          outputsCreated.push(deliverable.id)
          knownOutputIds.add(deliverable.id)
        }
      }
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: deliverable ? "completed" : "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: deliverable
          ? `Produced ${deliverable.type} for review with score ${deliverable.qualityScore}.`
          : "No deliverable produced; order was not in a runnable state.",
        ...(deliverable ? { outputId: deliverable.id } : {}),
        constraintsApplied: constraints,
        startedAt: stepStartedAt,
      }))
    }

    // 2. Execute pending revision jobs (training and order assets alike).
    reworksRegenerated = []
    for (const digital of store.getDigitalsNeedingRework()) {
      const stepStartedAt = new Date().toISOString()
      const constraints: string[] = []
      if (digital.orderId) {
        const order = store.getOrder(digital.orderId)
        if (order) constraints.push(`Client brief from ${order.clientName}: ${order.description}`)
      }
      if (digital.operatorFeedback) constraints.push(digital.operatorFeedback)
      const regenerated = regenerateDigital(store, digital.id)
      if (regenerated) {
        reworksRegenerated.push(digital.id)
        outputsCreated.push(regenerated.id)
        knownOutputIds.add(regenerated.id)
      }
      steps.push(completedStep({
        agentId: digital.createdByAgentId,
        department: digital.department,
        jobType: digital.orderId ? "client_order_rework" : "training_rework",
        status: regenerated ? "completed" : "skipped",
        inputSummary: `${digital.id} needed rework: ${short(digital.operatorFeedback ?? "no feedback text")}`,
        outputSummary: regenerated
          ? `Regenerated output and returned it to review with score ${regenerated.qualityScore}.`
          : "No regeneration happened; item was not in needs_rework state.",
        ...(regenerated ? { outputId: regenerated.id } : {}),
        constraintsApplied: constraints,
        startedAt: stepStartedAt,
      }))
    }

    // 3. No client work or rework this cycle → training mode: 5 missions/day.
    if (openOrders.length === 0 && reworksRegenerated.length === 0) {
      const before = store.getDailyDigitalsForDate(today).filter((d) => !d.orderId).length
      const digitals = await runDailyMissions(store, today)
      const newDigitals = digitals.filter((d) => !knownOutputIds.has(d.id))
      trainingCreated = newDigitals.length
      for (const digital of newDigitals) {
        outputsCreated.push(digital.id)
        knownOutputIds.add(digital.id)
        const mission = store.snapshot().dailyMissions.find((m) => m.outputId === digital.id)
        steps.push(completedStep({
          agentId: digital.createdByAgentId,
          department: digital.department,
          jobType: "daily_training_mission",
          inputSummary: `Training quota ${before}/5 for ${today}; selected ${digital.department}/${digital.taskType ?? "unknown-task"}.`,
          outputSummary: `Created ${digital.type} for daily review with score ${digital.qualityScore}.`,
          outputId: digital.id,
          constraintsApplied: mission?.constraints ?? [],
        }))
      }
    }

    mode =
      ordersProduced.length > 0
        ? "CLIENT_MODE"
        : reworksRegenerated.length > 0
          ? "REWORK_MODE"
          : trainingCreated > 0
            ? "NO_CLIENT_TRAINING_MODE"
            : "IDLE"

    const finishedAt = new Date().toISOString()
    const reason = mode === "IDLE" ? idleReason(store, today) : undefined
    const next = nextOperatorAction(store)
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      inputSummary: directorInput,
      outputSummary: reason ? `Cycle idle: ${reason}` : `Cycle completed in ${mode}.`,
      ...(reason ? { constraintsApplied: [reason] } : {}),
      startedAt,
    }))

    store.addWorkRun({
      id: `fwr-${randomUUID().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "completed",
      trigger,
      steps,
      outputsCreated,
      ...(reason ? { idleReason: reason } : {}),
      nextOperatorAction: next,
    })

    if (ordersProduced.length + reworksRegenerated.length + trainingCreated > 0) {
      store.addEvent({
        id: randomUUID(),
        timestamp: finishedAt,
        agentId: "N",
        eventType: "factory.cycle",
        detail: `mode=${mode} orders=${ordersProduced.length} reworks=${reworksRegenerated.length} training=${trainingCreated}`,
      })
    }

    return { mode, ordersProduced, reworksRegenerated, trainingCreated }
  } catch (err) {
    const finishedAt = new Date().toISOString()
    const message = err instanceof Error ? err.message : String(err)
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      status: "failed",
      inputSummary: directorInput,
      outputSummary: `Cycle failed: ${short(message)}`,
      startedAt,
    }))
    store.addWorkRun({
      id: `fwr-${randomUUID().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "failed",
      trigger,
      steps,
      outputsCreated,
      idleReason: `Cycle failed: ${message}`,
      nextOperatorAction: "Sprawdź nieudany cykl fabryki",
    })
    throw err
  }
}
