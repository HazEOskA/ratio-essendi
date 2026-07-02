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

## 12. Definition of done for a client run

1. Order exists with a service and honest brief
2. Deliverable reviewed by you (reworked if needed)
3. Delivery pack approved and warehouse_ready
4. Case record present with a follow-up suggestion
5. You delivered the pack yourself and noted the client's response
