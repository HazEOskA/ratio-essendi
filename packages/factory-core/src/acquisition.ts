import { randomUUID } from "node:crypto"
import {
  buildRecruitmentAuditOutreach,
  createAcquisitionProspect,
  type AcquisitionProspect,
  type AcquisitionProspectInput,
  type OutreachSender,
} from "@ratio-essendi/prospecting"
import type { FactoryStore } from "./store.js"
import { createOrder } from "./orders.js"

export const ACQUISITION_DAILY_SEND_LIMIT = 3
export const ACQUISITION_SERVICE_ID = "svc-recruitment-ops-audit"
let outreachMutex: Promise<void> = Promise.resolve()

async function withOutreachLock<T>(work: () => Promise<T>): Promise<T> {
  const previous = outreachMutex
  let release!: () => void
  outreachMutex = new Promise<void>((resolve) => { release = resolve })
  await previous
  try {
    return await work()
  } finally {
    release()
  }
}

function acquisitionEvent(store: FactoryStore, eventType: string, detail: string): void {
  store.addEvent({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    agentId: "A",
    eventType,
    detail,
  })
}

export function registerAcquisitionProspect(
  store: FactoryStore,
  input: AcquisitionProspectInput,
): AcquisitionProspect {
  const prospect = createAcquisitionProspect(input)
  store.addAcquisitionProspect(prospect)
  acquisitionEvent(store, "acquisition.prospect_registered", `${prospect.id} ${prospect.company} fit=${prospect.fitScore}`)
  return prospect
}

export async function sendAcquisitionOutreach(
  store: FactoryStore,
  prospectId: string,
  sender: OutreachSender,
  now = new Date().toISOString(),
): Promise<AcquisitionProspect> {
  return withOutreachLock(async () => {
    const prospect = store.getAcquisitionProspect(prospectId)
    if (!prospect) throw new Error("prospect not found")
    if (prospect.status !== "outreach_ready") throw new Error(`prospect cannot be contacted from status ${prospect.status}`)
    const day = now.slice(0, 10)
    if (store.countAcquisitionContactsForDate(day) >= ACQUISITION_DAILY_SEND_LIMIT) {
      throw new Error(`daily outreach limit reached (${ACQUISITION_DAILY_SEND_LIMIT})`)
    }

    const message = buildRecruitmentAuditOutreach(prospect)
    const result = await sender.send(message)
    const updated: AcquisitionProspect = {
      ...prospect,
      status: "contacted",
      outreachSubject: message.subject,
      outreachBody: message.body,
      providerMessageId: result.providerMessageId,
      firstContactAt: prospect.firstContactAt ?? result.sentAt,
      lastContactAt: result.sentAt,
      updatedAt: result.sentAt,
    }
    store.updateAcquisitionProspect(prospectId, updated)
    acquisitionEvent(store, "acquisition.outreach_sent", `${prospect.id} ${prospect.company} providerMessageId=${result.providerMessageId}`)
    return updated
  })
}

export function recordAcquisitionReply(
  store: FactoryStore,
  prospectId: string,
  outcome: "interested" | "not_interested" | "do_not_contact",
  summary: string,
): AcquisitionProspect {
  const prospect = store.getAcquisitionProspect(prospectId)
  if (!prospect) throw new Error("prospect not found")
  if (prospect.status !== "contacted" && prospect.status !== "replied") {
    throw new Error(`reply cannot be recorded from status ${prospect.status}`)
  }
  if (summary.trim().length < 3) throw new Error("reply summary is required")
  const now = new Date().toISOString()
  store.updateAcquisitionProspect(prospectId, {
    status: outcome,
    replySummary: summary.trim(),
    updatedAt: now,
  })
  acquisitionEvent(store, `acquisition.reply_${outcome}`, `${prospect.id} ${prospect.company}: ${summary.trim().slice(0, 120)}`)
  return store.getAcquisitionProspect(prospectId)!
}

export function acquireClientFromProspect(
  store: FactoryStore,
  prospectId: string,
  proof: string,
): AcquisitionProspect {
  const prospect = store.getAcquisitionProspect(prospectId)
  if (!prospect) throw new Error("prospect not found")
  if (prospect.status !== "interested") throw new Error("client acquisition requires an interested reply")
  if (proof.trim().length < 10) throw new Error("client proof is required")

  const order = createOrder(store, {
    clientName: prospect.company,
    ...(prospect.channel ? { contact: prospect.channel.address } : {}),
    description: `Recruitment operations workflow audit. Observed pains: ${prospect.painSignals.join("; ")}. Evidence: ${prospect.evidence.map((item) => item.summary).join("; ")}.`,
    department: "research",
    serviceId: ACQUISITION_SERVICE_ID,
    language: "EN",
    urgency: "normal",
    operatorNotes: `Acquired from prospect ${prospect.id}. Proof: ${proof.trim()}`,
  })
  const now = new Date().toISOString()
  store.updateAcquisitionProspect(prospectId, {
    status: "client_acquired",
    clientProof: proof.trim(),
    clientOrderId: order.id,
    updatedAt: now,
  })
  acquisitionEvent(store, "acquisition.client_acquired", `${prospect.id} ${prospect.company} -> ${order.id}`)
  return store.getAcquisitionProspect(prospectId)!
}
