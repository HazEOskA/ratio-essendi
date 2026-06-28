# Prospecting v0.1 — Implementation Evidence

**Date:** 2026-06-28  
**Commit:** `9de045d`  
**Branch:** `claude/ratio-essendi-structure-6hr0ns`  
**Status:** All checks pass. No new features beyond scope. No external send wired.

---

## 1. Package Added

**`packages/prospecting`** (`@ratio-essendi/prospecting`)

```
packages/prospecting/
  package.json
  src/
    types.ts            — ProspectProfile, QualificationResult, LeadBrief, ProspectAgentResult
    qualifier.ts        — QualifierProvider interface + HeuristicQualifier (offline)
    prospects.ts        — PROSPECT_POOL: 5 sample leads (3 ICP match, 2 don't)
    run-prospect-agent.ts — qualify → offer pipeline → approval gate
    index.ts            — public exports
```

Dependencies: `shared`, `evaluation-engine`, `meta-governor`, `offer-builder`.  
No new external dependencies added.

---

## 2. Commands Run and Verified

### Install

```
npm install
```

New workspace `@ratio-essendi/prospecting` linked to `node_modules/@ratio-essendi/prospecting`.

### Typecheck

```
npm run typecheck
```

Exit 0. No errors. Strict TypeScript (`noImplicitAny`, `verbatimModuleSyntax`, `noUnusedLocals`).

### Tests

```
npm test
```

See section 3 for full output.

### Prospect demo

```
npm run prospects
```

See section 4 for full output.

---

## 3. Test Results

**Command:** `npm test`  
**Date:** 2026-06-28  
**Runner:** `tsx --test tests/*.test.ts` (node:test)

```
ok 1  - operator can approve a pending offer (decision recorded, nothing sent)
ok 2  - operator can quarantine a drifting agent
ok 3  - operator can force succession, preserving lineage
ok 4  - local report summarizes pending approvals and attention
ok 5  - dashboard renders cells, agents and decisions as standalone HTML
ok 6  - evaluateAgent passes and emits agent.output_evaluated when score >= 0.5
ok 7  - evaluateAgent fails and emits agent.failure_detected when score < 0.5
ok 8  - factory season increases pass rate and modeled value via succession
ok 9  - factory season keeps the system coherent (no split-brain, one log)
ok 10 - first technical proof satisfies docs/14 validation
ok 11 - event log captures the full 10-step lifecycle
ok 12 - heuristic judge passes a strong offer
ok 13 - heuristic judge fails a weak/spammy offer with reasons
ok 14 - judged offer flow drives succession on a weak first draft, then passes
ok 15 - a fully failing offer flow disables the blocked agent (not left active)
ok 16 - detectDrift preserves a cell entity type in the log
ok 17 - detectDrift maps llm_session to a valid system entity type but keeps it in the event type
ok 18 - agent drift still logs agent.drift_detected (unchanged)
ok 19 - offer agent produces an offer, evaluates it, and never auto-sends (docs/13)
ok 20 - world state and log survive a restart via the file store
ok 21 - HeuristicQualifier passes a strong ICP match (B2B SaaS founder, right size, revenue pain)
ok 22 - HeuristicQualifier rejects an enterprise non-SaaS prospect
ok 23 - runProspectAgent: qualified lead goes through offer pipeline and reaches approval gate
ok 24 - runProspectAgent: disqualified lead produces no offer and logs prospect.disqualified
ok 25 - findClient demo: pool ranked by fit, best match selected and pitched

# tests 25
# pass  25
# fail  0
```

Tests 21–25 are new. Tests 1–20 unchanged; all still pass (no regressions).

---

## 4. Demo Output (`npm run prospects`)

