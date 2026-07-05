/**
 * Client Order Line — real work, not training.
 *
 * A client order arrives via the /orders form (operator or client-submitted).
 * The factory infers the concrete task type from the description, produces the
 * deliverable with the client brief as a hard constraint, and parks it at the
 * review gate. Nothing is ever sent to the client automatically — the operator
 * reviews, then delivers through their own channel.
 */
import { randomUUID } from "node:crypto"
import type { ClientOrder, DailyDigital, DailyDigitalDepartment, OrderLanguage } from "./types.js"
import type { FactoryStore } from "./store.js"
import { TASK_TYPES, DEPT_AGENT, generateAssetContent, scoreContent } from "./missions.js"
import { getServiceDefinition, buildServiceContent } from "./services.js"
import { recordQualityIntegritySignal } from "./integrity.js"

export type OrderInput = {
  clientName: string
  contact?: string
  description: string
  department: DailyDigitalDepartment
  serviceId?: string
  urgency?: "normal" | "high"
  language?: OrderLanguage
  operatorNotes?: string
}

/** Maps free-text order descriptions to a concrete task type per department. */
const TASK_KEYWORDS: Record<DailyDigitalDepartment, [RegExp, string][]> = {
  marketing: [
    [/\bads?\b|ad pack|advert/i, "ad-pack"],
    [/hook/i, "hook-set"],
    [/carousel/i, "carousel-outline"],
    [/landing/i, "landing-section"],
    [/campaign|angle/i, "campaign-angle"],
  ],
  sales: [
    [/pitch|deck|presentation/i, "pitch-pack"],
    [/objection/i, "objection-map"],
    [/follow.?up|sequence/i, "follow-up-script"],
    [/qualif/i, "qualification-questions"],
    [/offer|template/i, "offer-draft-template"],
  ],
  delivery: [
    [/demo/i, "demo-block"],
    [/onboard|checklist/i, "onboarding-checklist"],
    [/landing|website|page/i, "landing-template"],
    [/dashboard|component/i, "dashboard-component-plan"],
    [/repo|github|issue|task/i, "repo-task-draft"],
  ],
  research: [
    [/lead|source|list of/i, "lead-source-list"],
    [/niche|market/i, "niche-research"],
    [/keyword|seo/i, "keyword-set"],
    [/opportunit/i, "opportunity-map"],
    [/audience|persona|segment/i, "audience-list"],
  ],
  qa: [
    [/clean/i, "cleanup-report"],
    [/agent|improve/i, "agent-improvement-report"],
    [/weak|review/i, "weak-asset-review"],
    [/plan|tomorrow|next/i, "next-day-plan"],
    [/audit|qa|quality/i, "qa-report"],
  ],
}

export function inferTaskType(dept: DailyDigitalDepartment, description: string): string {
  for (const [pattern, taskType] of TASK_KEYWORDS[dept]) {
    if (pattern.test(description)) return taskType
  }
  const list = TASK_TYPES[dept]
  return list[Math.floor(Math.random() * list.length)]!
}

export function createOrder(store: FactoryStore, input: OrderInput): ClientOrder {
  // A named service overrides routing: unknown service ids must be rejected
  // by the caller BEFORE this point (no order, no event on invalid input).
  const service = input.serviceId ? getServiceDefinition(input.serviceId) : undefined
  if (input.serviceId && !service) {
    throw new Error(`Unknown service id: ${input.serviceId}`)
  }
  const department = service?.defaultDepartment ?? input.department
  const now = new Date().toISOString()
  const order: ClientOrder = {
    id: `ord-${randomUUID().slice(0, 8)}`,
    clientName: input.clientName,
    ...(input.contact ? { contact: input.contact } : {}),
    description: input.description,
    department,
    ...(service ? { serviceId: service.id, serviceName: service.name } : {}),
    ...(input.urgency ? { urgency: input.urgency } : {}),
    ...(input.language ? { language: input.language } : {}),
    ...(input.operatorNotes ? { operatorNotes: input.operatorNotes } : {}),
    taskType: service?.defaultTaskType ?? inferTaskType(department, input.description),
    status: "new",
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  store.addOrder(order)
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[department],
    eventType: "order.received",
    detail: `${order.id} from ${input.clientName}${service ? ` [${service.name}]` : ""}: "${input.description.slice(0, 80)}"`,
  })
  return order
}

/**
 * Produces the deliverable for one order. The client brief is the primary
 * production constraint, so the generated asset is built around what the
 * client actually asked for. Returns the deliverable held at the review gate.
 */
export function produceOrderDeliverable(store: FactoryStore, orderId: string): DailyDigital | undefined {
  const order = store.getOrder(orderId)
  if (!order || (order.status !== "new" && order.status !== "in_production")) return undefined
  if (order.deliverableId && store.getDailyDigital(order.deliverableId)?.status === "draft_ready") {
    return store.getDailyDigital(order.deliverableId)
  }

  const today = new Date().toISOString().slice(0, 10)
  const constraints = [`Client brief from ${order.clientName}: ${order.description}`]
  const deptFeedback = store.getRecentFeedbackConstraints(7)[order.department] ?? []
  for (const fb of deptFeedback) constraints.push(fb)

  // Service-shaped production: a named service produces its own deliverable
  // structure (audit sections, pack draft, etc.) instead of generic templates.
  const service = order.serviceId ? getServiceDefinition(order.serviceId) : undefined
  const taskType = order.taskType ?? service?.defaultTaskType ?? inferTaskType(order.department, order.description)
  const generated = service
    ? (() => {
        const g = buildServiceContent(service, order, deptFeedback)
        return { ...g, qualityScore: scoreContent(g.content, deptFeedback) }
      })()
    : generateAssetContent(order.department, taskType, today, constraints)
  const now = new Date().toISOString()

  const digital: DailyDigital = {
    id: `dd-order-${order.id}`,
    date: today,
    title: `[ORDER ${order.id}] ${generated.title}`,
    department: order.department,
    type: `${order.department}_asset`,
    taskType,
    content: generated.content,
    status: "draft_ready",
    qualityScore: generated.qualityScore,
    createdByAgentId: DEPT_AGENT[order.department],
    linkedMissionId: `order-${order.id}`,
    orderId: order.id,
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
    location: "daily_review",
  }
  store.addDailyDigital(digital)
  void recordQualityIntegritySignal(store, DEPT_AGENT[order.department], generated.qualityScore, digital.id)
  store.updateOrder(order.id, { status: "ready_for_review", deliverableId: digital.id, taskType, updatedAt: now })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "order.produced",
    detail: `${order.id} → ${digital.id} (${order.department}/${taskType}, score=${generated.qualityScore})`,
  })
  return digital
}
