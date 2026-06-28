# Commercial Growth Factory — Sandbox Target

The Commercial Growth Factory is the target architecture for autonomous revenue operations in Ratio Essendi. It is accepted as a future sandbox target, not the current runtime.

## Hard Rule

This document is a specification target. Nothing described below is implemented yet. When implementation begins, it starts in sandbox (docs/10), uses offline stubs first, requires a human approval gate at every external action, and respects compliance constraints from the first commit.

## Purpose

Map the full commercial pipeline from market signal to client value, with every step observable, replaceable, and approval-gated.

## Flow

```
Market signal
  → lead source discovered
  → prospect researched
  → compliance checked
  → lead qualified
  → campaign angle proposed
  → creative / copy drafted
  → offer generated
  → outreach approval requested
  → human approval
  → client communication
  → pipeline update
  → value tracking
  → client success follow-up
```

No step proceeds past the approval gate without a human decision. No outreach, no ad spend, no client communication is automatic.

## Departments (Future System Cells)

| Department | Responsibility |
|---|---|
| Market Intelligence | Monitor signals, trends, and competitor moves |
| Lead Sourcing | Identify lead sources; respect provenance and platform terms |
| Prospect Research | Enrich and profile leads before any contact |
| Compliance Desk | GDPR, platform ToS, and outreach policy checks |
| CRM / Pipeline | Track lead state and pipeline progression |
| Marketing Team | Strategy, positioning, and campaign planning |
| Creative Studio | Copy, visuals, and content assets |
| Ads / Campaign Team | Paid campaign drafting and approval (never auto-spend) |
| Offer Desk | Generate, evaluate, and hold offers at the approval gate |
| Sales Ops | Pipeline hygiene, quota tracking, and RevOps process |
| Client Communication | Approved outreach only; every message logged |
| Client Success | Post-sale follow-up and retention |
| Value Tracking | KPI measurement, revenue attribution, and reporting |

Each department maps to a future system cell with its own agent contracts, KPIs, succession logic, and failover path.

## Non-Negotiable Constraints

**No aggressive scraping.** Lead sourcing must respect robots.txt, platform terms, and applicable law. Bulk collection without consent is not acceptable.

**No automatic outreach.** Every message to a prospect or client requires explicit human approval before sending.

**No automatic ad spend.** Campaign budgets are never committed by agents. A human approves every spend decision.

**No client communication without approval.** The approval gate (docs/13) applies to every external action, not just offers.

**Every lead needs provenance.** The source, method, and timestamp of lead discovery must be logged. Untraced leads are not admitted to the pipeline.

**Compliance first.** GDPR, platform ToS, and applicable outreach regulations are checked before any lead moves past the Compliance Desk. This is not a legal disclaimer — it is a system gate.

**Offline first.** When each department is first implemented, it uses stubs and heuristics before live models or real external calls. No live integration until the offline path is tested.

## Relationship to Current System

The current runtime (v0.1) implements the Offer Desk only: prospect qualification, offer generation, and the approval gate. The Commercial Growth Factory extends that into the full upstream and downstream pipeline.

The architecture is compatible: every future cell follows the same System Cell Contract (docs/02), uses the same event log (docs/11), and respects the same succession loop (docs/06).
