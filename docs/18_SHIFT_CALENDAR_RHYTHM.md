# Shift Calendar — Operating Rhythm

The Shift Calendar is a human operating rhythm for Ratio Essendi. It is not a runtime scheduler, not an automatic agent activation trigger, and not a shutdown mechanism.

## Hard Rule

No runtime code implements shifts. No agent is activated or deactivated by time of day. No weekend shutdown is automatic. The calendar is a discipline for the human operator, not instructions for the system.

## Conceptual Cadence

The factory metaphor (docs/17) maps to a three-shift day as a thinking model:

| Shift | Hours | Conceptual mode |
|---|---|---|
| Shift 1 (morning) | 06:00–14:00 | High-focus production: offer generation, prospecting, evaluation |
| Shift 2 (afternoon) | 14:00–22:00 | Review, approvals, succession decisions, log analysis |
| Shift 3 (night) | 22:00–06:00 | Low-priority background: cleanup, reflection, queued tasks |

This is a rhythm for the operator's attention, not a system clock.

## Weekday vs Weekend

**Weekdays — production mode**

The operator monitors the dashboard, approves or rejects offers, triggers succession, and responds to drift alerts. Agents run. The event log grows. Decisions are made.

**Weekends — reflection mode**

No new production targets. The operator uses this time for:

- Reading the full event log
- Architecture review and update planning
- Documentation updates (like this one)
- Cleanup of accumulated state
- Evaluation of the week's KPI results
- Deciding what to change before the next weekday cycle

The system does not know it is the weekend. Nothing stops automatically. The operator chooses to slow or pause.

## Why This Exists

Without a cadence, autonomous systems drift toward continuous production with no review loop. The Shift Calendar gives the operator a repeating structure: produce, review, reflect, improve. It maps to the factory quality loop: run → inspect → adjust → run again.

This cadence is compatible with the approval gate (docs/13): the system never acts without a human. The calendar defines when that human is most likely to be present and most useful.

## What This Is Not

- Not a cron job.
- Not an automatic pause at 22:00.
- Not a rule that agents must wait for a shift to start.
- Not a promise that the system will be staffed during any given shift.
