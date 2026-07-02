/**
 * Delivery Packs — the client-ready artifact.
 *
 * A pack is created by an explicit operator action from a client-order
 * deliverable. It stays internal at every status: the factory prepares,
 * the operator delivers. Warehousing an approved pack closes the loop by
 * writing a CaseRecord — the factory's business memory.
 */
import { randomUUID } from "node:crypto"
import type { CaseRecord, DeliveryPack } from "./types.js"
import type { FactoryStore } from "./store.js"
import { getServiceDefinition } from "./services.js"
import { DEPT_AGENT } from "./missions.js"

function firstParagraph(text: string, max = 320): string {
  const stripped = text.replace(/^SERVICE:.*\n?CLIENT:.*\n?URGENCY:.*\n+/m, "")
  const para = stripped.split(/\n\n/).find((p) => p.trim().length > 40) ?? stripped
  const clean = para.replace(/^━━ .+ ━━\n+/m, "").trim()
  return clean.length > max ? `${clean.slice(0, max)}...` : clean
}

/**
 * Creates a draft DeliveryPack from a client-order deliverable. Operator
 * action only — never called by the autopilot.
 */
export function createDeliveryPack(store: FactoryStore, outputId: string): DeliveryPack | undefined {
  const digital = store.getDailyDigital(outputId)
  if (!digital?.orderId) return undefined
  const order = store.getOrder(digital.orderId)
  if (!order) return undefined
  // One draftable pack per output — recreate only if none exists yet.
  const existing = store.snapshot().deliveryPacks.find((p) => p.sourceOutputId === outputId)
  if (existing) return existing

  const service = order.serviceId ? getServiceDefinition(order.serviceId) : undefined
  const now = new Date().toISOString()
  const pack: DeliveryPack = {
    id: `pack-${randomUUID().slice(0, 8)}`,
    orderId: order.id,
    sourceOutputId: outputId,
    clientName: order.clientName,
    ...(order.serviceId ? { serviceId: order.serviceId } : {}),
    serviceName: order.serviceName ?? service?.name ?? `${order.department} deliverable`,
    date: now.slice(0, 10),
    executiveSummary: firstParagraph(digital.content),
    mainDeliverable: digital.content,
    recommendations: service
      ? service.expectedDeliverables.map((d) => `Deliverable covered: ${d}`)
      : [`Review the ${order.department} output against the client brief before delivery.`],
    nextSteps: service
      ? service.reviewSteps
      : ["Operator review", "Personalise for the client", "Deliver through your own channel"],
    safetyNote: service?.safetyNotes
      ?? "Internal artifact. The factory never sends anything — the operator delivers manually after review.",
    status: "draft",
    revisionCount: digital.revisionCount,
    createdAt: now,
    updatedAt: now,
  }
  store.addDeliveryPack(pack)
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "pack.created",
    detail: `${pack.id} from ${outputId} for ${order.clientName} (${pack.serviceName})`,
  })
  return pack
}

export function approveDeliveryPack(store: FactoryStore, packId: string): DeliveryPack | undefined {
  const pack = store.getDeliveryPack(packId)
  if (!pack || pack.status !== "draft") return undefined
  const now = new Date().toISOString()
  store.updateDeliveryPack(packId, { status: "approved", updatedAt: now })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.approved",
    detail: `Operator approved ${packId} for ${pack.clientName}`,
  })
  return store.getDeliveryPack(packId)
}

/**
 * Moves an approved pack to warehouse_ready and writes the CaseRecord.
 * This is the terminal internal state — delivery itself is the operator's act.
 */
export function warehouseDeliveryPack(store: FactoryStore, packId: string): CaseRecord | undefined {
  const pack = store.getDeliveryPack(packId)
  if (!pack || pack.status !== "approved") return undefined
  const order = store.getOrder(pack.orderId)
  const now = new Date().toISOString()
  store.updateDeliveryPack(packId, { status: "warehouse_ready", updatedAt: now })

  const record: CaseRecord = {
    id: `case-${randomUUID().slice(0, 8)}`,
    clientName: pack.clientName,
    ...(pack.serviceId ? { serviceId: pack.serviceId } : {}),
    serviceName: pack.serviceName,
    problem: order?.description ?? "(order record missing)",
    outputSummary: pack.executiveSummary,
    status: "closed_ready",
    createdAt: now,
    deliveryPackId: pack.id,
    followUpSuggestion: `Check in with ${pack.clientName} 7 days after delivery: did the ${pack.serviceName} land, and is there a follow-on scope?`,
  }
  store.addCaseRecord(record)
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.warehoused",
    detail: `${packId} warehouse_ready; case ${record.id} recorded for ${pack.clientName}`,
  })
  return record
}

/** Renders a pack as copy-ready markdown for the operator. */
export function renderPackMarkdown(pack: DeliveryPack): string {
  return `# ${pack.serviceName}

**Client:** ${pack.clientName}
**Date:** ${pack.date}
**Status:** ${pack.status} · revision ${pack.revisionCount}

## Executive Summary

${pack.executiveSummary}

## Main Deliverable

${pack.mainDeliverable}

## Recommendations

${pack.recommendations.map((r) => `- ${r}`).join("\n")}

## Next Steps

${pack.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---
*Safety note: ${pack.safetyNote}*
*Internal artifact ${pack.id} (source ${pack.sourceOutputId}, order ${pack.orderId}). The operator delivers this — the factory never sends.*`
}
