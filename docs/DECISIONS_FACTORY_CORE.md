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
