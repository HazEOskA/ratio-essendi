# Validation

This document defines what it means for Factory Core v0.1 to be valid and how validation is enforced.

## Registry Validation

`validateRegistry()` from `@ratio-essendi/factory-core` checks every agent before the pipeline runs.

**Invariants:**
- All 14 agents (A–N) are present in `AGENT_REGISTRY`
- Every agent has a non-empty `watch` string
- Every agent has a non-empty `trigger` string  
- Every agent has a non-empty `nextAction` string

If any invariant fails, `runFactoryOnce()` throws before processing any signal.

**Test coverage:** `tests/factory-core.test.ts` — tests 1–3.

## Pipeline Validation

Each pipeline run enforces these invariants:

| Invariant | Enforced by |
|-----------|------------|
| `ApprovalItem.sent === false` | TypeScript literal type |
| `WarehouseItem.sent === false` | TypeScript literal type |
| Every event has `agentId`, `eventType`, `timestamp` | `FactoryEvent` type |
| Disqualified leads never reach Agent E–H | Early return in `runFactoryOnce` |
| Failed offers after edit go to Trash, not Approval | Early return in `runFactoryOnce` |
| Approval queue items start as `status: "pending"` | `agentH()` return value |

**Test coverage:** `tests/factory-core.test.ts` — tests 4–15.

## Acceptance Criteria

A Factory Core v0.1 implementation is valid if and only if all of the following pass:

```
npm run typecheck   # 0 errors
npm test            # all tests pass
```

Expected test count: ≥ 15 factory-core tests + all prior tests.

## What Validation Does Not Cover

- Whether a generated offer is commercially viable (human judgment required)
- Whether an ICP definition is accurate (operator responsibility)
- Whether the Anthropic API returns a better offer than the stub (environment-dependent)
- Whether warehouse items are ever used (operator discretion, no constraint)

## Structural vs Policy Constraints

| Type | Example | Enforcement |
|------|---------|-------------|
| Structural | `sent: false` is a literal type | TypeScript compiler |
| Structural | Registry has 14 agents | `validateRegistry()` throws |
| Policy | Operator must approve before outreach | Server route design (no auto-send path) |
| Policy | Max 1 revision cycle | `runFactoryOnce()` logic |
