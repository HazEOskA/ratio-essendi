/**
 * NO_CLIENT_TRAINING_MODE — Daily Production Loop
 *
 * When there is no live client or active deal, the factory runs 5 daily missions:
 *   1. Marketing Digital  → marketing_asset
 *   2. Sales Digital      → sales_asset
 *   3. Delivery Digital   → delivery_asset
 *   4. Research Digital   → research_asset
 *   5. QA Digital         → qa_asset
 *
 * Operator reviews each on /daily-review. Feedback is stored and fed back as
 * constraints into the next run's generators.
 */
import { randomUUID } from "node:crypto"
import type {
  DailyDigital,
  DailyDigitalDepartment,
  DailyMission,
  MissionAgentId,
  FactoryEvent,
} from "./types.js"
import type { FactoryStore } from "./store.js"
import { getServiceDefinition, buildServiceContent } from "./services.js"
import { recordOperatorIntegritySignal, recordQualityIntegritySignal } from "./integrity.js"

// ─── Constants ────────────────────────────────────────────────────────────────

const ICP = "Seed-stage B2B SaaS founders (10–50 employees)"
const PRODUCT = "Fractional RevOps sprint — 2 weeks, fixed scope, €2,500–€4,500"

export const TASK_TYPES: Record<DailyDigitalDepartment, string[]> = {
  marketing: ["ad-pack", "hook-set", "carousel-outline", "landing-section", "campaign-angle"],
  sales: ["pitch-pack", "objection-map", "follow-up-script", "qualification-questions", "offer-draft-template"],
  delivery: ["demo-block", "onboarding-checklist", "landing-template", "dashboard-component-plan", "repo-task-draft"],
  research: ["lead-source-list", "niche-research", "keyword-set", "opportunity-map", "audience-list"],
  qa: ["qa-report", "cleanup-report", "agent-improvement-report", "weak-asset-review", "next-day-plan"],
}

export const DEPT_AGENT: Record<DailyDigitalDepartment, MissionAgentId> = {
  marketing: "MA",
  sales: "SA",
  delivery: "DA",
  research: "RA",
  qa: "QAA",
}

const SAAS_NICHES = [
  "HR tech for small teams",
  "Vertical SaaS for professional services",
  "Sales automation for B2B SMBs",
  "Analytics for e-commerce founders",
  "Project management for agencies",
  "Billing and subscription management",
  "Compliance tech for regulated industries",
  "Customer success platforms",
  "Pricing and packaging optimisation",
  "Revenue intelligence and forecasting",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dayOfYear(date: string): number {
  const d = new Date(date)
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000)
}

/** Random pick — daily training tasks are randomised, not a fixed rotation. */
function selectTaskType(dept: DailyDigitalDepartment): string {
  const list = TASK_TYPES[dept]
  return list[Math.floor(Math.random() * list.length)]!
}

function constraintHeader(constraints: string[]): string {
  if (constraints.length === 0) return ""
  return `PRODUCTION CONSTRAINTS (operator/client input):\n${constraints.map((c) => `• ${c}`).join("\n")}\n\n`
}

function extractNicheFocus(constraints: string[]): string {
  const text = constraints.join(" ").toLowerCase()
  const m = text.match(/for\s+([a-z][a-z\s]+?)(?:\s+companies|\s+firms|\s+businesses|\s+founders|[.,]|$)/)
  return m?.[1]?.trim() ?? ""
}

export function scoreContent(content: string, constraints: string[]): number {
  let s = 0
  if (content.length > 800) s += 0.3
  else if (content.length > 400) s += 0.2
  else if (content.length > 150) s += 0.1
  if (content.includes("\n\n")) s += 0.1
  if (/[0-9]/.test(content)) s += 0.1
  if (content.split("\n").some((l) => /^[-•*]/.test(l.trim()))) s += 0.1
  if (/€[\d,]+|\$[\d,]+/.test(content)) s += 0.1
  if (/\d+%|\d+[\s-](day|week|hour|minute)/.test(content)) s += 0.1
  if (constraints.length === 0) {
    s += 0.2
  } else {
    const lower = content.toLowerCase()
    const hit = constraints.filter((c) => c.split(/\s+/).some((w) => w.length > 4 && lower.includes(w.toLowerCase())))
    s += (hit.length / constraints.length) * 0.2
  }
  return Math.min(Math.round(s * 100) / 100, 1)
}

// ─── Marketing generators ──────────────────────────────────────────────────────

type Generated = { title: string; content: string }

