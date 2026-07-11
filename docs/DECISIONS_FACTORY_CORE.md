# Factory Core v0.1 — Architecture Decisions

## FC-001 — 14 Agents, Not More, Not Fewer

The Offer Acquisition Line requires exactly 14 agents (A–N). This number was derived from the full pipeline: intake → qualification → enrichment → strategy → build → evaluate → edit → approve → route → succeed → lineage → quality → report → direct. Adding more agents without a concrete bottleneck violates Decision 007 (Agent Factory Is Controlled).

## FC-002 — Sequential Pipeline, No Parallel Execution

Each signal is processed sequentially through A→H. Parallel execution adds complexity without concrete benefit at v0.1 throughput. If throughput becomes a bottleneck, revisit — but do not pre-optimise.

## FC-003 — sent: false Is a TypeScript Literal, Not a Runtime Check

The `sent` field on `ApprovalItem` and `WarehouseItem` is typed as the literal `false`. The TypeScript compiler enforces it. There is no runtime `if (item.sent)` guard because the type makes it impossible to set `sent: true` without a type error. This is a structural safety property, not a policy.

## FC-004 — One Revision Cycle Maximum

Agent G may revise a failed offer once. If the revision still fails, the signal moves to Trash. An unbounded retry loop would mask a deeper qualification problem (wrong ICP, wrong positioning). The operator should re-submit with better context rather than letting the system loop silently.

## FC-005 — JsonStore Uses Atomic Writes

All store writes go through `write .tmp file → rename`. This prevents partial reads if the process crashes mid-write. It is the same pattern used in `FileStore` in `tests/store.ts`.

## FC-006 — Registry Validation Is Pre-condition, Not Post-condition

`validateRegistry()` runs before any signal is processed. Dead agents are caught at startup, not after a partial pipeline run. This prevents silent data loss (e.g., a signal processed through A–E then stuck because F has no implementation).

## FC-007 — Agents J–N Are Oversight, Not Pipeline

Agents J (Succession Watcher), K (Lineage Tracker), L (Quality Auditor), M (Performance Reporter), and N (Factory Director) are defined in the registry and have work contracts, but they are not wired into `runFactoryOnce()`. They represent the oversight layer — their triggers are longer-horizon events (pattern detection, post-approval quality, stall detection). They are available for future wiring without registry changes.

## FC-008 — Factory Dashboard Is Separate from the Live Ops Dashboard

`factory:serve` (port 7778) and `dashboard:serve` (port 7777) are independent servers. They share no state. The factory is a new acquisition pipeline; the live ops dashboard is the existing MetaGovernor + World system. They coexist — do not merge them.

## FC-009 — ICP Qualification Threshold Is 0.5, Not 0.75

Agent B qualifies at ≥0.5 fit score (vs 0.75 in the dashboard prospecting layer). The factory ICP is less strict at intake because Agent C–D enrich and sharpen context before the offer is built. The offer itself is evaluated at ≥0.75. This two-gate design allows borderline leads to be enriched before being discarded.

## FC-010 — No External Dependencies in Factory Core

`@ratio-essendi/factory-core` depends only on `@ratio-essendi/shared`, `@ratio-essendi/evaluation-engine`, and `@ratio-essendi/offer-builder`. It does not import from the `meta-governor` or `dashboard` packages. This keeps the factory independently deployable and testable.

## FC-011 — Client Orders Always Beat Training

`runAutonomousCycle()` has a fixed priority: open client orders → pending reworks → daily training. Training missions are only created when there are zero orders in `new`/`in_production`. An order waiting for operator review (`ready_for_review`) does not block training — the ball is in the operator's court, and the factory keeps itself sharp while it waits.

## FC-012 — Autopilot Is Bounded, Not Ambitious

The autopilot may run on a timer precisely because every operation it performs is idempotent: orders produce once, reworks run only on operator-flagged items, training is capped at 5/day. This is the structural answer to the auto-tick spam incident (decision 013 in docs/15): background loops may only do work that has a natural upper bound, and all of it stops at the review gate.

## FC-013 — Random Training Selection, Stable Within a Day

Daily training task types are selected randomly per run (not by `dayOfYear` rotation), per the operator's requirement of "5 random tasks". Idempotency per date is preserved: once a day's set exists, re-runs return it unchanged.

