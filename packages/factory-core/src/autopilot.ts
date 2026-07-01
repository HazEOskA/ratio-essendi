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
import type { CycleResult } from "./types.js"
import type { FactoryStore } from "./store.js"
import { produceOrderDeliverable } from "./orders.js"
import { runDailyMissions, regenerateDigital } from "./missions.js"

export async function runAutonomousCycle(store: FactoryStore, date?: string): Promise<CycleResult> {
  const today = date ?? new Date().toISOString().slice(0, 10)

  // 1. Client work first — real orders always beat training.
  const openOrders = store.getOpenOrders()
  const ordersProduced: string[] = []
  for (const order of openOrders) {
    const deliverable = produceOrderDeliverable(store, order.id)
    if (deliverable) ordersProduced.push(order.id)
  }

  // 2. Execute pending revision jobs (training and order assets alike).
  const reworksRegenerated: string[] = []
  for (const digital of store.getDigitalsNeedingRework()) {
    const regenerated = regenerateDigital(store, digital.id)
    if (regenerated) reworksRegenerated.push(digital.id)
  }

  // 3. No client work open → training mode: 5 random missions per day.
  let trainingCreated = 0
  if (openOrders.length === 0) {
    const before = store.getDailyDigitalsForDate(today).filter((d) => !d.orderId).length
    await runDailyMissions(store, today)
    const after = store.getDailyDigitalsForDate(today).filter((d) => !d.orderId).length
    trainingCreated = after - before
  }

  const mode: CycleResult["mode"] =
    openOrders.length > 0
      ? "CLIENT_MODE"
      : trainingCreated > 0 || reworksRegenerated.length > 0
        ? "NO_CLIENT_TRAINING_MODE"
        : "IDLE"

  if (ordersProduced.length + reworksRegenerated.length + trainingCreated > 0) {
    store.addEvent({
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      agentId: "N",
      eventType: "factory.cycle",
      detail: `mode=${mode} orders=${ordersProduced.length} reworks=${reworksRegenerated.length} training=${trainingCreated}`,
    })
  }

  return { mode, ordersProduced, reworksRegenerated, trainingCreated }
}