function marketing(taskType: string, date: string, constraints: string[]): Generated {
  const niche = extractNicheFocus(constraints) || "seed-stage SaaS"
  const ch = constraintHeader(constraints)

  switch (taskType) {
    case "hook-set":
      return {
        title: `Hook Set — ${date} — Outbound + LinkedIn`,
        content: ch + `HOOK SET — 10 Angles for ${ICP}
Product: ${PRODUCT}

A/B Test Group 1 — Pain-first:
• "Your pipeline is a leaky bucket. Here's the 2-week fix."
• "At $30K MRR, your pipeline isn't failing. Your offer is."
• "Most ${niche} founders have the same problem: weak pipeline, wrong offer."

A/B Test Group 2 — Specificity:
• "How we added $50K pipeline for a founder just like you — in 14 days."
• "3 qualified calls in 2 weeks. No SDR. No ad spend. Fixed scope."
• "€2,500 sprint → 3–5 intro meetings. Here's the breakdown."

A/B Test Group 3 — Curiosity:
• "One question that diagnoses your whole outbound problem."
• "Skip the SDR hire. This sprint does the same job for 1/10th the cost."
• "Your ICP reads your offer in 4 seconds. What do they feel?"
• "We had a founder triple her booked calls in 14 days. She changed one thing."

Usage notes:
- Test 1 hook per channel per week
- LinkedIn: use Group 2 (specificity wins in feed)
- Cold email subject: Group 3 (curiosity drives opens)
- Never use all 3 groups at once — isolate variables
- Operator: replace [placeholder numbers] with real case data when available`,
      }
    case "carousel-outline":
      return {
        title: `LinkedIn Carousel — ${date} — Pipeline Sprint`,
        content: ch + `LINKEDIN CAROUSEL — 6 Frames
Topic: "Why Your Pipeline Stalls at $30K MRR (and One Sprint That Fixes It)"
Target: ${ICP}

Frame 1 — Hook (must stop the scroll):
Headline: "Your pipeline didn't die. Your offer did."
Visual: Bold text, dark background. No stock photos.
CTA: "Swipe to see the exact problem →"

Frame 2 — Problem (be specific):
Headline: "At seed stage, founders make 3 outbound mistakes:"
Body:
• Generic ICP: "B2B companies with 10–100 employees" (too wide)
• Weak offer: features, not outcomes
• Wrong channel: LinkedIn DMs without warm intent
Visual: 3-item list, numbered

Frame 3 — Agitation (make it real):
Headline: "Result: you're getting replies but no meetings."
Body: "Or worse — silence. Your product is working. Your offer isn't landing."
Visual: Silence emoji / unread DM mockup concept

Frame 4 — Solution (concrete, not fluffy):
Headline: "A 2-week RevOps sprint rebuilds the offer and the outreach."
Body:
• Week 1: ICP audit + one high-converting offer
• Week 2: Test with real prospects + book 3–5 calls
• Fixed scope. Fixed price. One decision.

Frame 5 — Proof placeholder:
Headline: "[Operator: insert one founder result here]"
Body: "'We booked X calls in Y days.' — Name, Company"
Note: Leave blank until real case study is ready. Do not fabricate.

Frame 6 — CTA:
Headline: "One question: Is your current offer landing?"
Body: "DM me the word 'offer' and I'll tell you exactly what's wrong — in 24h."
Visual: Clean, single CTA button concept`,
      }
    case "landing-section":
      return {
        title: `Landing Section — ${date} — Hero + Benefits`,
        content: ch + `LANDING PAGE — Above the Fold + Benefit Section
Product: ${PRODUCT}
ICP: ${ICP}

━━ HERO SECTION ━━

H1: "Turn Your Pipeline From Leaky to Loaded — in 14 Days"
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer, tests it with your exact ICP, and books 3–5 qualified intro meetings. €2,500–€4,500. No retainer."

Primary CTA: "Book Your Pipeline Audit (Free, 20 min)"
Secondary CTA: "See how it works →"

Trust element: "Used by ${niche} founders at seed and pre-Series A"

━━ BENEFIT SECTION ━━

What you get in 14 days:

1. ICP Audit
   Before we write a single word, we diagnose why your current outreach isn't landing.
   You get a written teardown with 3 concrete fixes.

2. One High-Converting Offer
   Not a deck. Not a brochure. One sharp, outcome-led offer your ICP actually reads.
   Built around their language, their pain, their buying trigger.

3. 3–5 Qualified Intro Meetings
   We test the offer with real prospects in your ICP. You get meetings booked.
   If we don't hit 3, Week 2 is free.

━━ PRICING BLOCK ━━

Fixed Sprint: €2,500–€4,500
- Week 1: Audit + offer build (€1,500–€2,000)
- Week 2: Test + booking (€1,000–€2,500)
- Add-on: Full outbound sequence (+€750)
- Add-on: LinkedIn content pack (+€500)

Guarantee: 3 qualified meetings or Week 2 free.

Note: Operator must approve all copy before publishing. Do not publish without review.`,
      }
    case "campaign-angle":
      return {
        title: `Campaign Angle — ${date} — Q3 Positioning`,
        content: ch + `CAMPAIGN ANGLE — Strategic Concept
Quarter: Q3 / Audience: ${niche}
Product: ${PRODUCT}

ANGLE: "The Founder's Tipping Point"

Insight: Seed-stage founders hit a critical moment at $20K–$40K MRR. They've proven the product works, but they can't scale pipeline without changing how they sell. This is the tipping point — and the window for a sprint offer.

Narrative arc:
1. Recognition: "You're not stuck. You're at the tipping point."
2. Tension: "At this stage, the old playbook (founder selling everything manually) stops scaling."
3. Solution: "One sprint resets your outbound. You don't need more volume. You need a better offer."
4. Proof: [operator inserts real case study]
5. Action: Book a 20-min audit

Channel plan:
• LinkedIn organic: 3 posts/week, founder-voice, story-driven
• Cold email: 30–50 new contacts/week, offer-led subject lines
• Retargeting: 30-day cookie, short copy, €15/day budget
• Referral: ask 3 existing clients for one intro

KPIs to track:
- Hook engagement rate (target > 3% on LinkedIn)
- Email open rate (target > 35%)
- Audit booking rate from landing page (target > 4%)
- Cost per booked call (target < €200)

Review this angle in 30 days. Adjust based on which channel converts.`,
      }
    default: // ad-pack
      return {
        title: `Ad Pack — ${date} — Multi-Channel`,
        content: ch + `AD PACK — Multi-Channel
Target: ${ICP} / Niche focus: ${niche}
Product: ${PRODUCT}

━━ LINKEDIN SPONSORED ━━

Headline: "14-Day Pipeline Sprint — Fixed Scope, Guaranteed Audit"
Body (150 chars): "SaaS founders: stop guessing why outreach fails. We audit your ICP + build one high-converting offer in 14 days. €2,500–€4,500. 3 meetings or Week 2 is free."
CTA button: "Book Audit"
Targeting: Job title = Founder/CEO/Co-founder | Company size: 10–50 | Industry: Software/SaaS

━━ COLD EMAIL SUBJECT LINES (A/B) ━━

A: "Your pipeline (quick question)"
B: "14 days to 3 qualified calls — founders only"
C: "Why your outreach isn't landing [and what fixes it]"

━━ RETARGETING SHORT COPY ━━

"Still thinking about the pipeline sprint? Scope is limited to 3 founders per month. One spot left for ${new Date(date).toLocaleString("en", { month: "long" })}."

━━ FACEBOOK/INSTAGRAM (if tested) ━━

Headline: "SaaS founder? Your offer might be the problem."
Body: "We've helped founders at $20K–$50K MRR book 3–5 qualified calls in 14 days — without hiring an SDR. Fixed-scope sprint. Fixed price."
CTA: Learn More → [landing page]

━━ BUDGET GUIDANCE ━━

LinkedIn: €20–€40/day | CPL target: < €150
Retargeting: €15/day | CPL target: < €80
Cold email: No direct cost — tool cost only
Total monthly: €1,050–€1,650 + operator time

Operator: All copy must be personalised before publishing. Budgets are estimates only.`,
      }
  }
}

// ─── Sales generators ─────────────────────────────────────────────────────────

