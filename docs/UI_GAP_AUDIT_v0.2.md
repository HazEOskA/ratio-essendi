# Ratio Essendi UI Gap Audit v0.2

Status: implementation complete for the current Stitch batch; live visual QA still required before merge.

## Current locked screens

### 1. Command Center — desktop
Implemented:
- adaptive sidebar identity block
- desktop command topbar with mode, status and operator identity
- system status hero
- eight infrastructure module cards
- live metrics derived from current API state
- recent work-run event feed
- operator attention cards
- real start/pause operation controls

### 2. Command Center — mobile
Implemented:
- dedicated mobile header and bottom navigation
- large operational status card
- CPU/MEM/run indicators derived from state
- four mobile-priority module cards
- terminal-style event output
- floating start-operation control

### 3. Lead Engine Operations
Implemented:
- quality, velocity and draft metrics
- active lead table
- high-value local filter
- neural staging panel
- create thread
- capture incoming message
- redraft
- draft proposal
- mark reply as sent by operator
- change thread status
- operator-only send boundary remains unchanged

### 4. Operator Cockpit
Implemented:
- work-run health console
- integrity incident cards
- SVG deployment network map
- map zoom controls
- safe autopilot control
- verbose-log preference
- diagnostics and telemetry strip
- unsupported auto-heal shown as locked, not as a fake control

## Shared implementation rules now enforced

- every visible action performs a real route, API mutation, local view operation or is visibly locked
- no autonomous external send action
- existing domain state remains authoritative
- PersistencePort and Supabase contracts are untouched
- `?legacy=1` remains the rollback route
- current UI is isolated behind the Vercel-facing renderer

## Remaining product UI gaps

The following routes still use the legacy renderer and need the same visual system:

1. `/factory-run` — Mission Control / Start Day
2. `/production-line` — Agent Production Floor / Logistics
3. `/orders` — Client Orders and Approval Gates
4. `/delivery` — Delivery Pack Center
5. `/warehouse` — Institutional Memory / Approved Assets
6. `/events` — Audit Log and Evidence Timeline
7. `/daily-review` — Daily Production Review
8. `/trash` — Rejected and Failed Work

## Validation gate

Before merge:

```bash
npm run typecheck
npm test
npm run build:vercel
```

Then validate on Vercel:
- desktop at 1440px+
- tablet around 1024px
- Samsung S22 Ultra portrait
- real lead create/review flow
- real autopilot start/pause
- `?legacy=1` rollback
- no horizontal overflow
- no dead controls
