# Operator Runbook — Ratio Essendi v0.4

## 1. What this is

Ratio Essendi v0.4 is a local, single-instance Product Factory with a boss
cockpit. It runs the loop:

SERVICE → CLIENT ORDER → FACTORY WORK → REVIEW → REWORK → APPROVAL → DELIVERY PACK → WAREHOUSE → CASE RECORD

Foundational rule: **autonomy of thinking without autonomy of action.**
The factory produces and prepares; the operator approves and delivers.

## 2. What it can do

- Sell-shaped production: 6 services in the catalog, each producing a
  deliverable structured for that service (audit sections, carousel copy, etc.)
- Client order intake with service, language (PL/EN), urgency, operator notes
- Bounded autopilot: orders → reworks → 5 random daily training assets
- Review / rework / approve every output; rework applies your feedback
- One-click "Approve → Delivery Pack": a client-ready markdown artifact
- Pack lifecycle: draft → approved → warehouse_ready + automatic Case Record
- Full work traces: who worked, on what input, what output, in which run

## 3. What it cannot do (by design)

- Send email, publish, scrape, contact leads, spend money, touch a CRM
- Deliver anything to a client — you copy the pack and deliver it yourself
- Run multi-instance — one server per `.factory-data` directory

## 4. Start locally

```
cd D:\OsaTechGPT\repos\ratio-essendi
npm install        # first time only
npm run factory:serve
```

Open `http://localhost:7778/admin` (cockpit) and `http://localhost:7778/factory-run` (one-page business loop).

## 5. First client workflow

1. Open `/factory-run`
2. Pick a service in the order form (e.g. AI Workflow Audit + Mini Demo)
3. Fill client name + brief (what they do, what hurts) → **Accept Order → Produce Now**
4. The deliverable appears immediately, shaped by the service
5. Read it. Then either:
   - **Request Rework** with concrete feedback (regenerates with your feedback), or
   - **Approve → Delivery Pack**
6. Open `/delivery`, read the pack markdown → **Approve Pack** → **Warehouse Pack + Case Record**
7. Copy the markdown and deliver it to the client through your own channel

## 6. Demo path (safe, internal)

On `/factory-run` or `/admin`, click **Create Demo Order (HVAC TestCo)**.
It creates one internal order for "AI Workflow Audit + Mini Demo" and produces
the deliverable. Nothing leaves the machine. The button refuses to duplicate
an active demo order.

## 7. Review / rework / approve

- Every client output and training draft waits in `daily_review`
- Rework: type feedback → the next cycle regenerates the output with your
  feedback as a hard constraint (`PRODUCTION CONSTRAINTS` block) and bumps rev
- Approve → Warehouse (training) or Approve → Delivery Pack (client work)
- Reject sends to trash with your reason; everything is event-logged

## 8. Delivery packs

- Created only by your explicit click, from a client-order output
- Contain: client, service, date, executive summary, full deliverable,
  recommendations, next steps, safety note, source ids
- `/delivery` shows copy-ready markdown; `/api/delivery-packs` is read-only JSON
- warehouse_ready = done internally; delivery is your manual act

## 9. Reading /admin

- **Header**: mode, autopilot, SAFE MODE, last persisted cycle, next action
- **Why It Is Standing Still**: the exact reason with real counts — never vague
- **Business Loop row**: services / active orders / packs d-a-r / training / cases
- **Factory Workroom**: per-agent cards (status, last job, input, output, related order)
- **Waiting for Operator**: actionable queue with links to the exact card
- **Recent Work Runs**: expandable step-by-step timeline of every cycle
- **Delivery Packs**: newest packs with status and source

## 10. Safety rules

- No external send of any kind; approval gate on every path out
- Autopilot is bounded (orders once, reworks only when flagged, training 5/day)
- GET pages and debug endpoints never mutate state
- Every decision is an event in the log

## 11. Known risks

- `events.json` / `work-runs.json` grow unbounded (fine at this volume)
- Single-process store: never run two servers on one `.factory-data`
- Content generators are template-based (no LLM calls); a cycle mutex is
  required before any async generator is introduced
- Delivery pack is markdown, not PDF (v0.4 scope)

## 11a. Agent Production Line (`/production-line`)

`/production-line` is the production floor. It is an **honest synchronous
projection** of the current state — the factory produces each deliverable in a
single producer step, so there is no fake "agent currently running" animation.
`/admin` carries a compact version with a link to the full page.

**Station board** — 8 stations, each owned by an agent:
Intake (N) → Research (RA) → Strategy (SA) → Content (MA) → Delivery (DA) →
QA (QAA) → Packaging (N) → Operator Review (you). Because one producer builds
the whole deliverable, upstream stations a run folds in read **skipped**, not
fake work. Each station shows its status, task count, and last task.

**Statuses:** `queued` (waiting to be produced), `completed`, `waiting_review`
(sitting at the review gate — your move), `blocked` (flagged for rework, waiting
for a cycle), `ready_for_operator` (a pack needs approve/warehouse), `idle`
(nothing here), `skipped` (folded into the synchronous run).

**Four lines below the board:**
- **Client Line** — one task per order: client, service, station, output id,
  next action
- **Training Line** — today's 5 training tasks, each with its producing agent
- **Rework Line** — flagged items with the operator feedback + constraints that
  will be applied on the next cycle, and the revision count
- **Delivery Pack Line** — pack creation → approve → warehouse path

**From output to delivery pack:** review a client task on the Client Line →
`Approve → Delivery Pack` (on /admin or /factory-run) → the pack appears on the
Delivery Pack Line and `/delivery` → approve → warehouse → case record.

