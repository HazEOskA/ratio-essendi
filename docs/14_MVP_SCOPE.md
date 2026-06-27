# MVP Scope

The first MVP must prove the architecture lives.

Do not build a full autonomous company in v0.1.

Build the smallest system that proves:

- agents exist as contracts,
- cells exist as contracts,
- outputs can be evaluated,
- failures can be detected,
- drift can be detected,
- succession can be requested,
- shadow cells can be prepared,
- failover can be simulated,
- events can be logged.

## MVP v0.1

MVP v0.1 includes:

```txt
Core contracts
System Cell registry
Agent registry
Event log
Evaluation status
Drift detection rule
Agent succession brief
Shadow cell simulation
Basic dashboard later
```

## Not Included in v0.1

Do not include yet:

- real money spending,
- autonomous outreach,
- external client emails,
- paid ads,
- production agent actions,
- complex orchestration,
- Kubernetes,
- multi-tenant SaaS,
- advanced UI polish.

## First Technical Proof

The first technical proof should show:

1. Create System Cell.
2. Create Agent.
3. Assign task.
4. Evaluate output.
5. Detect weak result.
6. Create Succession Brief.
7. Create Successor Candidate.
8. Mark old agent as archived.
9. Simulate Shadow Cell takeover.
10. Write all events to log.

## Validation

MVP passes only if:

- every visible control works,
- every action changes state,
- every state change is logged,
- every failure has a reason,
- every successor has lineage,
- every shadow takeover prevents split-brain.
