# System Cell Contract

A System Cell is an independent operational unit inside Ratio Essendi.

Each cell owns a domain.

A cell has:

- purpose,
- agents,
- memory scope,
- KPIs,
- budget,
- status,
- event log,
- failover policy,
- optional shadow cell.

## Type Definition

```ts
type SystemCell = {
  id: string
  name: string
  domain:
    | "product"
    | "sales"
    | "marketing"
    | "finance"
    | "security"
    | "research"
    | "delivery"
    | "content"
    | "customer_success"

  purpose: string
  coreAgentId?: string
  agents: string[]
  memoryScope: string
  budgetLimit: number
  kpis: string[]

  healthStatus:
    | "healthy"
    | "degraded"
    | "failed"
    | "recovering"
    | "quarantined"

  shadowCellId?: string
  failoverPolicy: string
  activeController: boolean
  createdAt: string
  updatedAt: string
}
```

## Cell Rules

1. One cell owns one domain.
2. One domain can have only one active controller.
3. A shadow cell can observe or prepare, but cannot act unless promoted.
4. A failed cell is quarantined.
5. A quarantined cell cannot perform external actions.
6. Every cell must expose health state.
7. Every cell must write event logs.
8. Every cell must be replaceable.

## Split-Brain Protection

Split-brain means two cells believe they both control the same domain.

This is forbidden.

Rule:

Only one active controller per domain.

If conflict is detected:

1. Freeze both competing cells.
2. Check last valid ownership event.
3. Promote only one active controller.
4. Quarantine the other.
5. Write conflict event to log.
