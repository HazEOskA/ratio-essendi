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