function sales(taskType: string, date: string, constraints: string[]): Generated {
  const niche = extractNicheFocus(constraints) || "SaaS"
  const ch = constraintHeader(constraints)

  switch (taskType) {
    case "objection-map":
      return {
        title: `Objection Map — ${date} — RevOps Sprint`,
        content: ch + `OBJECTION MAP — 8 Common Objections + Responses
Product: ${PRODUCT}

1. "Too expensive for where we are."
   Root cause: Price/value mismatch or wrong ICP
   Response: "What's one booked call worth to your business right now? If it's > €500, the math works. And we have a Week-2-free guarantee if we don't hit 3 calls."
   Escalation: Offer a paid 90-min ICP audit (€350) as a low-risk entry.

2. "We already have an SDR."
   Root cause: Perceived overlap
   Response: "Great. Is your SDR hitting quota consistently? This sprint isn't headcount — it's the offer your SDR sends. We make their work convert, not replace them."

3. "I need to think about it."
   Root cause: No urgency / no clarity
   Response: "Totally fair. What's the one thing you'd need to see to make this a yes?"
   Then: close on a specific next step, not just "follow up."

4. "We don't have the bandwidth right now."
   Root cause: Perceived complexity
   Response: "The sprint requires 2 hours of your time in Week 1 for the ICP interview. After that, we handle everything. Your job is to approve or reject what we produce."

5. "We'll do this ourselves."
   Root cause: Trust gap or cost sensitivity
   Response: "Absolutely. Most founders do — and it takes 3–4 months. If you want to move faster, this sprint compresses that into 14 days."

6. "Can you do it for less?"
   Root cause: Budget constraint or anchoring
   Response: "The fixed price reflects a fixed scope. If you reduce the scope, we reduce the price. What would you cut: the offer build or the testing week?"

7. "I don't have a list / contacts to test with."
   Root cause: Prospect doesn't understand the service
   Response: "That's exactly what we solve. We build the ICP list as part of Week 1. You don't need contacts before we start."

8. "How do I know this will work for ${niche}?"
   Root cause: Niche specificity concern
   Response: "The offer framework works across B2B verticals. We tailor the language to your ICP in Week 1. [Operator: add niche-specific case study here when available.]"`,
      }
    case "follow-up-script":
      return {
        title: `Follow-Up Script — ${date} — 3-Touch Sequence`,
        content: ch + `FOLLOW-UP SEQUENCE — 3 Touches After First Contact
Context: Prospect expressed interest but hasn't booked / hasn't replied

━━ TOUCH 1 — Day 1–2 After First Contact ━━

Subject: "Quick follow-up — pipeline sprint"
Body:
"Hi [Name],

Following up on my note about the RevOps sprint for ${niche} founders.

One question: is your current outreach producing qualified meetings, or are you getting polite replies that don't convert?

If it's the latter — that's fixable in 14 days. Happy to walk you through how.

[CTA: 10-min call this week?]"

━━ TOUCH 2 — Day 3–4 ━━

Subject: "[Resource] Why offers fail at seed stage"
Body:
"Hi [Name],

Sharing something that's come up a lot with ${niche} founders I work with:

The offer isn't the problem. The framing is.

[Brief insight — 2 sentences max. Make it specific to their situation if possible.]

Still happy to do the 20-min pipeline audit — no commitment. Want to grab 15 min this week?"

━━ TOUCH 3 — Day 7 (Breakup) ━━

Subject: "Closing the loop"
Body:
"Hi [Name],

I don't want to keep your inbox busy if the timing isn't right.

If pipeline is something you're actively working on in the next 30 days, I'm here. If not, I'll reach back out next quarter.

Either way — good luck with the sprint."

Notes for operator:
- Never send Touch 3 without personalising
- If they reply at any point, switch to conversation mode immediately
- Track reply rate by touch; cut whichever touch underperforms`,
      }
    case "qualification-questions":
      return {
        title: `Qualification Questions — ${date} — BANT + Pain`,
        content: ch + `QUALIFICATION FRAMEWORK — 10 Questions
Context: First 20-min discovery call with ${niche} founder

━━ COMPANY CONTEXT (2 min) ━━

1. "Walk me through where you are in the business — revenue, team size, how long you've been selling."
   → Listen for: $15K–$60K MRR, 5–20 person team, 6–24 months post-launch

2. "Who's running outbound right now — you, a co-founder, someone you hired?"
   → Listen for: founder-led or early first hire (not a built-out SDR team)

━━ PAIN IDENTIFICATION (8 min) ━━

3. "What's the pipeline situation looking like? Are you getting enough qualified conversations?"
   → Listen for: inconsistency, low conversion, reliance on warm network

4. "When you reach out to a prospect today, what does your offer look like?"
   → Listen for: generic pitch, feature-led copy, no clear outcome statement

5. "How long does it typically take from first contact to a booked call?"
   → Listen for: > 2 weeks = offer/outreach problem; no answer = no system

6. "What have you tried to fix this already?"
   → Listen for: ad spend, SDR hire, content — shows sophistication level

7. "What happens if pipeline stays at this level for another 90 days?"
   → Listen for: real urgency vs nice-to-have

━━ AUTHORITY + TIMING (5 min) ━━

8. "If we ran the sprint and you loved the result, who else would need to sign off on continuing to work together?"
   → Listen for: solo decision or investor/board veto

9. "What does your timeline look like? When would you want to start seeing results?"
   → Listen for: within 30 days = high intent; "eventually" = nurture sequence

10. "What would make this a clear yes for you?"
    → Unblocks the real objection if they haven't stated it

Notes: Score each answer 1–3. Total ≥ 22 = strong qualified lead. Total < 15 = nurture.`,
      }
    case "offer-draft-template":
      return {
        title: `Offer Draft Template — ${date} — Fill-In Version`,
        content: ch + `OFFER DRAFT TEMPLATE — Fractional RevOps Sprint
Operator: fill in [brackets], remove instruction notes before sending

━━ SUBJECT ━━
"[Outcome in 8 words or fewer] — [timeframe]"
Example: "3 qualified calls in 14 days — [Niche] founders"

━━ OPENING (1–2 sentences) ━━
"[Name], [observation about their specific situation based on research].
I work with ${niche} founders who [shared pain point] — and there's a specific fix that works in 2 weeks."

━━ OFFER BLOCK ━━
Here's what I'm proposing:

• Week 1: ICP audit + one high-converting offer built for your exact buyer
• Week 2: Test with [X] prospects from your ICP + [Y] booked intro calls

Investment: €[amount] fixed. No retainer. No bloat.
[Add: guarantee statement if applicable]

━━ SOCIAL PROOF ━━
"[Case study or founder quote — operator must provide. Do not fabricate.]"

━━ CTA ━━
"One question: [specific question relevant to their situation]?
If yes — [clear next step, e.g., 'I have 15 min on Thursday at 2pm CET']."

━━ P.S. ━━
"[Relevant detail that shows you did research on them — company news, a post they wrote, a product update.]"

━━ SCORING CHECKLIST ━━
Before sending, confirm:
□ ICP match: Yes / No
□ Real pain stated (not assumed): Yes / No
□ Specific outcome promised: Yes / No
□ Price clear: Yes / No
□ CTA has one specific action: Yes / No
□ P.S. is personalised: Yes / No

Only send if all 6 are checked.`,
      }
    default: // pitch-pack
      return {
        title: `Pitch Pack — ${date} — Executive Summary`,
        content: ch + `PITCH PACK — Executive Summary Deck
Audience: ${ICP} / Niche: ${niche}
Product: ${PRODUCT}

━━ SLIDE OUTLINE (8 slides, 15–20 min presentation) ━━

Slide 1 — Title
"How to Add $50K Pipeline in 14 Days Without Hiring an SDR"
Your name, company, date

Slide 2 — The Problem (Their World)
"At seed stage, founder-led sales hits a ceiling."
• Pipeline is inconsistent — feast or famine
• Offer is feature-led, not outcome-led
• Warm network is running dry
• Hiring an SDR costs €5K/month and takes 3 months to ramp

Slide 3 — The Turning Point
"The bottleneck isn't volume. It's your offer."
One specific example of a weak vs strong offer side-by-side.

Slide 4 — The Solution
"A 2-week RevOps sprint: audit + offer + meetings."
Week 1: ICP audit, offer rewrite, prospect list
Week 2: Test with real prospects, book 3–5 calls

Slide 5 — Why This Works
3 proof points (operator: replace with real case data):
1. [Founder name] booked [X] calls in [Y] days — [sector]
2. [Metric: offer open rate / reply rate / conversion]
3. [Before/after comparison]

Slide 6 — Pricing + Scope
€2,500–€4,500 fixed. What's included. What's not.
Guarantee: 3 meetings or Week 2 is free.

Slide 7 — Next Step
"One action: book a 20-min pipeline audit."
Calendar link / direct CTA.

Slide 8 — Q&A

Speaker notes (Slide 3): Pause here. Ask "Does this sound familiar?" — wait for yes before moving on.
Speaker notes (Slide 6): Don't negotiate on price without reducing scope first.`,
      }
  }
}

// ─── Delivery generators ──────────────────────────────────────────────────────

