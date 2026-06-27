# Ratio Essendi

Ratio Essendi is a system-of-systems architecture for building an autonomous Product Factory.

It is not a single agent platform.
It is not a monolithic AI dashboard.
It is not one Core controlling everything.

It is a modular, evolving operational environment made of independent system cells, agents, memories, budgets, KPIs, shadow copies, failure policies and succession loops.

## Core Idea

Ratio Essendi is built on one principle:

> Every agent, strategy, subsystem and core cell must be replaceable, testable, observable and recoverable.

The system must be able to work, fail, learn, replace weak parts and continue.

## Main Concepts

- System of Systems
- Core Cells
- Shadow Cells
- Meta-Governor
- Agent Factory
- Purpose-Bound Agents
- Agent Succession Loop
- Drift Rule
- Unmodeled Authority
- Event Log
- KPI Model
- Sandbox Strategy Testing
- Failover

## First MVP

The first MVP does not try to build a full autonomous company.

The first MVP proves that the system can:

1. register a system cell,
2. register an agent,
3. assign a role and KPI,
4. evaluate output,
5. detect failure or drift,
6. create a succession brief,
7. create a successor candidate,
8. mark a cell as degraded or failed,
9. activate a shadow cell,
10. show state transitions in logs.

## Core Law

No alignment → no input.  
No input → no work.  
No work → no system presence.

## Running the MVP proof

The first technical proof (docs/14) runs the 10-step lifecycle end-to-end in
memory — no money spent, no external action, no UI — and asserts the six
validation criteria.

```bash
npm install
npm run dashboard   # generate dashboard.html — read-only view of cells, agents and decisions
npm run offer       # real output: an offer-builder agent drafts an offer, held at the approval gate
npm run factory     # value demo: weak producers auto-replaced, KPI uplift scorecard
npm run proof       # human-readable event log + validation
npm test            # node:test assertions
npm run typecheck   # strict tsc --noEmit across the monorepo
```

### Real output (`npm run offer`)

The first product agent (`@ratio-essendi/offer-builder`) generates a real offer
with Claude (`claude-opus-4-8`), the evaluation engine scores it against KPIs,
and the **approval gate (docs/13) blocks any external send** — a good offer is
held at `pending_approval` and never auto-sent. No money is spent.

- With `ANTHROPIC_API_KEY` set → live Claude generation.
- Without a key → a deterministic stub runs the exact same pipeline offline, so
  the flow (and `npm test`) always works.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run offer   # live
npm run offer                                # offline stub
```

`npm run factory` runs a Sales Factory season: agents produce offers, the
system scores them against KPIs, detects weak value-producers, replaces them
via succession, and reports the uplift in a revenue-relevant metric — every
decision recorded in one event log. (Outputs are simulated; the dollar figure
is an explicit model assumption, not real revenue.)

Implemented packages: `shared`, `event-log`, `cell-health`, `system-registry`,
`agent-registry`, `evaluation-engine`, `agent-succession`, `failover-engine`,
`meta-governor`. Still scaffold (intentionally — anti-sprawl, docs/05):
`system-cell`, `agent-factory`, `memory-layer`.
