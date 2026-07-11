/**
 * Lead Engine (LEA) — integracja z fabryką.
 *
 * Model bezpieczeństwa identyczny jak w Delivery Packach (FC-021):
 * LEA REDAGUJE odpowiedzi i propozycje w personie "Dyrektora Wzrostu",
 * a operator kopiuje je i wysyła własnym kanałem. Nie istnieje tu żadna
 * ścieżka wysyłki — "oznacz jako wysłane" jedynie zapisuje do historii
 * wątku treść, którą operator wysłał sam.
 *
 * Kwalifikacja (problem → budżet → decydent) jest liczona deterministycznie
 * z wypowiedzi leada (pakiet lead-engine/signals), więc jest identyczna
 * niezależnie od tego, czy szkice pisze żywy Claude czy szablon offline.
 */
import { randomUUID } from "node:crypto"
import {
  extractQualification,
  selectLeadDrafter,
  StubLeadDrafter,
  type LeadChatMessage,
  type LeadDraftKind,
  type LeadDrafter,
} from "@ratio-essendi/lead-engine"
import type { FactoryStore } from "./store.js"
import type {
  LeadThread,
  LeadThreadMessage,
  LeadThreadQualification,
  LeadThreadStatus,
} from "./types.js"

export const LEAD_THREAD_STATUSES: readonly LeadThreadStatus[] = [
  "cold", "warm", "hot", "qualified", "won", "lost",
]

export function isValidLeadThreadStatus(value: string): value is LeadThreadStatus {
  return (LEAD_THREAD_STATUSES as readonly string[]).includes(value)
}

// Wybór mózgu jest leniwy i podmienialny w testach.
let drafterOverride: LeadDrafter | undefined
export function setLeadDrafterForTests(d: LeadDrafter | undefined): void {
  drafterOverride = d
}
function activeDrafter(): { drafter: LeadDrafter; mode: "anthropic" | "stub" } {
  if (drafterOverride) return { drafter: drafterOverride, mode: "stub" }
  const sel = selectLeadDrafter()
  return sel.mode === "anthropic"
    ? { drafter: sel.drafter, mode: "anthropic" }
    : { drafter: new StubLeadDrafter(), mode: "stub" }
}

/** Który mózg będzie użyty przy następnym szkicu — do wyświetlenia w panelu. */
export function leadDrafterMode(): "anthropic" | "stub" {
  return process.env["ANTHROPIC_API_KEY"] ? "anthropic" : "stub"
}

function nowIso(): string {
  return new Date().toISOString()
}

function addEvent(store: FactoryStore, eventType: string, detail: string): void {
  store.addEvent({
    id: randomUUID(),
    timestamp: nowIso(),
    agentId: "LEA",
    eventType,
    detail,
  })
}

/** Historia wątku w formacie warstwy redagującej (lead / wysłane przez operatora). */
function historyFor(thread: LeadThread): LeadChatMessage[] {
  return thread.messages
    .filter((m) => m.author === "lead" || m.author === "operator_sent")
    .map((m) => ({ role: m.author === "lead" ? "lead" as const : "operator" as const, text: m.text }))
}

/** Status wynikający z kwalifikacji: cold → warm (problem) → hot (2 pola) → qualified (3 pola). */
function statusFromQualification(q: LeadThreadQualification, current: LeadThreadStatus): LeadThreadStatus {
  if (current === "won" || current === "lost") return current
  const known = [q.problem, q.budget, q.decisionMaker].filter(Boolean).length
  if (known >= 3) return "qualified"
  if (known === 2) return "hot"
  if (known === 1) return "warm"
  return "cold"
}

export function getLeadThreads(store: FactoryStore): LeadThread[] {
  return store.snapshot().leadThreads
}

export type CreateLeadThreadInput = {
  leadName: string
  company?: string
  source?: string
}