function delivery(taskType: string, date: string, constraints: string[]): Generated {
  const ch = constraintHeader(constraints)

  switch (taskType) {
    case "onboarding-checklist":
      return {
        title: `Onboarding Checklist — ${date} — Sprint Week 1–2`,
        content: ch + `SPRINT ONBOARDING CHECKLIST
Product: ${PRODUCT}
Owner: Operator (check off each item before moving to next)

━━ PRE-SPRINT (Before Day 1) ━━
□ Contract signed + invoice sent
□ Kickoff call scheduled (Day 1, 60 min)
□ Client fills onboarding form (ICP, product, current outreach samples)
□ Access granted: CRM read-only (if applicable), LinkedIn, email tool
□ Shared Notion/Drive folder created

━━ WEEK 1 — Audit + Offer Build ━━

Day 1 — Kickoff (60 min):
□ ICP interview: who is the buyer, what do they care about, what have they tried
□ Review current offer / outreach samples
□ Align on success definition: what does "3 qualified calls" mean to them
□ Set Week 1 deliverables + review date (Day 5)

Day 2–3 — ICP Audit:
□ Map current ICP against 4 dimensions: industry, size, role, pain
□ Identify top 1–3 ICP segments
□ Document "wrong ICP" signals to filter out
□ Draft ICP one-pager (1 page, operator reviews)

Day 4 — Offer Build:
□ Draft offer (using offer draft template from sales_asset)
□ Score against KPIs: clarity, price, margin, CTA
□ Internal review (factory agent F equivalent)
□ Revise if score < 0.75

Day 5 — Delivery Review:
□ Present ICP audit + offer to client (30 min)
□ Collect feedback (written, same day)
□ Confirm approval to proceed to Week 2

━━ WEEK 2 — Test + Booking ━━

Day 6–7 — Prospect List:
□ Build list: 50–100 contacts matching ICP
□ Validate: name, title, company, LinkedIn, email
□ Segment by ICP tier (A = perfect match, B = strong, C = borderline)

Day 8–10 — Outreach:
□ Send offer to Tier A prospects (20–30 contacts)
□ Track: sent / opened / replied / booked
□ Follow-up Touch 1 on Day 2 after send
□ Follow-up Touch 2 on Day 4 after send

Day 11–12 — Calls + Conversion:
□ Conduct booked calls (operator or client)
□ Qualify each call against framework
□ Document qualified vs unqualified

Day 13 — Wrap-Up:
□ Count booked qualified calls (target: 3+)
□ Prepare Week 2 report (1 page)

Day 14 — Sprint Close:
□ Deliver final report: ICP audit + offer + outreach results + pipeline impact
□ Invoice: Week 2 payment
□ Offer: retainer proposal or next sprint brief
□ Archive all assets to Warehouse`,
      }
    case "dashboard-component-plan":
      return {
        title: `Dashboard Component Plan — ${date} — RevOps Sprint View`,
        content: ch + `DASHBOARD COMPONENT PLAN — RevOps Sprint View
Purpose: Operator visibility into sprint health for the ${PRODUCT}

━━ COMPONENT 1 — Pipeline Health Score ━━
Type: KPI card (single number)
Data: (qualified calls booked / target) × 100
Display: Large number + colour (green ≥ 80%, yellow 50–79%, red < 50%)
Update: Per sprint day

━━ COMPONENT 2 — Outreach Funnel ━━
Type: Horizontal funnel chart
Stages: Contacted → Opened → Replied → Called → Qualified
Data source: Outreach tracker (manual entry or CRM)
Display: Count + conversion % at each stage
Benchmark: Industry avg shown as grey line

━━ COMPONENT 3 — Offer Score Timeline ━━
Type: Line chart
Data: Offer quality score by iteration (1st draft, revised, final)
X-axis: Iteration number | Y-axis: Score (0–1)
Threshold line: 0.75 (pass/fail)

━━ COMPONENT 4 — Prospect Tier Breakdown ━━
Type: Donut chart
Segments: Tier A / Tier B / Tier C / Disqualified
Data source: Prospect list with tier labels
Use: Shows whether list quality matches ICP

━━ COMPONENT 5 — Day-by-Day Activity Log ━━
Type: Timeline/table
Columns: Date, Action, Output, Status
Data: Manual or imported from Factory event log
Filter: By sprint day, by agent, by status

━━ COMPONENT 6 — Cost per Booked Call ━━
Type: KPI card
Formula: Total sprint cost ÷ qualified calls booked
Display: €[amount] + trend vs previous sprint
Target: < €500 per qualified call

Implementation notes:
- All components use data from FactoryStore or manual input
- No third-party dashboard tool required — this plan is for a custom build
- Operator approves component design before any dev work begins`,
      }
    case "landing-template":
      return {
        title: `Landing Template — ${date} — One-Page Sprint Page`,
        content: ch + `LANDING PAGE TEMPLATE — One-Page Sprint Offer
Purpose: Standalone page for the ${PRODUCT}
Operator: Fill [brackets], remove instruction text, review before publishing

━━ NAV (minimal) ━━
Logo | "Book Audit" button (primary, top-right)

━━ HERO ━━
H1: "[Pain-first headline — 6–10 words]"
Example: "Your Pipeline Is Stalling. Here's the 14-Day Fix."
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer and books 3–5 qualified intro meetings for ${ICP}."
CTA: "Book Your Free 20-Min Pipeline Audit →"
Trust line: "Fixed scope. Fixed price. 3 meetings or Week 2 is free."

━━ PROBLEM SECTION ━━
H2: "Sound familiar?"
3-column grid:
• Column 1: "Your outreach gets polite replies, not meetings."
• Column 2: "You're not sure if the problem is the offer or the list."
• Column 3: "You don't have bandwidth to run experiments for 3 months."

━━ SOLUTION SECTION ━━
H2: "The Sprint"
Two-column layout:

Week 1 — Audit + Offer Build (€1,500–€2,000):
• ICP deep-dive interview (60 min — your only time commitment)
• Full audit of your current offer and outreach
• One rewritten offer, scored and validated
• Prospect list: 50+ contacts matching your ICP

Week 2 — Test + Booking (€1,000–€2,500):
• Outreach to 20–30 Tier A prospects
• 3-touch follow-up sequence
• Target: 3–5 qualified intro meetings booked
• Full results report

━━ PROOF SECTION ━━
H2: "Results"
[Operator: insert 1–2 real case studies. Do not fabricate. Leave blank until ready.]

━━ PRICING ━━
Fixed Sprint: €2,500–€4,500
Guarantee: 3 meetings or Week 2 is free.
"No retainer. No scope creep. One decision."

━━ CTA SECTION ━━
H2: "Book your audit"
Subhead: "Free, 20 minutes, no commitment."
[Calendar embed or booking form]

━━ FOOTER ━━
Contact | Privacy (basic) | No cookie banner needed (no tracking without consent)`,
      }
    case "repo-task-draft":
      return {
        title: `Repo Task Draft — ${date} — Sprint Deliverables`,
        content: ch + `REPOSITORY TASK DRAFTS — Sprint Delivery Issues
Project: ${PRODUCT}
Format: GitHub Issues (copy-paste ready)

━━ ISSUE 1 ━━
Title: "ICP Audit: Define Tier A/B/C criteria for current sprint"
Labels: delivery, week-1, sprint
Body:
Define qualification tiers for the current sprint's ICP:
- Tier A: Perfect match — move to outreach immediately
- Tier B: Strong match — include in outreach with modified copy
- Tier C: Borderline — do not include in this sprint's outreach

Deliverable: One-page ICP criteria document (Notion or MD file)
Owner: [Assign]
Due: Day 3 of sprint

━━ ISSUE 2 ━━
Title: "Offer Build: Draft v1 + score against KPIs"
Labels: delivery, week-1, offer
Body:
Using the ICP Audit output and the offer draft template (sales_asset):
1. Draft offer v1
2. Run through Agent F scoring checklist (offer clarity, price, margin, CTA)
3. If score < 0.75: revise and re-score (max 1 revision)
4. Deliver final offer to client for approval

Deliverable: Final approved offer (plain text, reviewed by operator)
Owner: [Assign]
Due: Day 5 of sprint

━━ ISSUE 3 ━━
Title: "Prospect List: 50+ Tier A contacts for outreach"
Labels: delivery, week-2, prospecting
Body:
Build a validated list of 50–100 contacts:
- Match ICP Tier A criteria from Issue 1
- Fields: Name, Title, Company, Company Size, LinkedIn URL, Email
- Source: LinkedIn Sales Navigator / Apollo / manual research
- No scraping of private/logged-in data

Deliverable: CSV in shared Drive. Reviewed by operator before outreach.
Owner: [Assign]
Due: Day 7 of sprint

━━ ISSUE 4 ━━
Title: "Outreach: Send + track 3-touch sequence"
Labels: delivery, week-2, outreach
Body:
Using the follow-up script (sales_asset):
1. Send Touch 1 to all Tier A prospects
2. Track: sent / opened / replied / booked
3. Send Touch 2 on Day 2 after Touch 1
4. Send Touch 3 (breakup) on Day 4 after Touch 2
5. Report booked calls daily

Deliverable: Daily log (date, action, replies, calls booked)
Owner: [Assign]
Due: Day 12 (ongoing from Day 8)

━━ ISSUE 5 ━━
Title: "Sprint Close: Deliver final report + offboarding"
Labels: delivery, week-2, close
Body:
Compile:
- ICP Audit (Week 1 output)
- Final offer (approved version)
- Outreach results: sent / replied / booked / qualified
- Pipeline impact: calls booked × estimated deal value
- Recommendation: retainer / next sprint / hold

Deliver to client. File to Warehouse. Close sprint.
Owner: [Assign]
Due: Day 14`,
      }
    default: // demo-block
      return {
        title: `Demo Block — ${date} — 20-Min Sprint Demo`,
        content: ch + `DEMO SCRIPT — 20-Minute RevOps Sprint Demo
Audience: ${ICP} / Context: Discovery call after qualification

━━ SEGMENT 1 — Frame the Problem (3 min) ━━

"Before I show you anything, I want to make sure we're solving the right problem.

Most founders I work with at [their stage] have the same 3 issues:
1. Pipeline is inconsistent — you close well but can't get enough first calls
2. Outreach feels like throwing darts in the dark
3. You don't know if the problem is the offer, the list, or the channel

Which of those resonates most for you right now?"

[Wait. Let them answer. Don't rush past this.]

━━ SEGMENT 2 — Show the Audit (5 min) ━━

"Here's what Week 1 looks like. I'm going to show you an example ICP audit I did for a founder similar to you."

[Show: 1-page ICP audit example — redacted if real client, placeholder if not]

Key points to highlight:
- We start with their language, not our assumptions
- We score the current offer before building a new one
- The output is a written deliverable, not just a conversation

Pause: "Does this make sense as a starting point?"

━━ SEGMENT 3 — Show the Offer (5 min) ━━

"Here's a before/after offer example."

[Show: before (generic pitch) vs after (outcome-led, specific, scored)]

"The before is what most founders are sending. The after is what we build in Week 1."

"How does your current offer compare to the 'before' or the 'after'?"

━━ SEGMENT 4 — Week 2 Results (4 min) ━━

"Week 2: we take the new offer, build a 50-contact prospect list, and run the outreach.

[Operator: insert real result here — calls booked, timeline, sector]

The goal is 3 qualified calls minimum. If we don't hit it, Week 2 is free."

━━ SEGMENT 5 — Pricing + CTA (3 min) ━━

"The sprint is €2,500–€4,500 fixed. Here's exactly what that includes."
[Show: scope breakdown — do not negotiate during the demo]

"What would make this a clear yes for you today?"

[Wait. Don't fill the silence. Let them respond.]

Notes: Never demo more than 20 minutes. If they're not engaged by Segment 3, ask a direct question.`,
      }
  }
}

