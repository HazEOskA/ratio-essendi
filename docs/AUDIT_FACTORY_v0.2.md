# Factory Audit — v0.1 → v0.2

Date: 2026-07-01
Scope: `packages/factory-core`, `tests/factory-serve.ts`, `tests/factory-core.test.ts`
Baseline: 52/52 tests green, typecheck clean. Result after fixes: 61/61 tests green.

## Findings and Fixes

### F-01 — Approval ID collision after restart (BUG, fixed)
`agentH` used a module-level counter (`let _approvalSeq = 0`). The counter resets
on every process restart, but approval items persist in `.factory-data/approval.json`.
After a restart, the next offer would get `ai-1` again — colliding with an existing
persisted item, so `getApprovalItem` / `updateApprovalItem` would act on the wrong record.
**Fix:** random UUID-based IDs (`ai-<uuid8>`). No counter, no restart state.

### F-02 — Event ID collision risk (BUG, fixed)
Server-side events used `evt-${Date.now()}` — two events in the same millisecond
get the same ID. **Fix:** `randomUUID()` everywhere.

### F-03 — Warehouse/Trash pages blind to digital assets (UX BUG, fixed)
The operator could click "→ Warehouse" or "Reject to Trash" on a daily deliverable,
but `/warehouse` and `/trash` only rendered offer-pipeline items — the asset vanished
from view. **Fix:** both pages now render digital assets (location=warehouse /
location=trash) in their own section.

### F-04 — Dead agents: MA/SA/DA/RA/QAA (CONTRACT VIOLATION, fixed)
The five mission agents existed in the `AgentId` type and produced assets, but were
absent from `AGENT_REGISTRY` — violating the project's own "no dead agents" rule
(docs/AGENT_WORK_CONTRACT.md: every agent must have watch/trigger/nextAction).
**Fix:** all five registered as Producers with full contracts. Registry is now 19 agents.

### F-05 — Rework was a dead end (LOGIC GAP, fixed)
`reworkDigital` created a `nextRevisionTaskId`, but nothing ever executed the revision.
The item stayed `needs_rework` forever unless the operator manually did something.
**Fix:** `regenerateDigital()` executes the revision job — regenerates content with the
operator feedback (and the client brief, for order deliverables) as hard constraints,
bumps `revisionCount`, returns the asset to `draft_ready`. The autopilot runs this
automatically every cycle.

### F-06 — No client order intake (MISSING CAPABILITY, added)
The factory had training mode but could not accept real work. **Added:** the Client
Order Line (`orders.ts`) — `ClientOrder` type, `/orders` page with intake form,
`inferTaskType()` (maps the free-text description to a concrete task type),
`produceOrderDeliverable()` (client brief becomes the primary production constraint).

### F-07 — No autonomy arbitration (MISSING CAPABILITY, added)
Nothing decided between client work and training. **Added:** `runAutonomousCycle()`
(`autopilot.ts`) with fixed priority: client orders → pending reworks → daily training.
The server runs it at startup and every 60 s; the operator can pause/resume it.

### F-08 — Training rotation was deterministic (SPEC MISMATCH, fixed)
Task types rotated by `dayOfYear % 5` — same weekday, same task. Spec: 5 *random*
training tasks per day. **Fix:** random selection per run (still idempotent per day —
once created, the day's set is stable).

## Why the autopilot cannot spam queues

Lesson from the auto-tick incident (decision 013): background loops must not generate
unbounded work. Every autopilot operation is idempotent and bounded:

| Operation | Bound |
|-----------|-------|
| Order production | once per order (status gate: `new`/`in_production` only, skips if a draft is already awaiting review) |
| Rework regeneration | only items the operator explicitly flagged `needs_rework` |
| Training missions | hard cap: 5 per calendar day |

A cycle with nothing to do is `IDLE` and writes no events. And every output still
stops at the operator review gate — the autopilot produces, it never delivers.

## Verified end-to-end (manual smoke test, 2026-07-01)

1. Server start → autopilot creates 5 training missions (`NO_CLIENT_TRAINING_MODE`)
2. `POST /api/order` (BudMax, landing page for construction companies) → produced
   immediately, content reflects the construction niche, order `ready_for_review`
3. Operator approves → asset in `/warehouse` (Digital Assets), order `approved`
4. Event log: `order.received`, `order.produced`, `daily.warehoused`, `factory.cycle`

## Unchanged guarantees

- `sent: false` literal types on ApprovalItem / WarehouseItem — nothing auto-sends
- No external channels, no CRM, no mail, no scraping, no ad spend
- Every review decision is a logged event
- Operator approval is the only path out of the factory

## Hardening v0.2.1 (post-validation pass)

Two risks from the validation report are closed; no new features added.

### H-01 — Autopilot pause now survives restarts (was risk #1)
`autopilotEnabled` persists in `settings.json` via the FactoryStore
(`getAutopilotEnabled` / `setAutopilotEnabled`, default ON). The server reads it
at startup and writes through on every toggle. `lastCycleSummary` is
intentionally runtime-only: it is display-only diagnostics, and a persisted
value would be stale (and misleading) immediately after a restart.
Covered by: store-reload test + a real spawn-kill-respawn HTTP test.

### H-02 — Department whitelist on POST /api/order (was risk #4)
Unknown departments are rejected with `400` and a clean JSON body
(`{ error, received, allowed }`) before `createOrder` runs — no order record,
no `order.*` event is written. Covered by HTTP tests against a live server
in a temp data dir.

Note: the server's `PORT` is now env-overridable (`PORT=<n>`), default
unchanged (7778). This exists so the HTTP tests can run on a free port; it is
test infrastructure, not a feature surface.

### Remaining risks (unchanged from validation report)
- `events.json` grows unbounded; loaded fully into memory at start. Fine at
  current volume; needs rotation/archival before high-volume use.
- No lock around `runAutonomousCycle` — safe today because generators are
  synchronous (Node's single thread prevents interleaving). If generators ever
  become async (real LLM calls), add a cycle mutex first.
- Pre-v0.2 digitals lack `taskType`; on rework they regenerate with a random
  task type (documented fallback in `regenerateDigital`).
- `JsonStore` is single-process; two servers on one `.factory-data` would
  clobber each other's writes.
