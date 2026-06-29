# Agent Work Contract

Every agent in Factory Core must satisfy this contract. An agent that does not meet all three requirements is a dead agent and will be rejected by `validateRegistry()`.

## Contract Fields

### `watch`
What data source or queue the agent monitors.  
Must be non-empty. Must name a specific store, queue, or event stream — not "everything" or "nothing".

### `trigger`
The specific condition that activates this agent.  
Must be a concrete predicate: a status value, a boolean field, or an event type.  
"Always" is not a valid trigger.

### `nextAction`
What the agent produces when triggered.  
Must name a concrete output type or state transition.  
"Does something" is not a valid next action.

## The 14 Registered Agents

| ID | Name | Watch | Trigger | Next Action |
|----|------|-------|---------|-------------|
| A | Signal Intake Officer | JobQueue signals | `signal.status === 'queued'` | → IntakeBrief |
| B | ICP Qualifier | IntakeBriefs | new IntakeBrief available | → QualifiedLead or TrashItem |
| C | Lead Enricher | QualifiedLeads (qualified=true) | new qualified lead | → EnrichedLead |
| D | Offer Strategist | EnrichedLeads | new EnrichedLead available | → OfferStrategy |
| E | Offer Builder | OfferStrategies | new OfferStrategy available | → DraftOffer |
| F | Offer Evaluator | DraftOffers | new DraftOffer available | → ScoredOffer (passed or failed) |
| G | Offer Editor | ScoredOffers (passed=false) | score below threshold | → revised DraftOffer back to F |
| H | Approval Gatekeeper | ScoredOffers (passed=true) | offer passes evaluation | → ApprovalItem (pending, sent: false) |
| I | Approval Monitor | ApprovalQueue | `item.status === 'approved'` | → WarehouseItem |
| J | Succession Watcher | All pipeline agents | agent failure or repeated low scores | → SuccessionFlag |
| K | Lineage Tracker | SuccessionFlags | succession flag logged | → SuccessionBrief |
| L | Quality Auditor | WarehouseItems | new item arrives in Warehouse | → QualityMetric |
| M | Performance Reporter | QualityMetrics | quality.metric logged | → Scorecard update |
| N | Factory Director | All pipeline stages and event log | drift in any stage or pipeline stall | → CorrectionBrief |

## Rules

1. An agent may not produce output that bypasses its successor in the defined chain.
2. An agent may not send to an external channel. All output lands in a FactoryStore collection.
3. An agent's `nextAction` must produce a type defined in `packages/factory-core/src/types.ts`.
4. Agents J–N are oversight agents. They do not produce offers. They produce control signals only.

## Adding a New Agent

1. Add its definition to `AGENT_REGISTRY` in `packages/factory-core/src/registry.ts` with all three fields.
2. Add its implementation to `packages/factory-core/src/agents.ts`.
3. Export it from `packages/factory-core/src/index.ts`.
4. Add at least one acceptance test in `tests/factory-core.test.ts`.
5. Update this document.