// ─── Research generators ──────────────────────────────────────────────────────

function research(taskType: string, date: string, constraints: string[]): Generated {
  const doy = dayOfYear(date)
  const niche = SAAS_NICHES[doy % SAAS_NICHES.length] ?? "B2B SaaS"
  const nicheFocus = extractNicheFocus(constraints) || niche
  const ch = constraintHeader(constraints)

  switch (taskType) {
    case "niche-research":
      return {
        title: `Niche Research — ${date} — ${nicheFocus}`,
        content: ch + `NICHE RESEARCH REPORT
Niche: ${nicheFocus}
ICP: ${ICP}

━━ NICHE SUMMARY ━━

${nicheFocus} is a sub-segment of the B2B SaaS market with the following characteristics:
- Typical company size: 10–100 employees
- Revenue range at seed: $10K–$80K MRR
- Primary buying trigger: [founder is selling everything manually and hitting a ceiling]
- Key pain: inconsistent pipeline; reliance on referrals

━━ MARKET SIZE SIGNALS (from public sources — operator to verify) ━━

- Number of ${nicheFocus} companies in EU+UK: estimate 500–2,000 (based on LinkedIn filters)
- Annual growth: 15–25% based on VC investment trends
- Saturation risk: Low to medium — space is growing faster than outbound capacity

━━ PAIN POINTS SPECIFIC TO THIS NICHE ━━

1. Long sales cycles (30–90 days) compress MRR predictability
2. Founders often sell to peers — hard to separate social from commercial relationships
3. ICP definition is blurry: "any company that could use us" syndrome
4. Pricing is often undervalued — founders undercharge because they fear churn

━━ OFFER ANGLES FOR THIS NICHE ━━

1. "Get your first 10 paying customers outside your network" (relevance: high)
2. "Convert demo requests into paid contracts faster" (relevance: medium)
3. "Build a repeatable outbound system before you hire your first SDR" (relevance: high)

━━ CHANNEL RECOMMENDATIONS ━━

- LinkedIn: Strong — founders in ${nicheFocus} are active
- Cold email: Medium — open rates 25–35% with personalisation
- Community: Look for Slack groups, Discord servers specific to ${nicheFocus}
- Warm intro: Highest conversion — ask existing clients for 2 intros each

━━ KEYWORD RESEARCH STARTING POINTS ━━

Commercial: "${nicheFocus} sales consultant", "${nicheFocus} outbound", "${nicheFocus} pipeline"
Informational: "how to sell [niche] software", "${nicheFocus} go-to-market"

━━ NEXT STEP ━━

Operator: confirm if this niche is in our current ICP filter. If yes, add to prospect list sourcing criteria.`,
      }
    case "keyword-set":
      return {
        title: `Keyword Set — ${date} — Organic + Paid`,
        content: ch + `KEYWORD SET — SEO + PPC
Target: ${nicheFocus} founders | Product: ${PRODUCT}

━━ COMMERCIAL INTENT KEYWORDS (high priority for paid) ━━

Tier 1 — Direct match (small volume, high intent):
• "revops consultant for startups" (est. 50–200/mo)
• "b2b saas outbound consultant" (est. 100–300/mo)
• "pipeline sprint b2b" (est. 10–50/mo — niche, low competition)
• "fractional revops" (est. 200–500/mo — growing)
• "saas founder sales help" (est. 50–150/mo)

Tier 2 — Broader commercial (higher volume, more competition):
• "b2b sales consultant" (est. 1K–3K/mo)
• "startup sales consultant" (est. 500–1K/mo)
• "outbound sales strategy" (est. 2K–5K/mo)

━━ INFORMATIONAL INTENT (good for LinkedIn + content) ━━

• "why b2b saas pipeline stalls"
• "how to write a sales offer for startups"
• "seed stage outbound strategy"
• "icp qualification framework"
• "how to qualify leads saas"
• "sales script for saas founders"
• "how to get first b2b customers"
• "when to hire first sdr"
• "fractional sales consultant vs sdr"

━━ NEGATIVE KEYWORDS (exclude to avoid wasted spend) ━━

• "free" • "template only" • "enterprise" (> 500 employees)
• "ecommerce" • "b2c" • "marketing agency"

━━ SEMANTIC CLUSTERS ━━

Cluster 1 — Pipeline: pipeline, qualified leads, booked calls, outbound, meetings
Cluster 2 — Offer: offer writing, sales copy, value proposition, pitch
Cluster 3 — Consulting: consultant, fractional, sprint, revops, revenue operations
Cluster 4 — Stage: seed stage, pre-series a, early stage, founder-led sales

━━ SUGGESTED CONTENT PIECES ━━

1. "The Seed-Stage Pipeline Audit: 5 Questions That Diagnose Your Outbound" (organic)
2. "What Is a RevOps Sprint? (And Is It Right for Your Stage?)" (comparison)
3. "ICP vs Persona: Why Founders Confuse Them and Lose Deals" (informational)

Operator: Validate search volumes in Google Keyword Planner or Ahrefs before running paid ads.`,
      }
    case "opportunity-map":
      return {
        title: `Opportunity Map — ${date} — 5 Whitespace Opportunities`,
        content: ch + `OPPORTUNITY MAP — 5 Whitespace Opportunities
Lens: ${nicheFocus} / Product: ${PRODUCT}

━━ OPPORTUNITY 1 — Pre-Series A Timing ━━

Signal: Founders who just closed a seed round (€500K–€2M) have cash and urgency to prove pipeline before Series A.
Window: 3–6 months post-close
Entry: Monitor Crunchbase/LinkedIn for recent seed announcements in ${nicheFocus}
Offer angle: "You've raised. Now you need pipeline proof for your Series A deck."
Risk: Founder may hire in-house instead. Counter with speed argument (2 weeks vs 3 months to ramp).

━━ OPPORTUNITY 2 — Post-Product-Market Fit Stall ━━

Signal: Companies at €20K–€50K MRR with flat growth for 2+ months.
Window: Ongoing — look for "we have the product, struggling with growth" language in founder posts
Entry: LinkedIn content targeting this transition moment
Offer angle: "The product is working. The offer isn't landing yet."
Risk: Founders may attribute flat growth to product, not sales.

━━ OPPORTUNITY 3 — Failed SDR Hire ━━

Signal: Founders who hired and fired a first SDR within 6 months.
Window: 0–3 months after the failed hire
Entry: LinkedIn post listening ("we tried SDR and it didn't work")
Offer angle: "Before you hire again — let a sprint prove the offer works first."
Risk: Founder may be skeptical of all external sales help.

━━ OPPORTUNITY 4 — Conference Season Timing ━━

Signal: B2B SaaS events (SaaStock, SaaSOpen, Product-Led Summit) attract exactly the ICP.
Window: 3–4 weeks before each event
Entry: Event sponsorship (low cost) or side events / dinners
Offer angle: "Walk out of [event] with a 2-week sprint starting next Monday."
Risk: High competition from other consultants at same events.

━━ OPPORTUNITY 5 — Community Trust Plays ━━

Signal: Founder Slack groups, Indie Hackers, SaaS communities have active Q&A on sales/outbound.
Window: Ongoing — allocate 2–3h per week
Entry: Answer questions genuinely for 30 days before pitching anything
Offer angle: Trust-based warm DM after 30 days of value-add
Risk: Time-intensive. Lower ROI per hour than direct outreach, but builds brand.

━━ PRIORITISATION ━━

Highest ROI: Opportunity 2 (PMF stall) — clearest pain, widest audience
Fastest to test: Opportunity 3 (failed SDR) — acute pain, immediate window
Operator: review this map monthly and mark which opportunities are active.`,
      }
    case "audience-list":
      return {
        title: `Audience Segmentation — ${date} — Target Personas`,
        content: ch + `AUDIENCE SEGMENTATION MATRIX
ICP: ${ICP} | Focus: ${nicheFocus}

━━ PERSONA 1 — The Overwhelmed Founder ━━

Profile:
- Revenue: $15K–$35K MRR
- Stage: 12–24 months post-launch
- Team: 3–8 people (no dedicated sales)
- Pain: "I'm closing deals from my network but I can't scale it"
- Trigger: Warm network is drying up, next hire is unclear

Messaging angle: "You don't need more calls. You need a better offer."
Channel: LinkedIn DM (they're active), direct email
Content type: Short diagnostic (3 questions that show them the problem)

━━ PERSONA 2 — The Frustrated Experimenter ━━

Profile:
- Revenue: $30K–$60K MRR
- Stage: Has tried ads, SDR, cold email — mixed results
- Team: 5–15 people (1 sales hire, not performing)
- Pain: "We're spending on outbound but it's not converting"
- Trigger: Q2 pipeline is below plan; pressure from investors

Messaging angle: "Before you spend more — fix the offer first."
Channel: LinkedIn + cold email with case study
Content type: Before/after offer teardown

━━ PERSONA 3 — The Pre-Series A Founder ━━

Profile:
- Revenue: $40K–$80K MRR
- Stage: 18–36 months, planning Series A in 6–12 months
- Team: 10–25 people (building out go-to-market)
- Pain: "We need to show investors a predictable pipeline"
- Trigger: Series A prep — needs repeatable sales proof

Messaging angle: "Predictable pipeline before you raise. The sprint is the proof."
Channel: Warm intro or event-based (SaaStock, etc.)
Content type: ROI calculator + deck contribution

━━ SCORING MATRIX ━━

Score each prospect 1–3 on each dimension:
- Revenue stage fit (1=outside range, 2=edge, 3=perfect match)
- Role (1=not decision-maker, 2=influencer, 3=sole decision-maker)
- Pain signal present (1=none, 2=mild, 3=explicit)
- Timing signal (1=no urgency, 2=watching, 3=active buyer)

Total 10–12: Tier A | Total 7–9: Tier B | Total < 7: Nurture only`,
      }
    default: // lead-source-list
      return {
        title: `Lead Source List — ${date} — 8 Validated Sources`,
        content: ch + `LEAD SOURCE LIST — 8 Validated Sources
ICP: ${ICP} | Focus: ${nicheFocus}

Quality rating: ★★★ High | ★★ Medium | ★ Low

━━ SOURCE 1 — LinkedIn Sales Navigator ★★★ ━━

Filters: Job Title: Founder/CEO/Co-Founder | Company Size: 10–50 | Industry: Software
Free signal: Posts containing "pipeline", "outbound", "MRR", "seed stage"
Reach: Thousands — filter to 50–100 Tier A per sprint
Cost: €65–€100/month for Navigator
Note: Do not scrape. Manual review of profiles before outreach.

━━ SOURCE 2 — Crunchbase (seed rounds) ★★★ ━━

Filter: Funding type = Seed | Amount: $250K–$3M | Date: Last 6 months | Category: SaaS/B2B
Signal: Recently funded = cash + urgency
Reach: 50–200 companies/month (EU + UK focus)
Cost: Free basic / $49/month Pro
Note: Cross-reference with LinkedIn to find founder contact.

━━ SOURCE 3 — Apollo.io ★★ ━━

Filters: Same as LinkedIn above
Advantage: Direct email included
Risk: Data quality varies — verify before outreach
Cost: $49–$99/month
Note: Validate email addresses before sending cold email.

━━ SOURCE 4 — Indie Hackers / MicroConf community ★★ ━━

Signal: Founders who post about revenue milestones, outbound struggles
Reach: Smaller but high-intent
Method: Read + engage before DM. Never cold pitch in community threads.
Cost: Free

━━ SOURCE 5 — Product Hunt (Makers) ★★ ━━

Signal: Launched product in last 6 months + B2B category
Reach: 20–50 relevant founders/week
Method: Check "made by" profile → LinkedIn → qualify
Cost: Free

━━ SOURCE 6 — SaaStock / SaaSOpen (event lists) ★★★ ━━

Signal: Attending = active, growth-minded founder
Reach: 100–500 relevant contacts per event
Method: Pre-event LinkedIn outreach with event reference
Cost: Conference ticket or side event only

━━ SOURCE 7 — VC Portfolio Pages ★★ ━━

Seed-stage VC portfolio companies = pre-qualified funding signal
VCs to monitor: Seedcamp, LocalGlobe, Point Nine, Cherry Ventures (EU focus)
Method: Portfolio page → company → founder LinkedIn
Cost: Free | Volume: 20–50 new companies/month

━━ SOURCE 8 — Referral (existing clients) ★★★ ━━

Method: After sprint delivery, ask: "Who else in your network has the same pipeline problem?"
Conversion rate: 30–50% (warm intro vs cold)
Cost: Free | Risk: Low — trust is pre-established
Action: Build referral ask into sprint offboarding checklist

━━ PRIORITY ORDER FOR NEXT SPRINT ━━

1. Crunchbase (fresh signal) → 2. LinkedIn Nav (volume) → 3. Referral (highest conversion)`,
      }
  }
}

