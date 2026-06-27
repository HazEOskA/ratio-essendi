# Agent Factory

Agent Factory creates new agents only when there is a real need.

It must not create agents for fun. It must not create agents because the system wants more agents. It must not create duplicate agents.

## Agent Creation Trigger

A new agent can be proposed when:

- a real bottleneck exists,
- an existing agent cannot handle the task,
- a repeated task needs ownership,
- a KPI is blocked,
- a domain has no responsible agent,
- a current agent needs a helper,
- a failed agent requires a successor.

## Agent Creation Gate

Before creating an agent, the system must ask:

```txt
Can an existing agent do this?
Is this a repeated need?
Does this unblock KPI?
Does this require separate responsibility?
Can it be measured?
Does it have a budget?
Does it have a memory scope?
Does it have boundaries?
```

If the answer is weak, the new agent is rejected.

## Agent Factory Output

Agent Factory must output:

```ts
type AgentProposal = {
  proposedAgentName: string
  reason: string
  bottleneck: string
  targetCellId: string
  role: string
  purpose: string
  requiredTools: string[]
  requiredMemory: string
  proposedKpis: string[]
  budgetLimit: number
  boundaries: string[]
  expectedValue: string
  duplicationCheck: string
  approvalStatus: "pending" | "approved" | "rejected"
}
```

## Anti-Sprawl Rule

More agents does not mean more intelligence.

Every agent has cost.

The system should prefer:

1. improving an existing agent,
2. adding a helper,
3. narrowing scope,
4. only then creating a new agent.
