# RATIO ESSENDI

System-of-systems agentic architecture. This repository currently holds the
**structure scaffold** only — documentation stubs and empty package
directories. Architecture content is filled in batch-by-batch.

## Structure

```
ratio-essendi/
├─ README.md
├─ package.json
├─ docs/                # architecture documents (00–15)
├─ packages/            # workspace packages (scaffold)
│  ├─ meta-governor/
│  ├─ system-registry/
│  ├─ system-cell/
│  ├─ cell-health/
│  ├─ failover-engine/
│  ├─ agent-registry/
│  ├─ agent-factory/
│  ├─ agent-succession/
│  ├─ evaluation-engine/
│  ├─ event-log/
│  ├─ memory-layer/
│  └─ shared/
└─ tests/
```

## Docs

| File | Topic |
| --- | --- |
| `docs/00_DIRECTION_LOCK.md` | Direction Lock |
| `docs/01_SYSTEM_OF_SYSTEMS_ARCHITECTURE.md` | System of Systems Architecture |
| `docs/02_SYSTEM_CELL_CONTRACT.md` | System Cell Contract |
| `docs/03_AGENT_ONTOLOGY.md` | Agent Ontology |
| `docs/04_AGENT_CONTRACT.md` | Agent Contract |
| `docs/05_AGENT_FACTORY.md` | Agent Factory |
| `docs/06_AGENT_SUCCESSION_LOOP.md` | Agent Succession Loop |
| `docs/07_DRIFT_RULE.md` | Drift Rule |
| `docs/08_UNMODELED_AUTHORITY.md` | Unmodeled Authority |
| `docs/09_KPI_MODEL.md` | KPI Model |
| `docs/10_SANDBOX_AND_STRATEGY_TESTING.md` | Sandbox and Strategy Testing |
| `docs/11_EVENT_LOG_AND_STATE_TRANSITIONS.md` | Event Log and State Transitions |
| `docs/12_FAILOVER_AND_SHADOW_CELLS.md` | Failover and Shadow Cells |
| `docs/13_SAFETY_BOUNDARIES.md` | Safety Boundaries |
| `docs/14_MVP_SCOPE.md` | MVP Scope |
| `docs/15_CHANGELOG_DECISIONS.md` | Changelog / Decisions |

> Status: **scaffold**. Document bodies are pending — awaiting source content.