## FC-014 — Rework Is a Job, Not a Label

`needs_rework` is not a terminal status. It is a queued revision job that the autopilot executes: content is regenerated with the operator feedback (and the client brief, for orders) as hard constraints, `revisionCount` increments, and the asset returns to review. Feedback that is never applied is a broken promise to the operator.

## FC-015 — Producers Are Registered Agents

The five mission producers (MA, SA, DA, RA, QAA) are full registry members with watch/trigger/nextAction contracts, subject to the same "no dead agents" validation as pipeline agents A–N. Registry size is 19. An agent that produces output but has no contract is an audit finding, not a shortcut.

## FC-016 — Cockpit State Has One Derivation

`deriveOps()` in the server is the single source of truth for mode, standing-still reason, next operator action, and waiting counts. The /admin page and the read-only debug endpoints (`/api/admin/state`, `/api/work-runs`) all consume it, so the page and the JSON can never disagree. It mirrors the autopilot's own arbitration (an order whose deliverable is flagged needs_rework belongs to the rework stage, not order production).

## FC-017 — Agent Cards Show Honest Derived Status, Never Fake Liveness

The system is synchronous. Agent work cards therefore report only truthful derived states: `completed`, `waiting_review` (output sits at the review gate), `idle` (no matching job), `blocked` (run failed). There is no "working…" animation and no pretend-async status — see the mission constraint "do not fake live async work".

## FC-018 — Debug Endpoints Are Read-Only

`GET /api/admin/state` and `GET /api/work-runs` exist to verify cockpit correctness. They read a snapshot and return JSON; they perform no writes and add no external capability. Write paths remain the existing operator forms only.

## FC-019 — The Boss Header Reads Persisted History, Not Process Memory

The cockpit header derives "last cycle" (mode, status, trigger, finish time) from the last persisted `FactoryWorkRun`, never from an in-memory summary string. A restart must not make the factory look like it never worked — that was the operator's core "hollow shell" complaint. The header also carries the standing safety indicators: `SAFE MODE — no external send` and `local single-instance`, because the boss should see the safety posture without reading docs. Every output card has a stable `#out-<id>` anchor; agent cards and the operator queue link to it, so "which agent produced what" is one click, not a scroll hunt.

## FC-020 — Services Shape Production

A client order with a `serviceId` produces a deliverable structured by that service's section list (`buildServiceContent`), not by department templates. Rework regenerates through the same builder, so operator feedback can never degrade a shaped deliverable into a generic one. Unknown service ids are rejected before any order or event is written.

## FC-021 — The Delivery Pack Is the Product, and It Never Leaves Alone

Approved client work converts (by explicit operator click only) into a DeliveryPack: a client-ready markdown artifact with summary, deliverable, recommendations, next steps, and a safety note. Its terminal internal status is `warehouse_ready` — the factory's job ends there. Delivery is the operator's manual act, always. Warehousing a pack writes a CaseRecord so the factory accumulates business memory.

## FC-022 — Demo Orders Are Explicit and Bounded

The demo path (HVAC TestCo) exists so the operator can rehearse the full loop safely. It runs only on an explicit button click, creates one internal order, refuses to duplicate while an active demo exists, and sends nothing anywhere.

## FC-023 — The Production Line Is a Projection, Not a Second Engine

`deriveProductionLine(state, ctx)` is a pure function that projects the existing store (orders, dailyDigitals, deliveryPacks, workRuns) onto an 8-station floor view. It stores nothing, runs no new agents, and shares deriveOps' mode/next-action so the line and the cockpit never disagree. The factory is synchronous and single-agent per job, so stations a run folds in are shown as `skipped` — never as fake concurrent work. This honesty is the point: the operator sees the real floor, not a theatre.

## FC-024 — Integrity Guard: Pinocchio Measures, HRAR Quarantines, the Operator Resurrects

`@ratio-essendi/integrity-guard` ports the Pinocchio + HRAR design (DriftSensor → PinocchioNose → HRARProtocol → RatioEssendiGuard facade) with one deliberate deviation: **no `process.exit` inside the factory server.** Killing the whole cockpit over one drifted agent would be the single point of failure forbidden by decision 011 — so in the factory, HRAR's cleanup quarantines the agent instead. The `exitProcess: true` flag remains in the package for standalone bots where the process IS the agent, default OFF.

