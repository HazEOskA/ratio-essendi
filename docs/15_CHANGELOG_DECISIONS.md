# Changelog / Decisions

## Decision 001 — System of Systems

Ratio Essendi is a system of systems, not one monolithic system.

## Decision 002 — Core Is a Role

Core is not one machine. Core is a role that can exist in multiple cells.

## Decision 003 — Agents Are Purpose-Bound

Agents are non-sentient operational entities. They have roles, not emotions.

## Decision 004 — No Metaphysical Actors in Runtime

The system does not model God as an actor. Logs contain state transitions and policy events only.

## Decision 005 — Drift Means Disconnection

Drift equals loss of alignment. A drifting entity loses input and exits active execution.

## Decision 006 — Agent Succession

A failed or drifting agent leaves a succession brief and is replaced by a better-aligned candidate after testing.

## Decision 007 — Agent Factory Is Controlled

Agent Factory creates agents only for real bottlenecks, repeated needs or succession.

## Decision 008 — KPI Is Value

The main KPI is profit, client value and profitability, not number of agents.

## Decision 009 — Sandbox Before Production

New strategies are tested in sandbox before promotion.

## Decision 010 — Shadow Cells

System cells require failover logic and shadow replacement path.

## Decision 011 — No Single Point of Failure

No agent, model, cell or dashboard can become the only point of failure.

## Decision 012 — Factory Metaphor Is Conceptual For Now

The factory/company metaphor (hall, production line, machine, pallet, warehouse, mechanic, technologist, quality control, BHP, dispatch, 5S) is accepted as a documentation and communication layer only. No runtime abstractions are created from it in v0.1. The metaphor gives the system two vocabularies — one for engineers, one for operators — without changing the architecture. See docs/17.

## Decision 013 — Commercial Growth Factory Starts As Sandbox Target

The Commercial Growth Factory (market signal → lead → compliance → qualification → offer → approval → client communication → value tracking) is accepted as the target architecture for future revenue operations. It is not the current runtime. Implementation begins in sandbox, starts with offline stubs, and every external action requires human approval. No automatic outreach, no automatic ad spend, no untraced leads. See docs/19.

## Decision 014 — Shift Calendar Is Operating Rhythm, Not Scheduler

The three-shift / weekday-weekend cadence is accepted as a human operating rhythm. The system does not implement it as a scheduler, does not activate or deactivate agents by time of day, and does not shut down automatically on weekends. The calendar is a discipline for the operator: produce on weekdays, reflect and review on weekends. See docs/18.