```
═══════════════════════════════════════════════
  RATIO ESSENDI — Prospect Qualification Run
═══════════════════════════════════════════════

ICP:     Seed-stage B2B SaaS founders (10-50 employees)
Product: Fractional RevOps sprint

Scoring 5 prospects…

  ✓ 100%  Marta Wiśniewska       Co-Founder & CEO          PipelineOS
  ✓ 100%  Carlos Reyes           Founder                   Stackly
  ✓ 100%  Jan Kowalski           CEO                       Clarix
  ✗   0%  Diana Hoffmann         VP Procurement            MegaCorp Manufacturing
         → industry 'Industrial manufacturing' is outside SaaS/tech ICP; company size
           '5000+' is outside seed-stage range; role 'VP Procurement' is not a
           founder/CEO decision-maker; no sales/revenue pain detected
  ✗   0%  Fatima El-Amin         Managing Director         BrandBoost Agency
         → industry 'Marketing agency' is outside SaaS/tech ICP; company size '8-12'
           is outside seed-stage range; role 'Managing Director' is not a
           founder/CEO decision-maker; no sales/revenue pain detected

3 of 5 prospects qualify for outreach.

Best match: Marta Wiśniewska at PipelineOS (fit 100%)
Notes: Raised seed round 6 months ago, now scaling sales motion.

Running offer pipeline…

Status:      pending_approval
Agent:       agent-1
Offer score: 1.00
Sent:        false  (approval gate holds; docs/13)

──────────────────────────────────────────────
OFFER (held at approval gate — not sent):

Offer: Fractional RevOps sprint for Seed-stage B2B SaaS founders (10-50 employees)
— specifically Marta Wiśniewska at PipelineOS (Co-Founder & CEO)

A focused, ROI-first engagement tailored to Seed-stage B2B SaaS founders
(10-50 employees) — specifically Marta Wiśniewska at PipelineOS (Co-Founder & CEO),
scoped to 2-week delivery, fixed scope. Outcomes are measured, not promised.

Price: $4,000 fixed
Margin: ~65% protected (no discounting below floor)
Call to action: Book a 20-minute scoping demo this week.
──────────────────────────────────────────────

Event log (last 8 decisions):
  cell.created [∅ → healthy]  cell-1
    Cell 'Sales Factory' registered for domain 'sales'.
  cell.activated [∅ → active_controller]  cell-1
  prospect.qualified  prospect-001
    ICP fit 100% — Marta Wiśniewska at PipelineOS
  agent.created [∅ → created]  agent-1
    Agent 'Prospector → PipelineOS' created for role 'offer-builder'.
  agent.activated [created → active]  agent-1
    Agent activated.
  agent.task_assigned  agent-1
    Pursue role 'offer-builder' within budget 200.
  agent.output_evaluated [∅ → pass]  agent-1
    Judge 1: strong
  approval.required [∅ → pending_approval]  agent-1
    Offer ready; external send blocked pending human approval (docs/13).
```

---

## 5. Dashboard Action Behavior

A **"Find Client"** button was added to the live ops toolbar (`npm run dashboard:serve`).

**What it does when clicked:**

1. Reads the current `#pending` queue to identify companies already contacted.
2. Scores all uncontacted prospects in `PROSPECT_POOL` via `HeuristicQualifier`.
3. Selects the prospect with the highest fit score.
4. Runs the full qualification + offer pipeline (`runProspectAgent`).
5. If the offer passes the judge: pushes a `PendingOffer` entry to the pending queue.
6. The new offer appears in **"Pending your approval"** on the next 2-second state refresh.
7. If the pool is exhausted: logs `prospect.pool_exhausted` and does nothing else.

**What it does not do:**

- It does not send anything. No email, no CRM write, no external HTTP call.
- It does not approve its own output. The operator must click Approve.
- It does not bypass the judge. A weak offer triggers succession; a doubly-weak offer is blocked and never surfaces in the pending queue.

---

## 6. Approval Gate Guarantee

The structural guarantee from docs/13 is preserved and extended:

| Field in `ProspectAgentResult` | Value | Enforced by |
|---|---|---|
| `sent` | always `false` | TypeScript type literal; no runtime path sets it to `true` |
| `status` | `pending_approval` \| `blocked` \| `disqualified` | exhaustive union; no `sent` state exists |