// ─── QA generators ────────────────────────────────────────────────────────────

function qa(taskType: string, date: string, constraints: string[]): Generated {
  const ch = constraintHeader(constraints)

  switch (taskType) {
    case "cleanup-report":
      return {
        title: `Cleanup Report — ${date} — Asset Library`,
        content: ch + `CLEANUP REPORT — Asset Library Review
Date: ${date}

━━ SCOPE ━━
Review all daily_review and warehouse assets for: stale content, outdated numbers, placeholder text, and copy debt.

━━ CLEANUP CHECKLIST ━━

Marketing assets:
□ Any hook that references a date > 30 days old → update or archive
□ Any copy that uses [placeholder] text → complete or trash
□ Landing sections with missing proof/case study → flag as "needs real data"
□ Campaign angles with no KPI tracking → add KPI block or archive

Sales assets:
□ Objection responses that mention competitors by name → remove (risk of inaccuracy)
□ Offer templates with prices not reviewed in 60 days → flag for pricing review
□ Follow-up scripts with broken structure (gaps in touch sequence) → fix
□ Qualification questions that reference stages that no longer match ICP → update

Delivery assets:
□ Checklists with tasks that reference unavailable tools → update
□ Demo scripts referencing case studies that aren't real yet → mark clearly as placeholder
□ Onboarding docs that don't match current sprint scope → sync

Research assets:
□ Lead source lists older than 90 days → re-validate (sources change)
□ Niche research with market size data > 1 year old → refresh or caveat
□ Keyword sets not validated in Search Console or Ahrefs → mark unvalidated

━━ COPY DEBT LOG ━━

Item: [Operator fills in each flagged asset]
Action needed: [update / trash / complete with real data]
Owner: [Operator]
Due: [within 7 days]

━━ RULE ━━
Assets in Warehouse should be deployment-ready. If an asset in Warehouse has a [placeholder], move it back to daily_review until complete.`,
      }
    case "agent-improvement-report":
      return {
        title: `Agent Improvement Report — ${date} — Pipeline Agents`,
        content: ch + `AGENT IMPROVEMENT REPORT
Date: ${date}

━━ METHODOLOGY ━━
Review last 7 days of Factory events. Score each agent on: output quality (0–1), speed (issues or delays), error rate.

━━ AGENT A — Signal Intake Officer ━━
Current performance: Categorises signals correctly for clear inputs. Misses category for ambiguous signals.
Improvement: Expand CATEGORY_KEYWORDS with 5 additional signal words per category.
Priority: Low

━━ AGENT B — ICP Qualifier ━━
Current performance: Threshold at 0.5 works well. Some borderline signals (score 0.45–0.55) are unclear.
Improvement: Add confidence band: 0.45–0.55 = "borderline — operator review recommended"
Priority: Medium

━━ AGENT C — Lead Enricher ━━
Current performance: Buyer persona assignment is too generic ("Founder / CEO").
Improvement: Add domain-specific buyer types (e.g., "Technical Founder", "Commercial Founder", "Repeat Founder")
Priority: Low

━━ AGENT D — Offer Strategist ━━
Current performance: Positioning block is binary (direct outbound / consultative). Real signals are more nuanced.
Improvement: Add 3rd positioning type: "Social proof first" for founders with strong testimonials
Priority: Medium

━━ AGENT E — Offer Builder ━━
Current performance: Stub template is solid structure. Lacks variation over repeated runs.
Improvement: Add 3 alternative offer frameworks (AIDA, PAS, outcome-first) and rotate by signal type.
Priority: High

━━ AGENT F — Offer Evaluator ━━
Current performance: 4 KPIs cover the basics. Missing: personalisation score.
Improvement: Add KPI 5: personalisation — checks if offer references specific buyer pain, not generic.
Priority: Medium

━━ AGENT G — Offer Editor ━━
Current performance: CTA fix is effective. Price justification fix is too mechanical.
Improvement: Price justification should reference ROI framing, not just reword the pricing line.
Priority: Medium

━━ AGENTS H–N ━━
No active issues in current sprint. Review again in 30 days when volume increases.

━━ PRIORITY ACTIONS ━━
1. Agent E: Add offer framework rotation (this sprint)
2. Agent B: Add confidence band for borderline scores (next sprint)
3. Agent D: Add social-proof positioning type (next sprint)`,
      }
    case "weak-asset-review":
      return {
        title: `Weak Asset Review — ${date} — Low Score Items`,
        content: ch + `WEAK ASSET REVIEW — Low Quality Score Items
Date: ${date} | Threshold: qualityScore < 0.6

━━ REVIEW PROTOCOL ━━

1. Pull all daily digitals with qualityScore < 0.6 or status = needs_rework
2. For each: identify root cause of low score
3. Decide: rework, trash, or accept with caveat
4. Log decision with operator feedback for next mission run

━━ COMMON FAILURE MODES ━━

FAILURE MODE 1 — Too generic:
Symptom: Content reads as if written for any B2B company, not specifically for Seed-stage SaaS
Fix: Add ICP-specific numbers (MRR ranges), stage-specific language (seed/PMF/pre-series A)
Check: Does the asset pass the "could this apply to a plumber?" test? If yes → revise.

FAILURE MODE 2 — Missing numbers:
Symptom: No price, no timeline, no quantity, no target metric
Fix: Add at least 3 specific numbers (€ amount, number of days, number of calls)
Check: Count numbers in the asset. Target: ≥ 5 concrete numbers.

FAILURE MODE 3 — No CTA:
Symptom: Asset ends without a clear next step for the reader
Fix: Add one specific CTA — action + channel + timeframe
Check: Can the reader do something right now after reading this? If not → revise.

FAILURE MODE 4 — Stale constraints:
Symptom: Operator feedback from previous run is not addressed in the content
Fix: Re-run the generator with the constraint explicitly incorporated
Check: Read the constraint. Read the asset. Is the constraint visibly addressed? If not → rework.

FAILURE MODE 5 — Placeholder not filled:
Symptom: "[Operator to insert X]" appears in the content
Fix: Either fill in the real data or mark the asset as "blocked — needs data" and do not send to warehouse
Rule: No asset with an unfilled placeholder may enter Warehouse.

━━ SCORING RUBRIC ━━
0.0–0.4: Trash or major rework
0.4–0.6: Minor rework — fix identified failure mode
0.6–0.8: Accept with operator note
0.8–1.0: Accept and send to Warehouse`,
      }
    case "next-day-plan":
      return {
        title: `Next-Day Plan — ${date} — Tomorrow's Priorities`,
        content: ch + `NEXT-DAY PRODUCTION PLAN
Date: ${date} | Plan for: ${new Date(new Date(date).getTime() + 86400000).toISOString().slice(0, 10)}

━━ CARRY-FORWARD ITEMS (from today) ━━
[ ] Any assets in needs_rework status → rework first thing
[ ] Any approval queue items pending operator decision → resolve before running new missions
[ ] Any open feedback events → confirm addressed in today's generator run

━━ TOMORROW'S MISSION FOCUS ━━

Marketing: [operator: note any campaign that needs copy refresh or a new hook test]
Sales: [operator: note any objection that came up in calls this week — add to objection map]
Delivery: [operator: note any sprint step that took longer than planned — update checklist]
Research: [operator: note any niche or keyword that performed well — expand]
QA: [operator: review tomorrow's output against today's feedback before accepting]

━━ PRODUCTION RULES FOR TOMORROW ━━

1. Run runDailyMissions() at start of work session
2. Review all 5 outputs before accepting any
3. Apply existing operator feedback before accepting the marketing or sales asset
4. Do not send any asset to Warehouse with an unfilled placeholder
5. Close any needs_rework items from today before end of day

━━ DAILY PRODUCTION KPIs ━━

• 5 assets produced: Yes / No
• Assets reviewed by operator: Yes / No
• Assets accepted to Warehouse: __ / 5
• Assets sent to Trash: __ / 5
• Feedback events created: __ (target: 0, meaning all accepted)
• Time spent in review: __ min (target: < 30 min/day)

━━ WEEKLY REFLECTION (fill each Friday) ━━
• Best asset this week: [department + title]
• Weakest pattern: [failure mode that repeated]
• One change to make to generators next week: [specific]
• Operator satisfaction with the daily loop (1–10): [score]`,
      }
    default: // qa-report
      return {
        title: `QA Report — ${date} — Daily Production Audit`,
        content: ch + `DAILY PRODUCTION QA REPORT
Date: ${date}
Scope: All 5 daily digital deliverables

━━ QA CHECKLIST — Applied to Every Asset ━━

STRUCTURAL:
□ All required fields present (id, date, title, department, type, content, status, qualityScore)
□ No placeholder text left unfilled ("[bracket]" patterns)
□ Content length ≥ 400 characters (too short = low value)
□ At least 3 concrete numbers (price, timeline, or metric)
□ At least one clear call to action or next step

CONTENT QUALITY:
□ ICP-specific language used (references seed-stage, SaaS, MRR, or founder)
□ No fabricated data (no made-up case studies, fake company names, invented results)
□ Operator feedback from previous runs is addressed (if constraints exist)
□ No duplicate content from a previous date's production

COMPLIANCE:
□ No external sending instructions (all outreach requires operator approval)
□ No reference to specific prospect names without operator input
□ No pricing that contradicts the current operator-approved rate card
□ No automated action embedded (no "send this automatically" instructions)

━━ SCORING ━━

Pass all 16 checks: qualityScore = 0.9–1.0 → Accept
Pass 13–15 checks: qualityScore = 0.7–0.89 → Accept with note
Pass 10–12 checks: qualityScore = 0.5–0.69 → Needs rework
Pass < 10 checks: qualityScore < 0.5 → Reject to trash

━━ TODAY'S FINDINGS ━━
[Operator: fill in after reviewing each asset]

Marketing: __/16 checks passed | Action: __
Sales: __/16 checks passed | Action: __
Delivery: __/16 checks passed | Action: __
Research: __/16 checks passed | Action: __
QA: __/16 checks passed | Action: __

━━ OVERALL DAILY SCORE ━━
(Sum of qualityScores / 5) = __ | Target: ≥ 0.75`,
      }
  }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function generateContent(dept: DailyDigitalDepartment, taskType: string, date: string, constraints: string[]): Generated {
  switch (dept) {
    case "marketing": return marketing(taskType, date, constraints)
    case "sales": return sales(taskType, date, constraints)
    case "delivery": return delivery(taskType, date, constraints)
    case "research": return research(taskType, date, constraints)
    case "qa": return qa(taskType, date, constraints)
  }
}

/** Public generator — used by the order line and rework regeneration too. */
export function generateAssetContent(
  dept: DailyDigitalDepartment,
  taskType: string,
  date: string,
  constraints: string[],
): { title: string; content: string; qualityScore: number } {
  const g = generateContent(dept, taskType, date, constraints)
  return { title: g.title, content: g.content, qualityScore: scoreContent(g.content, constraints) }
}

// ─── Main export ──────────────────────────────────────────────────────────────

const DEPARTMENTS: DailyDigitalDepartment[] = ["marketing", "sales", "delivery", "research", "qa"]

export async function runDailyMissions(store: FactoryStore, date?: string): Promise<DailyDigital[]> {
  const today = date ?? new Date().toISOString().slice(0, 10)

  // Idempotent — skip if already run for today (client-order deliverables don't count)
  const existing = store.getDailyDigitalsForDate(today).filter((d) => !d.orderId)
  if (existing.length >= 5) return existing

  // Collect recent operator feedback per department (last 7 days)
  const constraintsByDept = store.getRecentFeedbackConstraints(7)

  const digitals: DailyDigital[] = []

  for (const dept of DEPARTMENTS) {
    const taskType = selectTaskType(dept)
    const constraints = constraintsByDept[dept] ?? []
    const generated = generateContent(dept, taskType, today, constraints)
    const score = scoreContent(generated.content, constraints)
    const missionId = `dm-${today}-${dept}`
    const digitalId = `dd-${today}-${dept}`
    const now = new Date().toISOString()

    const digital: DailyDigital = {
      id: digitalId,
      date: today,
      title: generated.title,
      department: dept,
      type: `${dept}_asset`,
      taskType,
      content: generated.content,
      status: "draft_ready",
      qualityScore: score,
      createdByAgentId: DEPT_AGENT[dept],
      linkedMissionId: missionId,
      revisionCount: 0,
      createdAt: now,
      updatedAt: now,
      location: "daily_review",
    }

    const mission: DailyMission = {
      id: missionId,
      date: today,
      department: dept,
      taskType,
      constraints,
      status: "complete",
      outputId: digitalId,
    }

    store.addDailyDigital(digital)
    store.addDailyMission(mission)
    void recordQualityIntegritySignal(store, DEPT_AGENT[dept], score, digitalId)

    const event: FactoryEvent = {
      id: randomUUID(),
      timestamp: now,
      agentId: DEPT_AGENT[dept],
      eventType: "daily.mission_complete",
      detail: `${dept}/${taskType} → ${digitalId} (score=${score})`,
    }
    store.addEvent(event)

    digitals.push(digital)
  }

  return digitals
}

// ─── Review action helpers (called by server) ─────────────────────────────────

export function acceptDigital(store: FactoryStore, id: string): void {
  const now = new Date().toISOString()
  store.updateDailyDigital(id, { status: "accepted", updatedAt: now })
  const d = store.getDailyDigital(id)
  if (!d) return
  void recordOperatorIntegritySignal(store, d.createdByAgentId, "accepted", d.id)
  store.addFeedbackEvent({
    id: randomUUID(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "accepted",
  })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.accepted",
    detail: `${d.title} accepted`,
  })
}

