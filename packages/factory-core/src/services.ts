/**
 * Service Catalog — what the factory actually sells.
 *
 * Each service defines who it is for, what it promises, what inputs it needs,
 * what the client receives, and how production is routed (department + task
 * type). buildServiceContent() shapes the deliverable around the service, so
 * an "AI Workflow Audit" order produces an audit — not a generic template.
 * Everything stays internal until the operator delivers it themselves.
 */
import type { ClientOrder, ServiceDefinition } from "./types.js"

export const SERVICE_CATALOG: ServiceDefinition[] = [
  {
    id: "svc-ai-workflow-audit",
    name: "AI Workflow Audit + Mini Demo",
    targetCustomer: "Small service businesses (5-50 people) drowning in manual lead/quote/follow-up work",
    promise: "In days, not months: a diagnosis of your messiest workflow plus a concrete mini demo of the AI-assisted version.",
    inputsRequired: ["Business description", "The workflow that hurts most", "Current tools (if any)", "Volume estimate (leads/quotes per week)"],
    expectedDeliverables: ["Problem summary", "Workflow diagnosis", "3 improvement opportunities", "Proposed mini demo", "Implementation plan", "Risks & safety notes"],
    defaultDepartment: "delivery",
    defaultTaskType: "workflow-audit",
    reviewSteps: ["Check diagnosis matches the client brief", "Verify the mini demo scope is deliverable", "Personalise the next client question"],
    safetyNotes: "Audit only — no system access, no data migration, no automation is switched on without a separate agreement.",
  },
  {
    id: "svc-landing-audit",
    name: "Website / Landing Page Audit",
    targetCustomer: "Owners whose site gets traffic but not enquiries",
    promise: "A blunt, prioritised teardown of why visitors leave — and the quick wins that stop it.",
    inputsRequired: ["Site URL or page description", "Who the page should convert", "Primary conversion goal"],
    expectedDeliverables: ["First impression", "UX/friction issues", "Conversion issues", "AI opportunities", "Suggested sections", "Quick wins"],
    defaultDepartment: "marketing",
    defaultTaskType: "landing-audit",
    reviewSteps: ["Verify findings against the actual page", "Rank quick wins by effort/impact", "Remove any speculative claims"],
    safetyNotes: "Audit is based on operator-provided material only. No scraping, no logged-in access, no live edits.",
  },
  {
    id: "svc-recruitment-ops-audit",
    name: "Recruitment / Agency Ops Workflow Audit",
    targetCustomer: "Recruitment and staffing agencies with candidate/client pipelines held together by spreadsheets",
    promise: "Map the candidate-to-placement pipeline, find the three biggest leaks, and propose the fix order.",
    inputsRequired: ["Agency size and niche", "Current pipeline stages", "Where placements are lost", "Tools in use"],
    expectedDeliverables: ["Pipeline map", "Leak diagnosis", "3 fixes ranked by impact", "Automation candidates", "Implementation plan", "Risks"],
    defaultDepartment: "research",
    defaultTaskType: "ops-audit",
    reviewSteps: ["Confirm pipeline stages with the client", "Sanity-check leak estimates", "Flag anything requiring candidate-data caution"],
    safetyNotes: "No candidate personal data enters the factory. Work is process-level only.",
  },
  {
    id: "svc-client-dashboard",
    name: "Client Dashboard Concept",
    targetCustomer: "Service businesses that want one screen showing their pipeline, jobs, or client status",
    promise: "A concrete dashboard concept — components, data sources, and build order — ready for a build decision.",
    inputsRequired: ["What the owner needs to see daily", "Where the data lives today", "Who will use it"],
    expectedDeliverables: ["Dashboard goal", "Component plan", "Data source map", "Build order", "Effort estimate bands", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "dashboard-component-plan",
    reviewSteps: ["Check components map to stated daily questions", "Verify data sources exist", "Set expectation: concept, not build"],
    safetyNotes: "Concept only — no system integration and no data access in this service.",
  },
  {
    id: "svc-social-pack",
    name: "Social Content / Carousel Pack",
    targetCustomer: "Founders who should be posting but never have material ready",
    promise: "A ready-to-personalise carousel pack: angle, slide-by-slide copy, caption, and hashtags.",
    inputsRequired: ["Topic or offer to promote", "Audience", "Tone (expert / friendly / provocative)"],
    expectedDeliverables: ["Post angle", "Carousel outline", "Slide-by-slide copy", "Caption", "Hashtags"],
    defaultDepartment: "marketing",
    defaultTaskType: "carousel-outline",
    reviewSteps: ["Personalise examples and numbers", "Check tone matches the client", "Operator publishes manually — never the factory"],
    safetyNotes: "The factory never publishes. The pack is copy for the operator/client to post themselves.",
  },
  {
    id: "svc-automation-blueprint",
    name: "Process Automation Blueprint",
    targetCustomer: "Businesses with one repetitive process eating hours every week",
    promise: "A step-by-step blueprint for automating one named process, with tool choices and a safe rollout order.",
    inputsRequired: ["The process, step by step, as done today", "Weekly hours it consumes", "Tools already paid for"],
    expectedDeliverables: ["Process map", "Automation candidates", "Tool recommendation", "Rollout plan", "Human-in-the-loop points", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "automation-blueprint",
    reviewSteps: ["Verify every automated step keeps a human checkpoint where money or clients are touched", "Check tool costs are current"],
    safetyNotes: "Blueprint only. Nothing is connected or executed. Human approval points are mandatory in the design.",
  },
]

export function getServiceDefinition(id: string): ServiceDefinition | undefined {
  return SERVICE_CATALOG.find((s) => s.id === id)
}

export function isValidServiceId(id: string): boolean {
  return SERVICE_CATALOG.some((s) => s.id === id)
}

// ─── Service-shaped content generation ────────────────────────────────────────

function extractFocus(text: string): string {
  const m = text.toLowerCase().match(/(?:we|i)\s+(?:install|maintain|run|sell|build|provide|offer)\s+([^.,;]{3,60})/)
  return m?.[1]?.trim() ?? "your core service"
}

type Section = [heading: string, body: (o: ClientOrder) => string]

const langNote = (o: ClientOrder): string =>
  o.language === "PL" ? "\n\n[Operator note: client language is PL — translate before delivery.]" : ""

const SECTIONS_BY_SERVICE: Record<string, Section[]> = {
  "svc-ai-workflow-audit": [
    ["Problem Summary", (o) => `${o.clientName} — ${extractFocus(o.description)}. Stated pain: "${o.description.slice(0, 220)}". The core problem class: manual coordination work (leads, quotes, follow-ups) that scales with headcount instead of tooling.`],
    ["Workflow Diagnosis", (o) => `Current flow (reconstructed from brief — operator: confirm on the call):\n1. Inbound lead arrives (phone/email/form) → captured manually or not at all\n2. Quote prepared ad hoc → no standard template, no follow-up trigger\n3. Follow-up depends on someone remembering → leads decay silently\n4. Recurring work (${extractFocus(o.description)}) has no renewal/objection playbook\nBottleneck: steps 2–3. Every lost follow-up is a silent revenue leak.`],
    ["3 Improvement Opportunities", () => `1. Lead intake normalisation — one form/inbox route, auto-logged, nothing lost (effort: LOW, impact: HIGH)\n2. Quote follow-up sequence — 3-touch template triggered by "quote sent" (effort: LOW, impact: HIGH)\n3. Objection playbook for renewals/maintenance plans — standard answers for the top 5 objections (effort: MEDIUM, impact: MEDIUM)`],
    ["Proposed Mini Demo", (o) => `A 1-screen demo for ${o.clientName}: paste an inbound enquiry → the assistant drafts (a) a qualification reply, (b) a quote checklist, (c) the day-3 follow-up. All drafts land in a review box — a human sends them. Nothing is sent automatically.`],
    ["Implementation Plan", () => `Week 1: intake route + quote template + follow-up sequence drafts\nWeek 2: objection playbook + mini demo walkthrough + handoff\nOperator checkpoints: end of each week. No system goes live without sign-off.`],
    ["Risks & Safety Notes", () => `- No client data leaves the client's systems during the audit\n- All AI drafts are review-gated; a human sends every message\n- If current volume is under ~10 leads/week, automation ROI is marginal — say so honestly`],
    ["Next Client Question", (o) => `"Walk me through the last quote you lost — where exactly did the follow-up stop?"${langNote(o)}`],
  ],
  "svc-landing-audit": [
    ["First Impression", (o) => `Based on the brief for ${o.clientName}: "${o.description.slice(0, 180)}". First-5-seconds test: can a visitor tell WHO this is for, WHAT they get, and WHY trust it? Operator: verify against the live page before delivery.`],
    ["UX / Friction Issues", () => `Checklist applied:\n- Above-the-fold headline: outcome-led or feature-led?\n- Primary CTA visible without scrolling?\n- Mobile: tap targets, load weight, form length\n- Navigation: does it leak visitors away from the conversion path?`],
    ["Conversion Issues", () => `- One page, one goal: count the competing CTAs\n- Proof: real testimonials/numbers vs decorative logos\n- Risk reversal: guarantee, free step, or nothing?\n- Form friction: every extra field costs conversions`],
    ["AI Opportunities", () => `- Instant-answer widget for the top 5 pre-sale questions (review-gated content)\n- Personalised headline variants per traffic source\n- Enquiry summarisation so the owner answers in one minute`],
    ["Suggested Sections", () => `1. Outcome headline + subline\n2. Pain mirror (3 bullets in the visitor's words)\n3. Offer with concrete scope\n4. Proof\n5. Simple 3-step "how it works"\n6. Risk reversal + single CTA`],
    ["Quick Wins", (o) => `Ranked by effort/impact for ${o.clientName}:\n1. Rewrite headline to outcome (1h)\n2. Cut form to 3 fields (1h)\n3. Move one real proof element above the fold (2h)${langNote(o)}`],
  ],
  "svc-recruitment-ops-audit": [
    ["Pipeline Map", (o) => `Reconstructed for ${o.clientName} from brief: sourcing → screening → client submission → interview loop → offer → placement → aftercare. Brief: "${o.description.slice(0, 180)}". Operator: confirm stage names with the client.`],
    ["Leak Diagnosis", () => `Typical leak points to verify:\n1. Screening→submission lag (candidates go cold in 48h)\n2. No structured client feedback loop after submission\n3. Aftercare ignored → refunds/replacements eat margin`],
    ["3 Fixes Ranked by Impact", () => `1. 24h submission SLA with a daily "aging candidates" list (HIGH)\n2. Feedback template sent with every submission (MEDIUM)\n3. Day-7/30/80 aftercare check-ins, templated (MEDIUM)`],
    ["Automation Candidates", () => `- Aging-pipeline digest (internal report, no external send)\n- Interview scheduling links\n- Aftercare reminder drafts — human sends every one`],
    ["Implementation Plan", () => `Week 1: pipeline stages + SLA report. Week 2: templates + reminders. Candidate personal data stays in the agency's ATS — the factory works at process level only.`],
    ["Risks", (o) => `- GDPR: no candidate data enters this system\n- SLA pressure can hurt quality — pair with a screening checklist${langNote(o)}`],
  ],
  "svc-client-dashboard": [
    ["Dashboard Goal", (o) => `${o.clientName} needs one screen answering the owner's daily questions. Brief: "${o.description.slice(0, 180)}".`],
    ["Component Plan", () => `1. Pipeline funnel (counts + conversion per stage)\n2. This-week jobs/deadlines list\n3. Money row: quoted / won / invoiced / overdue\n4. Alerts: items stuck > N days\n5. Activity log (latest 20 events)`],
    ["Data Source Map", () => `Per component: where the data lives today (spreadsheet / inbox / tool), who updates it, and the single source of truth chosen for v1. Operator fills specifics after the discovery call.`],
    ["Build Order", () => `v1: pipeline funnel + stuck alerts (highest decision value)\nv2: money row\nv3: activity log + weekly digest`],
    ["Effort Estimate Bands", () => `v1: days, not weeks, if data source is one spreadsheet. Integration with a real CRM moves it to weeks. Bands, not promises — refine after discovery.`],
    ["Risks", (o) => `- Garbage-in: dashboard is only as honest as the source data\n- Concept only: nothing is connected in this service${langNote(o)}`],
  ],
  "svc-social-pack": [
    ["Post Angle", (o) => `For ${o.clientName}: "${o.description.slice(0, 160)}". Angle: the specific, unglamorous mistake the audience makes daily — named plainly, then fixed.`],
    ["Carousel Outline", () => `S1 Hook (the mistake, in the audience's words)\nS2 Why it keeps happening\nS3-5 The fix in 3 concrete steps\nS6 Proof or example\nS7 CTA: one small action today`],
    ["Slide-by-Slide Copy", (o) => `S1: "You're losing ${extractFocus(o.description)} money in a place you never look."\nS2: "Not because you're lazy — because nobody owns the follow-up."\nS3: "Step 1: write down where the last 5 deals died."\nS4: "Step 2: one template for the day-3 follow-up."\nS5: "Step 3: one owner, one daily 10-minute review."\nS6: "[Operator: insert client's real number/example here]"\nS7: "Do step 1 today. It takes 15 minutes."`],
    ["Caption", () => `Most businesses don't have a leads problem — they have a follow-up problem. 3 steps that cost nothing, in the carousel. Which step is missing in your business?`],
    ["Hashtags", (o) => `#smallbusiness #workflow #followup #sales [operator: add 3 niche tags]${langNote(o)}\n\n[SAFETY: the factory never posts. This pack is copy for manual publishing.]`],
  ],
  "svc-automation-blueprint": [
    ["Process Map", (o) => `Process as described by ${o.clientName}: "${o.description.slice(0, 220)}". Operator: number the steps with the client and mark who touches each one.`],
    ["Automation Candidates", () => `For each step: AUTOMATE (mechanical, no judgment) / ASSIST (AI drafts, human decides) / KEEP HUMAN (money, clients, exceptions). Default to ASSIST wherever a client can see the output.`],
    ["Tool Recommendation", () => `Prefer tools already paid for. Otherwise: one workflow tool + one AI-drafting step + one review inbox. Name concrete tools only after confirming current stack — no hidden subscriptions.`],
    ["Rollout Plan", () => `Phase 1: shadow mode — automation drafts, human does the work as before, compare\nPhase 2: assist mode — human approves each output\nPhase 3: automate only the steps that survived 2 weeks of review with zero corrections`],
    ["Human-in-the-Loop Points", () => `Mandatory checkpoints: anything sent to a client, anything touching money, anything irreversible. These are design constraints, not suggestions.`],
    ["Risks", (o) => `- Automating a broken process makes it break faster — fix the process first\n- Key-person risk: document the workflow so it survives staff changes${langNote(o)}`],
  ],
}

/**
 * Builds the full service-shaped deliverable body for an order, including the
 * delivery-pack draft skeleton the operator will later formalise.
 */
export function buildServiceContent(
  service: ServiceDefinition,
  order: ClientOrder,
  constraints: string[] = [],
): { title: string; content: string } {
  const sections = SECTIONS_BY_SERVICE[service.id]
  if (!sections) throw new Error(`No content builder for service ${service.id}`)
  const date = new Date().toISOString().slice(0, 10)
  const header = constraints.length > 0
    ? `PRODUCTION CONSTRAINTS (operator/client input):\n${constraints.map((c) => `• ${c}`).join("\n")}\n\n`
    : ""
  const body = header + sections.map(([h, fn]) => `━━ ${h} ━━\n\n${fn(order)}`).join("\n\n")
  const packDraft = `━━ Delivery Pack Draft ━━

Client: ${order.clientName}
Service: ${service.name}
Date: ${date}
Promise: ${service.promise}
Deliverables covered: ${service.expectedDeliverables.join("; ")}
Review before delivery: ${service.reviewSteps.join(" → ")}
Safety: ${service.safetyNotes}`
  return {
    title: `${service.name} — ${order.clientName} — ${date}`,
    content: `SERVICE: ${service.name}\nCLIENT: ${order.clientName}\nURGENCY: ${order.urgency ?? "normal"} · LANGUAGE: ${order.language ?? "EN"}\n\n${body}\n\n${packDraft}`,
  }
}
