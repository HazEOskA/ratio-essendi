# Failover and Shadow Cells

A system cell can fail.

When a cell fails, the whole system must not die.

A shadow cell exists to replace or recover the failed cell.

## Shadow Cell

A Shadow Cell is a standby or sandbox copy of a System Cell.

It may contain:

- cell contract,
- latest valid snapshot,
- agent registry,
- memory scope,
- KPI state,
- budget state,
- active task state,
- event log reference.

## Failover Flow

```txt
1. Cell health check fails.
2. Cell is marked degraded.
3. Recovery attempt starts.
4. If recovery fails, cell is marked failed.
5. Failed cell is quarantined.
6. Shadow cell is promoted.
7. Old cell loses external action rights.
8. Logs are compared.
9. Last valid state is restored.
10. Dashboard shows failover event.
```

## Type Definition

```ts
type FailoverPolicy = {
  cellId: string
  shadowCellId: string
  healthCheckInterval: string
  maxFailureCount: number
  recoveryAttempts: number
  promoteShadowOnFailure: boolean
  quarantineFailedCell: boolean
  requireManualApprovalForExternalActions: boolean
}
```

## Split-Brain Rule

Only one cell can control a domain.

If both original and shadow cell try to act:

```txt
freeze both
check ownership event
promote one
quarantine the other
log conflict
```

## Failover Is Not Deletion

A failed cell is not erased immediately.

It is:

- frozen,
- quarantined,
- archived,
- analyzed,
- replaced or recovered.
