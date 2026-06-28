# Factory Metaphor — Conceptual Layer

Ratio Essendi may use a factory/company metaphor as a thinking aid and communication layer. This metaphor helps map abstract system concepts to familiar operational language.

## Hard Rule

This metaphor is documentation only in v0.1. No runtime abstractions, entities, or packages should be created from it until a concrete operational need is identified and scoped.

## Mapping

| Factory term | Ratio Essendi concept |
|---|---|
| Hall / work area | Operational domain; the scope a system cell governs |
| Production line | Workflow pipeline; the sequence of agent steps producing a deliverable |
| Machine | Tool, runtime, or package executing a specific function |
| Pallet | Batch of tasks, leads, offers, or assets moving through a pipeline |
| Warehouse | Backlog, memory layer, or asset store |
| Mechanic | Maintenance / debug role; a human or agent restoring a broken component |
| Technologist | Process improvement / review role; proposes pipeline changes |
| Quality control | Evaluation engine, judge, and testing layer |
| BHP / safety | Safety boundaries, compliance rules, and policy enforcement (docs/13) |
| Dispatch / expedition | Delivery step; client handoff after approval |
| Cleaning / 5S | Repository hygiene, documentation updates, state cleanup |

## What This Is Not

- Carts, forklifts, managers, directors, and cleaning roles are not runtime entities in v0.1.
- The metaphor does not imply a physical simulation.
- No runtime entity should be named after a factory role until it has a concrete contract and a test.
- The metaphor does not override the System of Systems architecture (docs/01).

## Why It Exists

Operational teams, clients, and non-technical stakeholders often find factory language clearer than distributed-systems language. The metaphor gives the same system two valid vocabularies: one for engineers, one for operators.

The runtime is always the source of truth. The metaphor is a translation layer.
