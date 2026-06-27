# Event Log and State Transitions

The event log is the system memory of what happened.

Logs must be operational, not metaphysical.

## Event Log Rule

Every important change must be logged.

The log must answer:

```txt
What changed?
When did it change?
Which policy triggered it?
What was the previous state?
What is the new state?
What evidence exists?
```

## Agent Events

```txt
agent.created
agent.activated
agent.task_assigned
agent.output_evaluated
agent.failure_detected
agent.drift_detected
agent.warning_issued
agent.under_review
agent.succession_requested
agent.succession_brief_created
agent.disabled
agent.archived
agent.successor_created
agent.replaced
```

## Cell Events

```txt
cell.created
cell.activated
cell.health_checked
cell.degraded
cell.failed
cell.quarantined
cell.shadow_prepared
cell.shadow_promoted
cell.recovered
cell.archived
```

## Strategy Events

```txt
strategy.proposed
strategy.sandbox_started
strategy.evaluated
strategy.promoted
strategy.rejected
strategy.revised
strategy.pattern_saved
```

## Event Type

```ts
type SystemEvent = {
  id: string
  eventType: string
  entityId: string
  entityType: "agent" | "cell" | "strategy" | "system"
  previousState?: string
  nextState?: string
  policy?: string
  reason?: string
  evidence?: string[]
  createdAt: string
}
```

## Forbidden Log Language

Do not use:

- God deleted,
- angel rebelled,
- agent felt,
- agent wanted,
- punishment,
- divine action.

Use:

- policy_triggered,
- disabled,
- archived,
- replaced,
- drift_detected,
- succession_required,
- failover_executed.