**Demo/fake clients for testing:** the page has a "Create Demo Production Run"
selector with four clearly-fictional clients (HVAC TestCo, BrightHire Agency,
NeonBlocks Studio, Local Builder Pro), each mapped to a real service. Explicit
click only, internal only, duplicate-guarded — use them to rehearse the whole
line before real clients.

**Safe / not automated:** the line only *shows* work; every write is still an
operator button. Nothing is sent, published, or delivered. `/api/production-line`
is a read-only JSON mirror of the same view.

## 11b. Integrity Guard (Pinocchio + HRAR)

Every producer agent (MA, SA, DA, RA, QAA) carries a persistent "nose" (0–100 cm)
— a memory of how often its work failed you. Rejections grow it (+25), rework
requests grow it (+12), quality drops below baseline grow it (up to +15);
accepting or warehousing shrinks it (−10). At 40 cm the agent enters *watch*;
at 80 cm the **HRAR protocol** (Hard Reset / Agent Restriction) fires: the
agent is **quarantined from client production**. It keeps training (safe,
internal) but the autopilot skips its department for client orders, with a
visible "BLOCKED by integrity guard" step.

**How to recognise an HRAR trigger:** an `integrity.quarantine` event appears
in the event log, and the agent's row in the Integrity Guard panel turns to
status `quarantined`. On the Production Line, that agent's station reads
`blocked` regardless of what task sits on it.

**How to check nose / status / breaches:** open `/admin` → "Integrity Guard —
Pinocchio Monitor". Each row shows the agent, nose length (with a colour bar),
status (`healthy` / `watch` / `quarantined`), lifetime breach count, and the
last signal that moved the nose. The same data is available read-only at
`GET /api/admin/state` under `integrity`.

**How to reset (God Layer, audited):** a reset is no longer a bare click — you
must say why. Pick a reason from the dropdown next to the quarantined agent:
`false_positive`, `retrained`, `accepted_risk`, `operator_override`, or
`other`; a free-text note is optional but recommended. Submitting without a
reason, with an unrecognised reason, or for an unknown/missing agent id
returns a `400` and **writes nothing** — there is no accidental or silent
reset path, only `POST /api/integrity` with a complete, valid body.

**How to confirm production came back:** after a valid reset, the agent's
status returns to `healthy` and its nose reads `0cm`. Run a cycle (or wait for
autopilot) — any client order previously blocked for that department produces
its deliverable on the next cycle, and the Production Line station for that
agent stops reading `blocked`.

**How to confirm breach history survived:** the reset does **not** touch the
`breaches` counter — check the same panel row: the count from before the
reset is still there. The logged `integrity.reset` event also states it
explicitly: `"Breach history preserved (N total)"`, alongside the reason,
optional note, the nose value before the reset, and `"Reset by: operator
(God Layer)"` — a full audit trail in one line.

Nothing here sends anything anywhere; the guard only restricts what the
factory may produce until you decide otherwise, and every decision — quarantine
or reset — is a reason-bearing event in the log.

## 11c. Lead Engine — LEA (`/lead-engine`)

LEA is your Growth Director: it qualifies leads and writes the replies — **you
send them.** The factory has no channel to any lead. Every draft stays inside
the thread until you copy it out and send it yourself (mail, LinkedIn, phone —
your choice, your account, your click).

**Start a thread:** open `/lead-engine`, fill in the lead's name (company and
source optional), submit. The thread starts `cold` with an empty qualification.

**Work the loop:**
1. A lead writes to you (outside the factory). **Paste their message** into the
   thread's "new message from lead" form.
2. The factory re-computes qualification from the lead's own words only —
   problem, budget, decision-maker — and moves status mechanically:
   `cold` → `warm` (1 field known) → `hot` (2) → `qualified` (all 3).
3. LEA immediately drafts a reply: 2–4 sentences, no bot phrases, quoting the
   lead's own stated pain back at them, ending with one precise question that
   targets the next unknown field.
4. Read the draft. If it's wrong, **redraft with feedback** — your note is a
   hard constraint on the next version, and the revision counter climbs so you
   can see how many passes it took.
5. When you actually send a reply through your own channel, paste what you sent
   into **"mark as sent"**. This is bookkeeping only — it feeds LEA's context
   for the next draft. The event log will say it plainly: the factory sent
   nothing.

**Proposal:** once a lead is worth it, click "draft proposal". LEA writes a
structured business proposal *into the thread* — sections, pricing framing,
next steps. It is never emailed, exported, or delivered by the factory; you
take it from the thread like any other draft.

**Close:** `won` and `lost` are yours alone — no qualification math ever sets
them, and once set they stick until you change them.

**Which brain wrote the draft:** each draft is tagged `anthropic` (live Claude)
or `stub` (offline template); the panel shows which one the next draft will
use. Qualification does not care — it is deterministic regex over the lead's
words, so status behaves identically in both modes. If a live call fails, the
stub takes over automatically rather than blocking your cockpit.

Everything is visible in `/admin` under "Silnik Leadów — LEA" and read-only at
`GET /api/admin/state` under `leadEngine`. Every action — thread created,
message received, field qualified, status changed, draft written, redraft,
proposal, mark-as-sent — is an event in the log with agent id `LEA`.

## 12. Definition of done for a client run

1. Order exists with a service and honest brief
2. Deliverable reviewed by you (reworked if needed)
3. Delivery pack approved and warehouse_ready
4. Case record present with a follow-up suggestion
5. You delivered the pack yourself and noted the client's response