export function reworkDigital(store: FactoryStore, id: string, feedback: string): string {
  const now = new Date().toISOString()
  store.updateDailyDigital(id, { status: "needs_rework", operatorFeedback: feedback, updatedAt: now })
  const d = store.getDailyDigital(id)
  if (!d) return ""
  void recordOperatorIntegritySignal(store, d.createdByAgentId, "needs_rework", d.id)
  const revTaskId = `rev-${id}-${Date.now()}`
  store.addFeedbackEvent({
    id: randomUUID(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "needs_rework",
    feedback,
    nextRevisionTaskId: revTaskId,
  })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.needs_rework",
    detail: `${d.title} → rework: "${feedback.slice(0, 80)}"`,
  })
  return revTaskId
}

export function rejectDigital(store: FactoryStore, id: string, feedback: string): void {
  const now = new Date().toISOString()
  store.updateDailyDigital(id, { status: "rejected", location: "trash", operatorFeedback: feedback, updatedAt: now })
  const d = store.getDailyDigital(id)
  if (!d) return
  void recordOperatorIntegritySignal(store, d.createdByAgentId, "rejected", d.id)
  store.addFeedbackEvent({
    id: randomUUID(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "rejected",
    feedback,
  })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.rejected",
    detail: `${d.title} rejected: "${feedback.slice(0, 80)}"`,
  })
}

