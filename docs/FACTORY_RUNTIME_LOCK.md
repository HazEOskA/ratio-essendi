# Factory Runtime Lock

## Purpose

This document defines immutable constraints on how Factory Core v0.1 executes. These constraints are not policy — they are structural. Violating them requires changing this document and updating the tests that enforce it.

## Hard Rules

### 1. No Auto-Send

`ApprovalItem.sent` is a TypeScript literal type `false`. It can never be set to `true` at runtime.  
`WarehouseItem.sent` is also typed `false`.  
No pipeline function, action handler, or server route may write to an external channel.

### 2. Operator Approval Required Before Any Offer Leaves the System

Every offer that passes evaluation reaches Agent H, which creates an `ApprovalItem` with `status: "pending"`.  
The operator must explicitly POST `/api/action` with `action: "approve"` to move an item to the Warehouse.  
The Warehouse is a local store — it has no sending mechanism.

### 3. Every Pipeline Step Is Logged

`FactoryStore.addEvent()` is called after every agent transform.  
The event log is append-only. Nothing deletes or rewrites existing events.  
Events persist to `.factory-data/events.json` with atomic writes (write `.tmp` then rename).

### 4. Registry Validation Runs Before Pipeline Execution

`runFactoryOnce()` calls `validateRegistry()` before processing any signal.  
If any agent is missing `watch`, `trigger`, or `nextAction`, the pipeline throws rather than silently running.  
This enforces the "no dead agents" rule.

### 5. Pipeline Is Sequential, Not Concurrent

Each agent transform runs synchronously in order: A → B → C → D → E → F → [G →] H.  
There is no parallel execution within a single signal pipeline.

### 6. Maximum One Revision Cycle

If Agent F fails the first draft, Agent G revises it once.  
Agent F re-evaluates. If the revised offer still fails, the signal moves to Trash.  
There is no unbounded retry loop.

### 7. No Metaphysical Actors in Logs

No event type may reference God, divine authority, or any unmodeled external authority.  
Event types are operational: `signal.intake_complete`, `lead.qualified`, `approval.required`, etc.  
See docs/15 Decision 004.

## What Factory Core Is Not

- Not a CRM
- Not a mailing system
- Not a scheduler
- Not a real-time event bus
- Not a replacement for operator judgment