export function createLeadThread(store: FactoryStore, input: CreateLeadThreadInput): LeadThread {
  const now = nowIso()
  const thread: LeadThread = {
    id: `lt-${randomUUID().slice(0, 8)}`,
    leadName: input.leadName,
    ...(input.company ? { company: input.company } : {}),
    ...(input.source ? { source: input.source } : {}),
    status: "cold",
    qualification: {},
    messages: [],
    draftRevision: 0,
    createdAt: now,
    updatedAt: now,
  }
  store.addLeadThread(thread)
  addEvent(store, "lead.thread_created", `Nowy wątek leada: ${thread.leadName}${thread.company ? ` (${thread.company})` : ""} [${thread.id}]`)
  return thread
}

async function appendDraft(
  store: FactoryStore,
  thread: LeadThread,
  kind: LeadDraftKind,
  operatorFeedback?: string,
): Promise<LeadThreadMessage> {
  const { drafter } = activeDrafter()
  const draft = await drafter.draft({
    leadName: thread.leadName,
    ...(thread.company ? { company: thread.company } : {}),
    history: historyFor(thread),
    qualification: thread.qualification,
    ...(operatorFeedback ? { operatorFeedback } : {}),
    kind,
  })
  const msg: LeadThreadMessage = {
    id: `lm-${randomUUID().slice(0, 8)}`,
    author: "lea_draft",
    kind: kind === "proposal" ? "proposal" : "reply",
    text: draft.text,
    at: nowIso(),
    draftMode: draft.mode,
    objective: draft.objective,
  }
  store.updateLeadThread(thread.id, {
    messages: [...store.getLeadThread(thread.id)!.messages, msg],
    updatedAt: msg.at,
  })
  return msg
}

/**
 * Nowa wiadomość OD leada (wklejona przez operatora): zapis + rekwalifikacja
 * + automatyczny szkic odpowiedzi LEA. Zwraca odświeżony wątek.
 */
export async function recordIncomingLeadMessage(
  store: FactoryStore,
  threadId: string,
  text: string,
): Promise<LeadThread | undefined> {
  const thread = store.getLeadThread(threadId)
  if (!thread) return undefined
  const now = nowIso()
  const incoming: LeadThreadMessage = {
    id: `lm-${randomUUID().slice(0, 8)}`,
    author: "lead",
    kind: "message",
    text,
    at: now,
  }
  const messages = [...thread.messages, incoming]
  const history: LeadChatMessage[] = messages
    .filter((m) => m.author === "lead" || m.author === "operator_sent")
    .map((m) => ({ role: m.author === "lead" ? "lead" as const : "operator" as const, text: m.text }))
  const qualification = extractQualification(history)
  const status = statusFromQualification(qualification, thread.status)

  const newlyKnown: string[] = []
  if (qualification.problem && !thread.qualification.problem) newlyKnown.push(`problem=${qualification.problem}`)
  if (qualification.budget && !thread.qualification.budget) newlyKnown.push(`budżet=${qualification.budget}`)
  if (qualification.decisionMaker && !thread.qualification.decisionMaker) newlyKnown.push(`decydent=${qualification.decisionMaker}`)

  store.updateLeadThread(threadId, {
    messages,
    qualification,
    status,
    draftRevision: 0,
    updatedAt: now,
  })
  addEvent(store, "lead.message_received", `Wiadomość od leada ${thread.leadName} [${threadId}]: ${text.length > 120 ? `${text.slice(0, 120)}...` : text}`)
  if (newlyKnown.length > 0) {
    addEvent(store, "lead.qualified", `Kwalifikacja ${thread.leadName} [${threadId}]: ${newlyKnown.join("; ")}. Status: ${status}.`)
  }
  if (status !== thread.status) {
    addEvent(store, "lead.status_changed", `Status ${thread.leadName} [${threadId}]: ${thread.status} → ${status} (kwalifikacja).`)
  }

  const updated = store.getLeadThread(threadId)!
  const draft = await appendDraft(store, updated, "reply")
  addEvent(store, "lead.reply_drafted", `LEA przygotował szkic odpowiedzi dla ${thread.leadName} [${threadId}] (mózg: ${draft.draftMode}, cel: ${draft.objective}). Czeka na przegląd i ręczną wysyłkę operatora.`)
  return store.getLeadThread(threadId)
}