/**
 * Executes the revision job created by reworkDigital: regenerates content with
 * the operator feedback as a hard constraint, bumps revisionCount, and puts the
 * asset back into review. For order deliverables the client brief is included
 * and the order goes back to ready_for_review.
 */
export function regenerateDigital(store: FactoryStore, id: string): DailyDigital | undefined {
  const d = store.getDailyDigital(id)
  if (!d || d.status !== "needs_rework") return undefined

  const constraints: string[] = []
  if (d.orderId) {
    const order = store.getOrder(d.orderId)
    if (order) constraints.push(`Client brief from ${order.clientName}: ${order.description}`)
  }
  if (d.operatorFeedback) constraints.push(d.operatorFeedback)
  const deptFeedback = store.getRecentFeedbackConstraints(7)[d.department] ?? []
  for (const fb of deptFeedback) if (!constraints.includes(fb)) constraints.push(fb)

  const taskType = d.taskType ?? selectTaskType(d.department)
  // Service orders regenerate through the service builder so rework never
  // degrades a shaped deliverable back into a generic template.
  const order = d.orderId ? store.getOrder(d.orderId) : undefined
  const service = order?.serviceId ? getServiceDefinition(order.serviceId) : undefined
  const generated = service && order
    ? (() => {
        const g = buildServiceContent(service, order, constraints)
        return { ...g, qualityScore: scoreContent(g.content, constraints) }
      })()
    : generateAssetContent(d.department, taskType, d.date, constraints)
  const now = new Date().toISOString()

  store.updateDailyDigital(id, {
    title: generated.title,
    content: generated.content,
    qualityScore: generated.qualityScore,
    taskType,
    status: "draft_ready",
    revisionCount: d.revisionCount + 1,
    updatedAt: now,
  })

  if (d.orderId) {
    store.updateOrder(d.orderId, {
      status: "ready_for_review",
      revisionCount: (store.getOrder(d.orderId)?.revisionCount ?? 0) + 1,
      updatedAt: now,
    })
  }

  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: d.orderId ? "order.regenerated" : "daily.regenerated",
    detail: `${d.id} rev ${d.revisionCount + 1} — feedback applied: "${(d.operatorFeedback ?? "").slice(0, 60)}"`,
  })

  return store.getDailyDigital(id)
}

export function warehouseDigital(store: FactoryStore, id: string): void {
  const now = new Date().toISOString()
  store.updateDailyDigital(id, { status: "accepted", location: "warehouse", updatedAt: now })
  const d = store.getDailyDigital(id)
  if (!d) return
  void recordOperatorIntegritySignal(store, d.createdByAgentId, "warehoused", d.id)
  store.addFeedbackEvent({
    id: randomUUID(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "warehoused",
  })
  store.addEvent({
    id: randomUUID(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.warehoused",
    detail: `${d.title} → warehouse`,
  })
}
