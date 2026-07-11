# Google Stitch Prompt — Ratio Essendi Remaining Product Screens

Use this prompt after the Command Center, Lead Engine and Operator Cockpit batch.

```text
You are extending an existing product UI called RATIO ESSENDI.

DO NOT redesign the existing visual language. Continue it exactly.

PRODUCT MEANING
Ratio Essendi means “reason for being”. Every component must answer:
- why does this exist?
- what is its operational status?
- what action can the human operator take?
- what evidence proves the action happened?

EXISTING DESIGN SYSTEM — HARD LOCK
- industrial AI operations console
- near-black background: #090A0A / #0D0E0E
- dark panels: #171919 / #1C1E1E
- thin technical borders: #3C4A49
- primary cyan: #00D7D7
- secondary magenta: #F69AE8
- warning yellow: #F2C230
- white primary text, muted blue-grey secondary text
- Plus Jakarta Sans for large headings
- JetBrains Mono for system labels, IDs, timestamps, metrics and controls
- sharp rectangular desktop cards, restrained 12–16px radius only on mobile
- subtle technical grid/noise background
- no glassmorphism, no gradients that look like consumer SaaS, no oversized rounded pills
- desktop: fixed left sidebar + top command bar
- mobile: dedicated composition with top identity bar, large cards, floating action button and five-item bottom navigation

EXISTING NAVIGATION
Command / Intelligence / Logistics / Personnel / System
Top tabs: Dashboard / Missions / Inventory / Agents / Logs

GLOBAL FUNCTIONAL RULE
Every visible control must represent a real action. Never add decorative buttons, fake switches, empty modals or meaningless KPIs.
When a backend action does not exist, show the control as visibly LOCKED or READ_ONLY.
All dangerous or external actions require an OPERATOR APPROVAL GATE.
The system may draft and prepare, but the operator sends or approves.

CREATE THE FOLLOWING NEW SCREENS AS SEPARATE DESKTOP AND MOBILE ARTBOARDS.

1. MISSION CONTROL / FACTORY RUN
Route concept: /factory-run
Purpose: start the operating day and launch one bounded production cycle.
Required desktop sections:
- top status strip: current mode, autopilot status, active client orders, training progress
- large “Start Day” mission card with one primary START CONTROLLED CYCLE button
- mode decision block showing CLIENT_MODE, REWORK_MODE, TRAINING_MODE or IDLE
- current mission brief with constraints and expected output
- agent execution sequence timeline with Intake, Research, Strategy, Production, QA, Packaging, Operator Review
- each step shows agent ID, status, input, output and evidence timestamp
- right-side Operator Gate panel with pending decisions
- previous 5 work runs table
- emergency PAUSE button, visually separated from normal actions
Mobile:
- one large mission card
- compact step timeline
- sticky operator gate card
- floating START CYCLE button

2. PRODUCTION LINE / LOGISTICS FLOOR
Route concept: /production-line
Purpose: show where every task is physically located in the production system.
Required desktop sections:
- horizontal eight-station production line
- stations: Intake, Research, Strategy, Content, Delivery, QA, Packaging, Operator Review
- each station shows status, assigned agent, task count and last output
- separate swimlanes for Client Work, Training, Rework and Delivery Packs
- task cards must show source, client, title, current station, quality score, revision count and next operator action
- bottleneck indicator derived from waiting-review or blocked tasks
- filters: ALL / CLIENT / TRAINING / REWORK / DELIVERY
- real links to order, output or delivery-pack details
Mobile:
- vertical station timeline
- filter chips
- expandable task cards
- sticky bottleneck summary

3. CLIENT ORDERS / APPROVAL GATES
Route concept: /orders
Purpose: receive real client work, inspect deliverables and make human decisions.
Required desktop sections:
- order intake form
- order pipeline columns: NEW, IN PRODUCTION, READY FOR REVIEW, APPROVED, REJECTED, CLOSED
- order cards with client, service, language, urgency, owner, revision and updated time
- deliverable preview panel
- four real operator decisions: APPROVE TO WAREHOUSE, CREATE DELIVERY PACK, REQUEST REWORK, REJECT
- feedback field required for rework and rejection
- evidence block showing which agent produced the output and what constraints were applied
- no automatic sending
Mobile:
- status tabs instead of six columns
- full-width order cards
- bottom-sheet style decision gate

4. DELIVERY PACK CENTER
Route concept: /delivery
Purpose: package approved work into a client-ready artifact without sending it automatically.
Required desktop sections:
- pack states: DRAFT, APPROVED, WAREHOUSE READY
- pack preview with executive summary, main deliverable, recommendations, next steps and safety note
- source chain: Order → Output → Delivery Pack → Case Record
- actions: CREATE PACK, APPROVE PACK, MOVE TO WAREHOUSE, EXPORT MARKDOWN
- explicit label: OPERATOR DELIVERS THROUGH EXTERNAL CHANNEL
- revision history and evidence timestamps
Mobile:
- pack status header
- accordion content sections
- sticky approval controls

5. WAREHOUSE / INSTITUTIONAL MEMORY
Route concept: /warehouse
Purpose: store approved reusable assets and closed case evidence.
Required desktop sections:
- search bar and filters for type, client, service, department and date
- asset grid/table toggle
- approved outputs section
- delivery packs section
- case records section
- each asset card shows source, quality score, approval date, agent and reuse readiness
- detail drawer with full evidence chain
- actions limited to OPEN, EXPORT, ARCHIVE and REUSE AS TEMPLATE
- no delete action on approved evidence without a separate destructive confirmation gate
Mobile:
- search-first layout
- segmented filters
- compact evidence cards

6. AUDIT LOG / EVIDENCE TIMELINE
Route concept: /events
Purpose: prove what happened, when, by which agent or operator and against which target.
Required desktop sections:
- immutable chronological timeline
- filters: ALL, FACTORY, LEADS, ORDERS, DELIVERY, OPERATOR, INTEGRITY, ERRORS
- event row fields: timestamp, actor, event type, target ID, summary, evidence link
- severity accents: cyan info, magenta integrity/critical, yellow warning, red failure
- operator action stream visually distinct from autonomous factory events
- export controls for JSON and CSV
- system timestamp and persistence-driver badge
- no edit controls
Mobile:
- collapsible event cards
- sticky filters
- one-tap copy event ID

7. DAILY PRODUCTION REVIEW
Route concept: /daily-review
Purpose: review training outputs when no client work is active.
Required sections:
- progress 0/5 to 5/5
- department cards: Marketing, Sales, Delivery, Research, QA
- output preview
- actions: ACCEPT, REQUEST REWORK, REJECT, MOVE TO WAREHOUSE
- explicit TRAINING / NOT CLIENT WORK badge
- daily summary and lessons learned

8. REJECTED / FAILED WORK
Route concept: /trash
Purpose: inspect rejected, failed or quarantined work without hiding evidence.
Required sections:
- rejected offers
- rejected outputs
- failed work runs
- quarantined integrity incidents
- reason, actor, timestamp and source
- actions: OPEN EVIDENCE, RETRY AS NEW CONTROLLED RUN, ARCHIVE
- never silently restore or resend

DELIVERABLE FORMAT
- create one desktop artboard and one mobile artboard per screen
- reuse the same sidebar, topbar, mobile header and bottom navigation from the existing Ratio Essendi screens
- keep component names and labels implementation-ready
- include realistic but clearly illustrative data
- prioritize information hierarchy and operational clarity over decoration
- do not merge several screens into one giant dashboard
- do not create landing pages or marketing sections
```
