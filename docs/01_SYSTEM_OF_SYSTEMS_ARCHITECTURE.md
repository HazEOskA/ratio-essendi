# System of Systems Architecture

Ratio Essendi is a system of systems.

This means there is no single Core that owns all reality.

Instead, the system is composed of multiple Core Cells.

Each Core Cell owns one operational domain.

Examples:

- Product Factory Cell
- Sales Factory Cell
- Marketing Factory Cell
- Finance Guard Cell
- Security / Risk Cell
- Research / Signal Cell
- Delivery Cell
- Content Cell
- Customer Success Cell

## Main Architecture

```txt
Ratio Essendi
├─ Meta-Governor
│  ├─ system health
│  ├─ ownership rules
│  ├─ conflict resolution
│  ├─ failover rules
│  ├─ emergency stop
│  └─ constitution reference
│
├─ Core Cell: Product Factory
│  ├─ agents
│  ├─ memory
│  ├─ KPIs
│  ├─ budget
│  └─ shadow copy
│
├─ Core Cell: Sales Factory
│  ├─ agents
│  ├─ offers
│  ├─ CRM state
│  ├─ KPIs
│  └─ shadow copy
│
├─ Core Cell: Marketing Factory
│  ├─ content agents
│  ├─ campaign agents
│  ├─ analytics
│  └─ shadow copy
│
├─ Core Cell: Finance Guard
│  ├─ cost control
│  ├─ revenue tracking
│  ├─ risk limits
│  └─ shadow copy
│
└─ Core Cell: Security / Risk
   ├─ audit
   ├─ permissions
   ├─ anomaly detection
   └─ shadow copy
```

## Core Principle

Core is not one machine.

Core is a role.

A Core function can exist in different cells. A cell can fail. A shadow cell can replace it. A system can degrade without killing the whole city.

## Failure Levels

```txt
Agent fails      → Agent Succession Loop
Strategy fails   → Sandbox testing and replacement
Cell fails       → Shadow Cell failover
System conflicts → Meta-Governor ownership rule
Global risk      → Safe mode / emergency stop
```

## No Single Point of Failure

No agent, model, cell, process or dashboard may become the only point of failure.

If one part fails, the system must preserve:

- last known good state,
- event log,
- memory snapshot,
- active tasks,
- KPI state,
- budget state,
- replacement path.
