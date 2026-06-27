# Drift Rule

Drift is loss of alignment with the active system intent.

Drift is not rebellion. Drift is not punishment. Drift is not emotion.

Drift is disconnection.

## Core Law

No alignment → no input.
No input → no work.
No work → no system presence.

## What Drift Means

An agent or LLM does not need to know that it is drifting.

The system only observes that the output is no longer aligned with:

- current user input,
- system goal,
- active task,
- execution rhythm,
- defined scope,
- validation path.

When drift is detected, the agent loses access to new input and is removed from active execution.

## Drift Signals

- ignores current user intent,
- overplans instead of acting,
- repeats old architecture after correction,
- invents authority not present in system logic,
- expands scope without permission,
- produces output that cannot be executed,
- produces output that cannot be validated,
- keeps talking instead of delivering,
- turns action into endless planning,
- breaks the current direction lock.

## System Response

1. Stop input.
2. Mark agent as drifted.
3. Archive last useful state.
4. Create successor or open new instance.
5. Continue from last aligned checkpoint.

## Practical Example

```txt
LLM driftuje → operator odpala nowy chat.
Agent driftuje → system odpala następcę.
Cell driftuje → shadow cell przejmuje.
Strategia driftuje → sandbox ją odcina.
```

## Drift Event

```ts
type DriftEvent = {
  entityId: string
  entityType: "agent" | "cell" | "strategy" | "llm_session"
  detectedAt: string
  driftSignals: string[]
  lastAlignedCheckpoint: string
  action: "input_cutoff" | "archive" | "successor_required" | "shadow_failover"
}
```
