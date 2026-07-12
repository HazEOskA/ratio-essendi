# Ratio Essendi UI Gap Audit v0.3

Status: all planned operator routes are integrated into the Stitch visual system on `feature/stitch-ui-1to1`. Automated validation and live desktop/mobile QA are still required before merge.

## Implemented screen set

### 1. Command Center — desktop
- adaptive sidebar identity block
- desktop command topbar with mode, status and operator identity
- system status hero
- eight infrastructure module cards
- live metrics derived from current API state
- recent work-run event feed
- operator attention cards
- real start/pause operation controls

### 2. Command Center — mobile
- dedicated mobile header and bottom navigation
- large operational status card
- CPU/MEM/run indicators derived from state
- four mobile-priority module cards
- terminal-style event output
- floating start-operation control

### 3. Lead Engine Operations
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
- work-run health console
- integrity incident cards
- SVG deployment network map
- map zoom controls
- safe autopilot control
- verbose-log preference
- diagnostics and telemetry strip
- unsupported auto-heal shown as locked, not as a fake control

### 5. Mission Control — `/factory-run`
- operating-day hero and live status strip
- controlled-cycle and emergency-pause actions
- current mission brief
- operator-gate count
- agent execution sequence
- latest five persisted work runs
- original order, training and review controls embedded as the authoritative action layer

### 6. Production Line — `/production-line`
- eight-station factory floor
- assigned agent, state, task count and last output per station
- client, training, rework and delivery swimlanes
- local lane filters
- bottleneck summary
- original demo-run, cycle and drill-down controls retained

### 7. Client Orders — `/orders`
- status-based order board
- live order summaries from `/api/admin/state`
- intake and controlled-cycle entry points
- operator-only approval boundary
- original deliverable previews and decision forms retained

### 8. Delivery Pack Center — `/delivery`
- draft, approved and warehouse-ready pack overview
- source-chain visualization
- explicit manual-delivery boundary
- original create, approve, warehouse and export controls retained

### 9. Warehouse — `/warehouse`
- approved output, delivery-pack and case-record summary
- institutional-memory framing
- original evidence tables and asset actions retained

### 10. Audit Log — `/events`
- audit/evidence shell
- persisted event count and timestamp
- JSON and CSV export of the visible authoritative table
- original immutable event timeline retained

### 11. Daily Production Review — `/daily-review`
- 0/5 to 5/5 training progress
- five department cards
- explicit TRAINING / NOT CLIENT WORK boundary
- original accept, rework, reject and warehouse controls retained

### 12. Rejected / Failed Work — `/trash`
- rejected asset, failed-run and integrity-incident summary
- no silent restore/resend rule
- original failed-work evidence retained

## Integration architecture

The new product screens do not duplicate business rules.

```text
Stitch product shell
  -> live JSON view models
      -> /api/admin/state
      -> /api/production-line
      -> /api/work-runs
      -> /api/delivery-packs
  -> authoritative action bridge
      -> fetch current route with ?legacy=1
      -> extract existing audited forms and evidence
      -> submit original /api/* actions through fetch
      -> refresh the live shell
```

This bridge is deliberate for this phase: it replaces the old visual hierarchy immediately while keeping the existing backend forms, validation, operator gates and persistence behavior authoritative.

## Shared implementation rules enforced

- every visible action performs a real route, API mutation, local view operation or is visibly locked
- product-screen notifications route to the audit/event center instead of using a dead control
- no autonomous external send action
- existing domain state remains authoritative
- PersistencePort and Supabase contracts are untouched
- `?legacy=1` remains the rollback route on every integrated page
- current UI is isolated behind the Vercel-facing renderer
- the branch remains unmerged until visual and interaction approval

## Remaining gaps

No planned route is intentionally left on the old visual shell by default.

Remaining work is validation and refinement, not another design round:

1. automated typecheck
2. full test suite
3. Vercel bundle build
4. desktop live QA at 1440px+
5. tablet QA around 1024px
6. Samsung S22 Ultra portrait QA
7. real lead create/review flow
8. order → production → review → delivery-pack flow
9. autopilot start/pause and controlled-cycle flow
10. `?legacy=1` rollback on every route
11. horizontal-overflow and dead-control audit
12. visual corrections requested by the operator before merge

## Validation gate

Before merge:

```bash
npm run typecheck
npm test
npm run build:vercel
```

The PR stays draft until the automated gates pass and Osa approves the live preview.
