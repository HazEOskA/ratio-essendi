# Agent Succession Loop

Agent Succession Loop is the system mechanism for replacing weak, failed or drifting agents.

The system does not simply delete a failed agent without learning.

Before replacement, the agent must produce a succession brief.

## Core Idea

An agent that fails should pass forward what it learned.

The successor must be better aligned, not only newly generated.

## Failure Modes

Failure can be caused by:

- agent error,
- tool error,
- data error,
- goal error,
- operator error,
- market error,
- drift,
- budget violation,
- boundary violation.

The system must classify the failure before replacement.

## Succession Trigger

Succession can be triggered by:

- critical boundary breach,
- repeated KPI failure,
- repeated low-value output,
- repeated misunderstanding of role,
- drift,
- contract violation,
- unsafe behavior,
- useless overplanning,
- inability to act.

## Policy

```txt
Minor error:
  warning

Repeated similar error:
  under_review

Critical error or drift:
  succession_required

Contract breach:
  disabled → archived → replaced
```

## Succession Brief

```ts
type AgentSuccessionBrief = {
  failedAgentId: string
  failedAgentVersion: string
  cellId: string

  failureSummary: string
  failureType:
    | "agent_error"
    | "tool_error"
    | "data_error"
    | "goal_error"
    | "operator_error"
    | "market_error"
    | "drift"
    | "boundary_violation"

  repeatedWeaknesses: string[]
  missingTools: string[]
  missingMemory: string[]
  wrongAssumptions: string[]
  badPatterns: string[]

  recommendedSuccessorPrompt: string
  recommendedSuccessorRole: string
  recommendedKpis: string[]
  riskNotes: string[]
  evidence: string[]

  createdAt: string
}
```

## Successor Testing

A successor does not become active automatically.

It must enter sandbox.

The system compares:

```txt
old_agent vs successor_candidate
same task
same goal
same budget
same KPI
```

The successor is promoted only if it performs better.

## Agent Lineage

Every replacement must preserve lineage:

```txt
agent_v1 → agent_v2_candidate → agent_v2_active
```

The system must store:

- original agent,
- successor brief,
- replacement reason,
- test result,
- promotion event.