/** Przeredagowanie bieżącego szkicu z feedbackiem operatora jako twardym ograniczeniem. */
export async function redraftLeadReply(
  store: FactoryStore,
  threadId: string,
  feedback?: string,
): Promise<LeadThread | undefined> {
  const thread = store.getLeadThread(threadId)
  if (!thread) return undefined
  const draft = await appendDraft(store, thread, "reply", feedback)
  store.updateLeadThread(threadId, { draftRevision: thread.draftRevision + 1, updatedAt: nowIso() })
  addEvent(store, "lead.reply_redrafted", `LEA przeredagował szkic dla ${thread.leadName} [${threadId}] (rewizja ${thread.draftRevision + 1}${feedback ? `, feedback: ${feedback}` : ""}, mózg: ${draft.draftMode}).`)
  return store.getLeadThread(threadId)
}

/** Szkic oficjalnej propozycji biznesowej — do wątku, nigdy na maila. */
export async function draftLeadProposal(
  store: FactoryStore,
  threadId: string,
): Promise<LeadThread | undefined> {
  const thread = store.getLeadThread(threadId)
  if (!thread) return undefined
  const draft = await appendDraft(store, thread, "proposal")
  addEvent(store, "lead.proposal_drafted", `LEA przygotował szkic propozycji dla ${thread.leadName} [${threadId}] (mózg: ${draft.draftMode}). Operator wysyła ją samodzielnie.`)
  return store.getLeadThread(threadId)
}

/**
 * Zapis odpowiedzi, którą operator FAKTYCZNIE wysłał własnym kanałem.
 * Fabryka niczego nie wysyła — to wyłącznie księgowanie do context recovery.
 */
export function markLeadReplySent(
  store: FactoryStore,
  threadId: string,
  text: string,
): LeadThread | undefined {
  const thread = store.getLeadThread(threadId)
  if (!thread) return undefined
  const now = nowIso()
  const msg: LeadThreadMessage = {
    id: `lm-${randomUUID().slice(0, 8)}`,
    author: "operator_sent",
    kind: "reply",
    text,
    at: now,
  }
  store.updateLeadThread(threadId, {
    messages: [...thread.messages, msg],
    draftRevision: 0,
    updatedAt: now,
  })
  addEvent(store, "lead.marked_sent", `Operator oznaczył odpowiedź do ${thread.leadName} [${threadId}] jako wysłaną WŁASNYM kanałem. Fabryka nie wysłała niczego.`)
  return store.getLeadThread(threadId)
}

/** Ręczna zmiana statusu (won/lost itd.) — decyzja operatora, zawsze z eventem. */
export function setLeadThreadStatus(
  store: FactoryStore,
  threadId: string,
  status: LeadThreadStatus,
  note?: string,
): LeadThread | undefined {
  const thread = store.getLeadThread(threadId)
  if (!thread) return undefined
  store.updateLeadThread(threadId, { status, updatedAt: nowIso() })
  addEvent(store, "lead.status_changed", `Status ${thread.leadName} [${threadId}]: ${thread.status} → ${status} (operator${note ? `: ${note}` : ""}).`)
  return store.getLeadThread(threadId)
}

/** Bieżący (ostatni) szkic czekający na przegląd operatora, jeśli jest nowszy niż ostatnia wysyłka. */
export function pendingDraftFor(thread: LeadThread): LeadThreadMessage | undefined {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i]!
    if (m.author === "operator_sent") return undefined
    if (m.author === "lea_draft") return m
  }
  return undefined
}
