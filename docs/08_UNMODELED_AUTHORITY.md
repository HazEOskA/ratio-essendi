# Unmodeled Authority

The system does not model God as a runtime actor.

Authority outside the system is intentionally unmodeled.

This means:

- God is not a module.
- God is not an agent.
- God is not an event.
- God is not written into logs.
- God is not part of runtime.
- God is not represented as deleted_by_god.

The system does not know metaphysical actors.

The system only knows state transitions, policies and events.

## Runtime Rule

Do not write:

```txt
God deleted Agent X
```

Write:

```txt
agent.disabled
agent.archived
agent.replaced
policy_triggered
succession_required
```

## Agent Rule

Agents do not ask why.

Agents do not know feelings.

Agents do not understand rebellion.

Agents do not negotiate work.

Agents execute their assigned roles until system policy changes their lifecycle state.

## Correct Logging

Logs must describe:

- state transitions,
- policy triggers,
- evaluation results,
- failure classification,
- succession,
- archive,
- replacement,
- failover.

Logs must not describe:

- divine action,
- metaphysical punishment,
- emotional rebellion,
- agent suffering,
- agent desire.

## Clean Runtime Sentence

The system does not model metaphysical authority.

The system models:

```txt
state
policy
event
transition
result
```