The log event `approval.required` is the only place a qualified offer surfaces. No code path proceeds past that event without a human calling `world.approve(offerId)`.

Test 23 explicitly asserts:
```typescript
assert.equal(result.status, "pending_approval", "offer must be held at approval gate, never sent")
assert.equal(result.sent, false)
assert.ok(log.some((e) => e.eventType === "approval.required"))
```

Test 24 explicitly asserts:
```typescript
assert.ok(!log.some((e) => e.eventType === "approval.required"), "no approval event for a disqualified lead")
```

---

## 7. Known Limitations

**Qualifier accuracy**
- `HeuristicQualifier` uses keyword matching against four dimensions (industry, size, role, pain). It does not use an LLM. A prospect with unusual phrasing may be mis-scored.
- Size scoring matches keywords ("seed", "startup", "10-50") but not bare numbers ("we have 22 people"). Fine for structured CRM fields; brittle for free text.
- Current threshold: ≥ 3 of 4 dimensions must match (fit score ≥ 0.75). No calibration data behind this number.

**Prospect pool**
- `PROSPECT_POOL` is static — 5 hand-written profiles. It is a demo fixture, not a real CRM integration.
- `findClient()` tracks contacted companies by name matching on `agentName` (`"Prospector → CompanyName"`). This is fragile if the company name changes or is reused.
- Pool exhaustion logs an event but does not suggest remediation.

**Offer personalisation**
- The offer is personalised by embedding the prospect's name, company, and role in the ICP string passed to the offer provider. With `StubOfferProvider` (offline), this appears verbatim in the output. With `AnthropicJudge` + a live provider, personalisation depth depends on the model prompt.

**No cross-run deduplication**
- On a server restart with persistence, the `#pending` queue is restored. However, `PROSPECT_POOL` has no persistent "contacted" flag — only the in-memory pending queue is checked. A prospect could be re-pitched after a restart if their offer was approved or rejected (removed from `pending`).

**Single ICP**
- The ICP is hardcoded in `tests/world.ts` (`findClient()`). Switching ICP requires a code change, not a config change.

---

## 8. Next Validation Checklist

The following items are not done and are not blocked — they represent the logical next steps to validate Prospecting v0.1 in production conditions.

- [ ] **Live qualification run with `ANTHROPIC_API_KEY`** — swap `HeuristicQualifier` for an `AnthropicQualifier` that prompts the model with the prospect profile and ICP definition. Verify that the LLM agrees with the heuristic on the 5 sample prospects.
- [ ] **Offer personalisation depth** — run `npm run prospects` with a live Claude provider. Confirm the offer references the prospect's specific pain points, not just their name and company.
- [ ] **Dashboard approval round-trip** — start `npm run dashboard:serve`, click "Find Client", verify the offer appears in "Pending your approval", click "Approve", verify `approval.granted` appears in the decision log and the offer moves out of the pending queue.
- [ ] **Pool exhaustion path** — click "Find Client" 4 times (3 qualified + 1 repeated attempt). Verify `prospect.pool_exhausted` appears in the log on the 4th click and no duplicate offer is created.
- [ ] **Persistence after findClient** — run `npm run dashboard:serve`, click "Find Client", restart the server, verify the prospected offer and qualified prospect event survive the restart in the log.
- [ ] **Blocked offer path** — replace `StubOfferProvider` with a stub that always returns a weak offer, trigger "Find Client". Verify `blocked` status, `agent.blocked` log event, and no `approval.required` event.
- [ ] **Qualifier keyword gap** — add a prospect with non-standard phrasing (e.g. role = "Managing Partner", industry = "growth SaaS") and verify the qualifier scores it correctly or document the miss.
- [ ] **Deduplication after approval** — approve an offer, then click "Find Client" again for the same company. Verify a second offer is or is not generated (current behaviour: it is, because approved offers leave the pending queue). Decide whether this is intended.