The nose feeds on real signals, not simulated market data: operator rejections (+25), rework requests (+12), quality drift below baseline (z-score via DriftSensor, capped +15); acceptance and warehousing heal (−10). At 80 cm the agent is quarantined from CLIENT production only — the Training Yard rule: a drifted agent goes back to training, it does not touch client work. Only an explicit operator reset (God Layer) lifts the quarantine; breach history survives resets. Events stay operational per decision 004: `integrity.quarantine`, `integrity.reset` — see FC-025 for the reset audit contract.

## FC-025 — HRAR Naming Cleanup + Audited God Layer Reset

**Naming.** The protocol's active name is **HRAR** (Hard Reset / Agent Restriction) everywhere it is user- or code-facing: `HRARProtocol` (class), `hrar-protocol.ts` (file), `integrity.quarantine` (event type, replacing the earlier `integrity.harakiri`), and `HRAR` / `Agent Quarantine` in UI copy and docs. The original "Harakiri" naming from the operator's initial spec is retired from runtime — it survives only as this one-line historical note: the executor class was briefly called `HarakiriProtocol` between the first Integrity Guard commit and this cleanup. The mechanism itself did not change.

**Audited reset.** `resetAgentIntegrity(store, agentId, reason, note?)` now requires `reason` — one of `false_positive | retrained | accepted_risk | operator_override | other` — as a mandatory parameter, not an optional afterthought. The HTTP layer (`POST /api/integrity`) validates in order: `agentId` present → known producer agent → `action === "reset"` → `reason` present → `reason` is a recognised value. Any failure returns `400` with zero store writes — a reset cannot happen by accident, and cannot happen without a stated justification. On success the logged `integrity.reset` event carries `previousNose`, `reason`, `note` (if given), the preserved breach count, and an explicit "Reset by: operator (God Layer)" marker, so the audit trail answers *who, why, and what it undid* without cross-referencing anything else.

**Unchanged guarantees (restated, not re-decided):** HRAR quarantines an agent/department, never the HTTP process — `process.exit` remains opt-in and OFF inside the factory. A quarantined agent keeps training; it is only cut off from client production until reset. `breaches` is a lifetime counter and is never zeroed by a reset, audited or otherwise.

## FC-026 — Lead Engine (LEA): a Growth Director Who Drafts, Never Sends

`@ratio-essendi/lead-engine` adds LEA (registry id `LEA`, role `lead-engine`, registry size 20): an elite Growth/Sales Director persona that converts cold and warm leads through in-flight qualification. The operator's source spec included a tool that emails a PDF proposal to the lead. **That tool was deliberately not built.** It violates the factory's founding invariant (decisions 003/011, FC-021): autonomy of thinking, never autonomy of action. LEA drafts replies and proposals *into the thread*; the operator copies them out and sends through their own channel. "Mark as sent" only records what the operator already sent manually — it is bookkeeping for context recovery, not a send path. The event log states this in so many words: `lead.marked_sent` carries "Fabryka nie wysłała niczego."

**Qualification is deterministic, not model-derived.** Problem, budget, and decision-maker are extracted by regex over *lead-only* utterances (`signals.ts`); operator words never qualify a lead. Status follows mechanically: `cold` → `warm` (1 field) → `hot` (2) → `qualified` (3); `won`/`lost` are operator-only and sticky. This means the pipeline behaves identically whether drafts come from live Claude (`ANTHROPIC_API_KEY` set, `claude-opus-4-8`, adaptive thinking) or the offline stub — the same provider-mirror pattern as the offer engine, with a `ResilientLeadDrafter` that falls back to the stub if the live call fails, so a network error can never block the cockpit.

**The persona is a style contract, enforced by tests.** Drafts are 2–4 sentences, end with a precise question targeting the next unqualified field (problem → budget → decision-maker → close), never use bot phrases ("W czym mogę pomóc", "Jako AI"…), and weaponize earlier-stated pain (context recovery: the value sentence quotes the lead's own declared problem back at them). Operator feedback on a redraft is a hard constraint, and every redraft bumps `draftRevision` with an event. All LEA events (`lead.thread_created`, `lead.message_received`, `lead.qualified`, `lead.status_changed`, `lead.reply_drafted`, `lead.reply_redrafted`, `lead.proposal_drafted`, `lead.marked_sent`) are operational per decision 004.
