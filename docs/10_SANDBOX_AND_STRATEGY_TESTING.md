# Sandbox and Strategy Testing

New strategies are not deployed directly.

Every new strategy starts in sandbox.

## Sandbox Rule

A strategy must be tested before production.

The system must compare:

- expected outcome,
- actual outcome,
- cost,
- risk,
- time,
- KPI impact,
- failure signals.

## Strategy Lifecycle

```txt
proposed
↓
sandbox
↓
evaluated
↓
promoted / rejected / revised
↓
pattern stored
```

## Type Definition

```ts
type StrategyExperiment = {
  id: string
  name: string
  cellId: string
  proposedBy: string

  hypothesis: string
  targetKpi: string
  budgetLimit: number
  riskLevel: "low" | "medium" | "high"

  status:
    | "proposed"
    | "sandbox"
    | "evaluated"
    | "promoted"
    | "rejected"
    | "revised"

  expectedOutcome: string
  actualOutcome?: string
  evaluationSummary?: string
  createdAt: string
  updatedAt: string
}
```

## Pattern Library

Successful strategies are saved as reusable patterns.

Failed strategies are also saved, because they prevent repeated mistakes.

Pattern Library must store:

- winning strategies,
- failed strategies,
- reusable playbooks,
- market learnings,
- product learnings,
- sales learnings,
- delivery learnings.
