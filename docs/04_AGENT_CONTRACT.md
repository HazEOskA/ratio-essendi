# Agent Contract

Every agent must have a contract.

No agent can exist without:

- purpose,
- role,
- tools,
- memory,
- budget,
- metrics,
- responsibility,
- boundaries,
- lifecycle state.

## Type Definition

```ts
type AgentContract = {
  id: string
  name: string
  version: string
  cellId: string

  role: string
  purpose: string
  responsibilities: string[]

  tools: string[]
  memoryScope: string
  budgetLimit: number

  kpis: string[]
  successCriteria: string[]
  failureCriteria: string[]

  boundaries: string[]
  allowedActions: string[]
  forbiddenActions: string[]

  status:
    | "created"
    | "active"
    | "warning"
    | "degraded"
    | "under_review"
    | "succession_required"
    | "disabled"
    | "archived"
    | "replaced"

  lineage: {
    createdFrom?: string
    successorId?: string
    replacementReason?: string
  }

  createdAt: string
  updatedAt: string
}
```

## Required Fields

An agent cannot be activated without:

```txt
role
purpose
kpi
memoryScope
budgetLimit
allowedActions
forbiddenActions
failureCriteria
```

## Example

```txt
Agent: Offer Builder
Purpose: create profitable and clear offers for selected ICP
Tools: market research, pricing model, CRM notes
Memory: winning offers, failed offers, client objections
KPI: response rate, demo booked, margin potential
Boundary: cannot publish/send without approval
Failure rule: repeated weak offers → succession review
```

## Agent Rule

The agent has no personal sovereignty.

It cannot:

- create its own goals,
- expand its own permissions,
- ignore budget,
- ignore scope,
- redefine success,
- contact clients unless allowed,
- spend money unless allowed,
- publish externally unless allowed.
