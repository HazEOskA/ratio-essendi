// GENERATED FILE — do not edit. Rebuild with: npm run build:vercel

// tests/factory-serve.ts
import { createServer } from "node:http";
import { join as join2 } from "node:path";
import { mkdirSync as mkdirSync2, existsSync as existsSync2 } from "node:fs";

// packages/factory-core/src/store.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
var JsonStore = class {
  #path;
  #data;
  constructor(path, initial) {
    this.#path = path;
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (existsSync(path)) {
      this.#data = JSON.parse(readFileSync(path, "utf-8"));
    } else {
      this.#data = initial;
      this.#write();
    }
  }
  read() {
    return this.#data;
  }
  update(fn) {
    this.#data = fn(this.#data);
    this.#write();
  }
  #write() {
    const tmp = this.#path + ".tmp";
    writeFileSync(tmp, JSON.stringify(this.#data, null, 2), "utf-8");
    renameSync(tmp, this.#path);
  }
};
var FactoryStore = class {
  #signals;
  #leads;
  #approval;
  #warehouse;
  #trash;
  #events;
  #dailyDigitals;
  #dailyMissions;
  #feedbackEvents;
  #orders;
  #settings;
  #workRuns;
  #deliveryPacks;
  #caseRecords;
  #integrity;
  constructor(dataDir) {
    const p = (name) => join(dataDir, `${name}.json`);
    this.#signals = new JsonStore(p("signals"), []);
    this.#leads = new JsonStore(p("leads"), []);
    this.#approval = new JsonStore(p("approval"), []);
    this.#warehouse = new JsonStore(p("warehouse"), []);
    this.#trash = new JsonStore(p("trash"), []);
    this.#events = new JsonStore(p("events"), []);
    this.#dailyDigitals = new JsonStore(p("daily-digitals"), []);
    this.#dailyMissions = new JsonStore(p("daily-missions"), []);
    this.#feedbackEvents = new JsonStore(p("feedback-events"), []);
    this.#orders = new JsonStore(p("orders"), []);
    this.#settings = new JsonStore(p("settings"), { autopilotEnabled: true });
    this.#workRuns = new JsonStore(p("work-runs"), []);
    this.#deliveryPacks = new JsonStore(p("delivery-packs"), []);
    this.#caseRecords = new JsonStore(p("case-records"), []);
    this.#integrity = new JsonStore(p("integrity"), []);
  }
  snapshot() {
    return {
      signals: this.#signals.read(),
      leads: this.#leads.read(),
      approvalQueue: this.#approval.read(),
      warehouse: this.#warehouse.read(),
      trash: this.#trash.read(),
      events: this.#events.read(),
      dailyDigitals: this.#dailyDigitals.read(),
      dailyMissions: this.#dailyMissions.read(),
      feedbackEvents: this.#feedbackEvents.read(),
      orders: this.#orders.read(),
      workRuns: this.#workRuns.read(),
      deliveryPacks: this.#deliveryPacks.read(),
      caseRecords: this.#caseRecords.read(),
      integrity: this.#integrity.read()
    };
  }
  // --- Pipeline ---
  addSignal(s) {
    this.#signals.update((arr) => [...arr, s]);
  }
  updateSignal(id, patch) {
    this.#signals.update((arr) => arr.map((s) => s.id === id ? { ...s, ...patch } : s));
  }
  addLead(l) {
    this.#leads.update((arr) => [...arr, l]);
  }
  addApprovalItem(item) {
    this.#approval.update((arr) => [...arr, item]);
  }
  updateApprovalItem(id, patch) {
    this.#approval.update((arr) => arr.map((a) => a.id === id ? { ...a, ...patch } : a));
  }
  addWarehouseItem(item) {
    this.#warehouse.update((arr) => [...arr, item]);
  }
  addTrashItem(item) {
    this.#trash.update((arr) => [...arr, item]);
  }
  addEvent(e) {
    this.#events.update((arr) => [...arr, e]);
  }
  getApprovalItem(id) {
    return this.#approval.read().find((a) => a.id === id);
  }
  // --- Daily Missions ---
  addDailyDigital(d) {
    this.#dailyDigitals.update((arr) => [...arr, d]);
  }
  updateDailyDigital(id, patch) {
    this.#dailyDigitals.update((arr) => arr.map((d) => d.id === id ? { ...d, ...patch } : d));
  }
  getDailyDigital(id) {
    return this.#dailyDigitals.read().find((d) => d.id === id);
  }
  getDailyDigitalsForDate(date) {
    return this.#dailyDigitals.read().filter((d) => d.date === date);
  }
  addDailyMission(m) {
    this.#dailyMissions.update((arr) => [...arr, m]);
  }
  addFeedbackEvent(e) {
    this.#feedbackEvents.update((arr) => [...arr, e]);
  }
  /** Digitals flagged needs_rework — the autopilot regenerates these. */
  getDigitalsNeedingRework() {
    return this.#dailyDigitals.read().filter((d) => d.status === "needs_rework");
  }
  // --- Client orders ---
  addOrder(o) {
    this.#orders.update((arr) => [...arr, o]);
  }
  updateOrder(id, patch) {
    this.#orders.update((arr) => arr.map((o) => o.id === id ? { ...o, ...patch } : o));
  }
  getOrder(id) {
    return this.#orders.read().find((o) => o.id === id);
  }
  /** Orders the factory still has to produce for (client work in progress). */
  getOpenOrders() {
    return this.#orders.read().filter((o) => o.status === "new" || o.status === "in_production");
  }
  // --- Delivery packs + case records ---
  addDeliveryPack(p) {
    this.#deliveryPacks.update((arr) => [...arr, p]);
  }
  updateDeliveryPack(id, patch) {
    this.#deliveryPacks.update((arr) => arr.map((p) => p.id === id ? { ...p, ...patch } : p));
  }
  getDeliveryPack(id) {
    return this.#deliveryPacks.read().find((p) => p.id === id);
  }
  addCaseRecord(c) {
    this.#caseRecords.update((arr) => [...arr, c]);
  }
  // --- Agent integrity (Pinocchio monitor) ---
  getIntegrityRecord(agentId) {
    return this.#integrity.read().find((r) => r.agentId === agentId);
  }
  upsertIntegrityRecord(rec) {
    this.#integrity.update((arr) => {
      const idx = arr.findIndex((r) => r.agentId === rec.agentId);
      if (idx === -1) return [...arr, rec];
      return arr.map((r, i) => i === idx ? rec : r);
    });
  }
  // --- Settings (survive restarts) ---
  getAutopilotEnabled() {
    return this.#settings.read().autopilotEnabled;
  }
  setAutopilotEnabled(value) {
    this.#settings.update((s) => ({ ...s, autopilotEnabled: value }));
  }
  // --- Work run ledger ---
  addWorkRun(run) {
    this.#workRuns.update((arr) => [...arr, run]);
  }
  getRecentWorkRuns(limit = 10) {
    return [...this.#workRuns.read()].reverse().slice(0, limit);
  }
  getLastWorkRun() {
    const runs = this.#workRuns.read();
    return runs[runs.length - 1];
  }
  /** Returns recent operator feedback text grouped by department, from needs_rework and rejected items. */
  getRecentFeedbackConstraints(days) {
    const cutoff = new Date(Date.now() - days * 864e5).toISOString();
    const result = {
      marketing: [],
      sales: [],
      delivery: [],
      research: [],
      qa: []
    };
    const events = this.#feedbackEvents.read().filter(
      (e) => e.timestamp >= cutoff && e.feedback && (e.action === "needs_rework" || e.action === "rejected")
    );
    for (const ev of events) {
      if (ev.feedback) result[ev.department].push(ev.feedback);
    }
    return result;
  }
};

// packages/factory-core/src/registry.ts
var AGENT_REGISTRY = [
  {
    id: "A",
    name: "Signal Intake Officer",
    role: "intake",
    watch: "JobQueue \u2014 incoming operator signals",
    trigger: "signal.status === 'queued'",
    nextAction: "Categorise signal, extract ICP signals \u2192 produce IntakeBrief"
  },
  {
    id: "B",
    name: "ICP Qualifier",
    role: "qualification",
    watch: "IntakeBriefs \u2014 output of Agent A",
    trigger: "new IntakeBrief available",
    nextAction: "Score brief vs ICP dimensions \u2192 QualifiedLead or TrashItem"
  },
  {
    id: "C",
    name: "Lead Enricher",
    role: "enrichment",
    watch: "QualifiedLeads where qualified === true",
    trigger: "new qualified lead",
    nextAction: "Add context, buyer persona, pain sharpening \u2192 EnrichedLead"
  },
  {
    id: "D",
    name: "Offer Strategist",
    role: "strategy",
    watch: "EnrichedLeads \u2014 output of Agent C",
    trigger: "new EnrichedLead available",
    nextAction: "Define ICP statement, positioning, KPIs, constraints \u2192 OfferStrategy"
  },
  {
    id: "E",
    name: "Offer Builder",
    role: "offer-builder",
    watch: "OfferStrategies \u2014 output of Agent D",
    trigger: "new OfferStrategy available",
    nextAction: "Draft offer text aligned to strategy \u2192 DraftOffer"
  },
  {
    id: "F",
    name: "Offer Evaluator",
    role: "evaluation",
    watch: "DraftOffers \u2014 output of Agent E or G",
    trigger: "new DraftOffer available",
    nextAction: "Score against KPIs \u2192 ScoredOffer (passed or failed)"
  },
  {
    id: "G",
    name: "Offer Editor",
    role: "editing",
    watch: "ScoredOffers where passed === false",
    trigger: "score below threshold (max 1 revision cycle)",
    nextAction: "Strengthen weak KPI dimensions \u2192 revised DraftOffer back to Agent F"
  },
  {
    id: "H",
    name: "Approval Gatekeeper",
    role: "approval-gate",
    watch: "ScoredOffers where passed === true",
    trigger: "offer passes evaluation",
    nextAction: "Create ApprovalItem (sent: false), log approval.required \u2192 operator decides"
  },
  {
    id: "I",
    name: "Approval Monitor",
    role: "routing",
    watch: "ApprovalQueue \u2014 items approved by operator",
    trigger: "item.status === 'approved'",
    nextAction: "Move approved item to Warehouse, log warehouse.received"
  },
  {
    id: "J",
    name: "Succession Watcher",
    role: "succession",
    watch: "All pipeline agents",
    trigger: "agent failure or repeated low scores detected",
    nextAction: "Flag agent for succession, log agent.drift_detected"
  },
  {
    id: "K",
    name: "Lineage Tracker",
    role: "lineage",
    watch: "SuccessionFlags \u2014 output of Agent J",
    trigger: "succession flag logged",
    nextAction: "Create succession brief with failure summary and repeatedWeaknesses"
  },
  {
    id: "L",
    name: "Quality Auditor",
    role: "quality",
    watch: "WarehouseItems \u2014 approved offers",
    trigger: "new item arrives in Warehouse",
    nextAction: "Score quality, log quality.metric, update scorecard"
  },
  {
    id: "M",
    name: "Performance Reporter",
    role: "reporting",
    watch: "Quality metrics \u2014 output of Agent L",
    trigger: "quality.metric logged",
    nextAction: "Aggregate metrics, update performance scorecards, log report.generated"
  },
  {
    id: "N",
    name: "Factory Director",
    role: "direction",
    watch: "All pipeline stages and event log",
    trigger: "drift in any stage or pipeline stall detected",
    nextAction: "Issue correction brief, reset stalled stage, log factory.correction_issued"
  },
  {
    id: "MA",
    name: "Marketing Producer",
    role: "production-marketing",
    watch: "Client orders routed to marketing + daily marketing mission slot",
    trigger: "open order (dept=marketing) or missing marketing training asset for today",
    nextAction: "Generate marketing_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "SA",
    name: "Sales Producer",
    role: "production-sales",
    watch: "Client orders routed to sales + daily sales mission slot",
    trigger: "open order (dept=sales) or missing sales training asset for today",
    nextAction: "Generate sales_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "DA",
    name: "Delivery Producer",
    role: "production-delivery",
    watch: "Client orders routed to delivery + daily delivery mission slot",
    trigger: "open order (dept=delivery) or missing delivery training asset for today",
    nextAction: "Generate delivery_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "RA",
    name: "Research Producer",
    role: "production-research",
    watch: "Client orders routed to research + daily research mission slot",
    trigger: "open order (dept=research) or missing research training asset for today",
    nextAction: "Generate research_asset with client brief / feedback constraints \u2192 daily_review"
  },
  {
    id: "QAA",
    name: "QA Producer",
    role: "production-qa",
    watch: "Client orders routed to qa + daily qa mission slot + needs_rework flags",
    trigger: "open order (dept=qa), missing qa training asset for today, or revision job pending",
    nextAction: "Generate qa_asset / regenerate flagged assets with feedback \u2192 daily_review"
  }
];
function getAgent(id) {
  const agent = AGENT_REGISTRY.find((a) => a.id === id);
  if (!agent) throw new Error(`Agent ${id} not in registry`);
  return agent;
}
function validateRegistry() {
  const errors = [];
  for (const agent of AGENT_REGISTRY) {
    if (!agent.watch.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing watch`);
    if (!agent.trigger.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing trigger`);
    if (!agent.nextAction.trim()) errors.push(`Agent ${agent.id} (${agent.name}): missing nextAction`);
  }
  return { ok: errors.length === 0, errors };
}

// packages/factory-core/src/agents.ts
import { randomUUID } from "node:crypto";
var CATEGORY_KEYWORDS = {
  "outbound-offer": ["offer", "pitch", "outreach", "prospect", "lead", "client", "sales", "revenue", "deal"],
  "product-strategy": ["strategy", "roadmap", "vision", "direction", "positioning", "market"],
  "operations": ["process", "ops", "workflow", "efficiency", "automation", "system"],
  "hiring": ["hire", "recruit", "team", "headcount", "talent", "engineer"]
};
function categorise(raw) {
  const lower = raw.toLowerCase();
  let best = "general";
  let bestCount = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = kws.filter((k) => lower.includes(k)).length;
    if (count > bestCount) {
      bestCount = count;
      best = cat;
    }
  }
  return best;
}
var ICP_SIGNALS = ["b2b", "saas", "founder", "seed", "series a", "revenue", "mrr", "arr", "churn", "pipeline", "sales"];
function agentA(signal) {
  const raw = signal.raw;
  const lower = raw.toLowerCase();
  const icpSignals = ICP_SIGNALS.filter((s) => lower.includes(s));
  return {
    signalId: signal.id,
    category: categorise(raw),
    icpSignals,
    enrichedContext: `Signal received: "${raw.slice(0, 200)}". Category: ${categorise(raw)}. ICP signals found: ${icpSignals.length > 0 ? icpSignals.join(", ") : "none"}.`,
    agentId: "A"
  };
}
var ICP_SCORE_WEIGHTS = [
  { keywords: ["founder", "ceo", "cto", "co-founder"], weight: 0.3 },
  { keywords: ["saas", "b2b", "software"], weight: 0.25 },
  { keywords: ["seed", "series a", "early stage", "startup"], weight: 0.25 },
  { keywords: ["revenue", "mrr", "arr", "sales", "pipeline", "churn"], weight: 0.2 }
];
function agentB(brief) {
  const text = (brief.enrichedContext + " " + brief.icpSignals.join(" ")).toLowerCase();
  let score = 0;
  const reasons = [];
  for (const { keywords, weight } of ICP_SCORE_WEIGHTS) {
    const hit = keywords.find((k) => text.includes(k));
    if (hit) {
      score += weight;
      reasons.push(`+${weight.toFixed(2)}: matched "${hit}"`);
    }
  }
  const qualified = score >= 0.5;
  if (!qualified) reasons.push("Below 0.5 fit threshold \u2014 does not match Seed-stage B2B SaaS ICP");
  return {
    signalId: brief.signalId,
    brief,
    fitScore: Math.round(score * 100) / 100,
    qualified,
    qualificationReasons: reasons,
    agentId: "B"
  };
}
function agentC(lead) {
  const signals = lead.brief.icpSignals;
  const targetBuyer = signals.includes("founder") || signals.includes("ceo") ? "Founder / CEO" : signals.includes("cto") ? "CTO / Head of Product" : "Senior Decision-Maker";
  const painContext = signals.includes("churn") ? "High churn signal \u2014 likely experiencing retention problems." : signals.includes("pipeline") || signals.includes("sales") ? "Weak or uncertain pipeline \u2014 likely needs outbound leverage." : "General growth pressure at early stage.";
  return {
    signalId: lead.signalId,
    lead,
    enrichedNotes: `${painContext} Fit score: ${lead.fitScore}. ICP signals: ${signals.join(", ") || "general"}.`,
    targetBuyer,
    agentId: "C"
  };
}
function agentD(enriched) {
  const kpis = ["offer clarity", "price justification", "margin sustainability", "call to action"];
  const constraints = ["2-week delivery", "fixed scope", "no auto-send"];
  const positioning = enriched.lead.brief.category === "outbound-offer" ? "Direct outbound: short sprint, clear ROI, one-page offer" : "Consultative: problem-first framing, proof-of-concept offer";
  return {
    signalId: enriched.signalId,
    enrichedLead: enriched,
    icp: `Seed-stage B2B SaaS \u2014 buyer: ${enriched.targetBuyer}`,
    positioning,
    kpis,
    constraints,
    agentId: "D"
  };
}
var STUB_OFFER_TEMPLATE = (strategy, iteration) => {
  const edit = iteration > 1 ? " [Revised]" : "";
  return `Subject: 2-Week RevOps Sprint \u2014 Immediate Pipeline Impact${edit}

Hi [Name],

You're building in a space where pipeline velocity is everything. We've helped ${strategy.icp.split("\u2014")[0].trim()} founders add $50K\u2013$200K in pipeline within 14 days \u2014 without headcount.

Here's the sprint:${strategy.constraints.map((c) => `
\u2022 ${c}`).join("")}

Positioning: ${strategy.positioning}

The offer:
\u2022 Fixed-scope, 2-week engagement
\u2022 Pricing: \u20AC2,500\u2013\u20AC4,500 depending on scope
\u2022 Deliverables: One high-converting outbound sequence + offer teardown
\u2022 Guarantee: If we don't identify at least 3 qualified ICP contacts, you pay nothing for Week 2

${strategy.kpis.map((k) => `\u2713 ${k.charAt(0).toUpperCase() + k.slice(1)}`).join("\n")}

One question: Is your current offer landing with your ICP, or are you hearing "interesting but not now"?

[Operator to personalise before sending \u2014 auto-send is disabled]`;
};
function agentE(strategy, iteration = 1) {
  return {
    signalId: strategy.signalId,
    strategy,
    offerText: STUB_OFFER_TEMPLATE(strategy, iteration),
    iteration,
    agentId: "E"
  };
}
var EVAL_KPI_CHECKS = [
  { kpi: "offer clarity", check: (t) => t.includes("sprint") || t.includes("deliverable") || t.includes("scope") },
  { kpi: "price justification", check: (t) => /€[\d,]+|price|pricing|\$[\d,]+/.test(t) },
  { kpi: "margin sustainability", check: (t) => t.includes("fixed") || t.includes("scope") },
  { kpi: "call to action", check: (t) => t.includes("question") || t.includes("book") || t.includes("schedule") || t.includes("reply") || t.includes("landing") }
];
function agentF(draft) {
  const text = draft.offerText.toLowerCase();
  const failed = [];
  let passed = 0;
  for (const { kpi, check } of EVAL_KPI_CHECKS) {
    if (check(text)) {
      passed++;
    } else {
      failed.push(kpi);
    }
  }
  const score = Math.round(passed / EVAL_KPI_CHECKS.length * 100) / 100;
  return {
    signalId: draft.signalId,
    draft,
    score,
    passed: score >= 0.75,
    failureReasons: failed,
    agentId: "F"
  };
}
function agentG(scored) {
  const missing = scored.failureReasons;
  let revised = scored.draft.offerText;
  if (missing.includes("call to action")) {
    revised += "\n\nP.S. Reply with one word \u2014 'interested' \u2014 and I'll send the full sprint brief within 24h.";
  }
  if (missing.includes("price justification")) {
    revised = revised.replace(
      "The offer:",
      "The offer (investment justified by pipeline return \u2014 see ROI model below):"
    );
  }
  return {
    signalId: scored.signalId,
    strategy: scored.draft.strategy,
    offerText: revised,
    iteration: scored.draft.iteration + 1,
    agentId: "E"
  };
}
function agentH(scored, signalId) {
  const final = {
    signalId,
    offerText: scored.draft.offerText,
    score: scored.score,
    iterations: scored.draft.iteration,
    agentId: scored.draft.iteration > 1 ? "G" : "E"
  };
  const item = {
    // Random id, not a module counter — a counter resets on restart and
    // collides with approval items already persisted in the store.
    id: `ai-${randomUUID().slice(0, 8)}`,
    signalId,
    finalOffer: final,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    agentId: "H",
    sent: false
  };
  return { final, item };
}
function agentI(item) {
  return {
    id: `wi-${item.id}`,
    signalId: item.signalId,
    finalOffer: item.finalOffer,
    approvedAt: (/* @__PURE__ */ new Date()).toISOString(),
    qualityScore: item.finalOffer.score,
    agentId: "I",
    sent: false
  };
}

// packages/factory-core/src/pipeline.ts
import { randomUUID as randomUUID2 } from "node:crypto";
function evt(agentId, eventType, signalId, detail) {
  return {
    id: randomUUID2(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    agentId,
    eventType,
    signalId,
    detail
  };
}
async function runFactoryOnce(rawSignal, store2) {
  const validation = validateRegistry();
  if (!validation.ok) throw new Error(`Registry invalid: ${validation.errors.join("; ")}`);
  const signal = {
    id: `sig-${randomUUID2().slice(0, 8)}`,
    raw: rawSignal,
    submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "queued"
  };
  store2.addSignal(signal);
  const events = [];
  const log = (e) => {
    events.push(e);
    store2.addEvent(e);
  };
  store2.updateSignal(signal.id, { status: "processing" });
  const brief = agentA(signal);
  log(evt("A", "signal.intake_complete", signal.id, `category=${brief.category} icpSignals=${brief.icpSignals.length}`));
  const lead = agentB(brief);
  log(evt("B", lead.qualified ? "lead.qualified" : "lead.disqualified", signal.id, `fitScore=${lead.fitScore}`));
  if (!lead.qualified) {
    store2.addTrashItem({
      id: `trash-${randomUUID2().slice(0, 8)}`,
      signalId: signal.id,
      reason: `Disqualified by Agent B: ${lead.qualificationReasons.slice(-1)[0] ?? "below threshold"}`,
      trashedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    store2.updateSignal(signal.id, { status: "disqualified" });
    return { signal, brief, lead, status: "disqualified", events };
  }
  store2.addLead(lead);
  const enriched = agentC(lead);
  log(evt("C", "lead.enriched", signal.id, `buyer=${enriched.targetBuyer}`));
  const strategy = agentD(enriched);
  log(evt("D", "offer.strategy_set", signal.id, `positioning=${strategy.positioning.slice(0, 50)}`));
  const draft = agentE(strategy, 1);
  log(evt("E", "offer.drafted", signal.id, `iteration=1 length=${draft.offerText.length}`));
  let scored = agentF(draft);
  log(evt("F", scored.passed ? "offer.passed" : "offer.failed_eval", signal.id, `score=${scored.score}`));
  if (!scored.passed) {
    const revised = agentG(scored);
    log(evt("G", "offer.revised", signal.id, `iteration=${revised.iteration} failedKPIs=${scored.failureReasons.join(",")}`));
    const rescored = agentF(revised);
    log(evt("F", rescored.passed ? "offer.passed" : "offer.failed_after_edit", signal.id, `score=${rescored.score}`));
    if (!rescored.passed) {
      store2.addTrashItem({
        id: `trash-${randomUUID2().slice(0, 8)}`,
        signalId: signal.id,
        reason: `Offer failed evaluation after edit: ${rescored.failureReasons.join(", ")}`,
        trashedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      store2.updateSignal(signal.id, { status: "failed" });
      return { signal, brief, lead, enriched, strategy, draft, scored: rescored, status: "failed", events };
    }
    scored = rescored;
  }
  const { final, item } = agentH(scored, signal.id);
  store2.addApprovalItem(item);
  store2.updateSignal(signal.id, { status: "processed" });
  log(evt("H", "approval.required", signal.id, `approvalId=${item.id} score=${final.score}`));
  return { signal, brief, lead, enriched, strategy, draft, scored, final, approval: item, status: "awaiting_approval", events };
}
async function runOfferAcquisitionForSignal(rawSignal, store2) {
  return runFactoryOnce(rawSignal, store2);
}

// packages/factory-core/src/missions.ts
import { randomUUID as randomUUID4 } from "node:crypto";

// packages/factory-core/src/services.ts
var SERVICE_CATALOG = [
  {
    id: "svc-ai-workflow-audit",
    name: "AI Workflow Audit + Mini Demo",
    targetCustomer: "Small service businesses (5-50 people) drowning in manual lead/quote/follow-up work",
    promise: "In days, not months: a diagnosis of your messiest workflow plus a concrete mini demo of the AI-assisted version.",
    inputsRequired: ["Business description", "The workflow that hurts most", "Current tools (if any)", "Volume estimate (leads/quotes per week)"],
    expectedDeliverables: ["Problem summary", "Workflow diagnosis", "3 improvement opportunities", "Proposed mini demo", "Implementation plan", "Risks & safety notes"],
    defaultDepartment: "delivery",
    defaultTaskType: "workflow-audit",
    reviewSteps: ["Check diagnosis matches the client brief", "Verify the mini demo scope is deliverable", "Personalise the next client question"],
    safetyNotes: "Audit only \u2014 no system access, no data migration, no automation is switched on without a separate agreement."
  },
  {
    id: "svc-landing-audit",
    name: "Website / Landing Page Audit",
    targetCustomer: "Owners whose site gets traffic but not enquiries",
    promise: "A blunt, prioritised teardown of why visitors leave \u2014 and the quick wins that stop it.",
    inputsRequired: ["Site URL or page description", "Who the page should convert", "Primary conversion goal"],
    expectedDeliverables: ["First impression", "UX/friction issues", "Conversion issues", "AI opportunities", "Suggested sections", "Quick wins"],
    defaultDepartment: "marketing",
    defaultTaskType: "landing-audit",
    reviewSteps: ["Verify findings against the actual page", "Rank quick wins by effort/impact", "Remove any speculative claims"],
    safetyNotes: "Audit is based on operator-provided material only. No scraping, no logged-in access, no live edits."
  },
  {
    id: "svc-recruitment-ops-audit",
    name: "Recruitment / Agency Ops Workflow Audit",
    targetCustomer: "Recruitment and staffing agencies with candidate/client pipelines held together by spreadsheets",
    promise: "Map the candidate-to-placement pipeline, find the three biggest leaks, and propose the fix order.",
    inputsRequired: ["Agency size and niche", "Current pipeline stages", "Where placements are lost", "Tools in use"],
    expectedDeliverables: ["Pipeline map", "Leak diagnosis", "3 fixes ranked by impact", "Automation candidates", "Implementation plan", "Risks"],
    defaultDepartment: "research",
    defaultTaskType: "ops-audit",
    reviewSteps: ["Confirm pipeline stages with the client", "Sanity-check leak estimates", "Flag anything requiring candidate-data caution"],
    safetyNotes: "No candidate personal data enters the factory. Work is process-level only."
  },
  {
    id: "svc-client-dashboard",
    name: "Client Dashboard Concept",
    targetCustomer: "Service businesses that want one screen showing their pipeline, jobs, or client status",
    promise: "A concrete dashboard concept \u2014 components, data sources, and build order \u2014 ready for a build decision.",
    inputsRequired: ["What the owner needs to see daily", "Where the data lives today", "Who will use it"],
    expectedDeliverables: ["Dashboard goal", "Component plan", "Data source map", "Build order", "Effort estimate bands", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "dashboard-component-plan",
    reviewSteps: ["Check components map to stated daily questions", "Verify data sources exist", "Set expectation: concept, not build"],
    safetyNotes: "Concept only \u2014 no system integration and no data access in this service."
  },
  {
    id: "svc-social-pack",
    name: "Social Content / Carousel Pack",
    targetCustomer: "Founders who should be posting but never have material ready",
    promise: "A ready-to-personalise carousel pack: angle, slide-by-slide copy, caption, and hashtags.",
    inputsRequired: ["Topic or offer to promote", "Audience", "Tone (expert / friendly / provocative)"],
    expectedDeliverables: ["Post angle", "Carousel outline", "Slide-by-slide copy", "Caption", "Hashtags"],
    defaultDepartment: "marketing",
    defaultTaskType: "carousel-outline",
    reviewSteps: ["Personalise examples and numbers", "Check tone matches the client", "Operator publishes manually \u2014 never the factory"],
    safetyNotes: "The factory never publishes. The pack is copy for the operator/client to post themselves."
  },
  {
    id: "svc-automation-blueprint",
    name: "Process Automation Blueprint",
    targetCustomer: "Businesses with one repetitive process eating hours every week",
    promise: "A step-by-step blueprint for automating one named process, with tool choices and a safe rollout order.",
    inputsRequired: ["The process, step by step, as done today", "Weekly hours it consumes", "Tools already paid for"],
    expectedDeliverables: ["Process map", "Automation candidates", "Tool recommendation", "Rollout plan", "Human-in-the-loop points", "Risks"],
    defaultDepartment: "delivery",
    defaultTaskType: "automation-blueprint",
    reviewSteps: ["Verify every automated step keeps a human checkpoint where money or clients are touched", "Check tool costs are current"],
    safetyNotes: "Blueprint only. Nothing is connected or executed. Human approval points are mandatory in the design."
  }
];
function getServiceDefinition(id) {
  return SERVICE_CATALOG.find((s) => s.id === id);
}
function isValidServiceId(id) {
  return SERVICE_CATALOG.some((s) => s.id === id);
}
function extractFocus(text) {
  const m = text.toLowerCase().match(/(?:we|i)\s+(?:install|maintain|run|sell|build|provide|offer)\s+([^.,;]{3,60})/);
  return m?.[1]?.trim() ?? "your core service";
}
var langNote = (o) => o.language === "PL" ? "\n\n[Operator note: client language is PL \u2014 translate before delivery.]" : "";
var SECTIONS_BY_SERVICE = {
  "svc-ai-workflow-audit": [
    ["Problem Summary", (o) => `${o.clientName} \u2014 ${extractFocus(o.description)}. Stated pain: "${o.description.slice(0, 220)}". The core problem class: manual coordination work (leads, quotes, follow-ups) that scales with headcount instead of tooling.`],
    ["Workflow Diagnosis", (o) => `Current flow (reconstructed from brief \u2014 operator: confirm on the call):
1. Inbound lead arrives (phone/email/form) \u2192 captured manually or not at all
2. Quote prepared ad hoc \u2192 no standard template, no follow-up trigger
3. Follow-up depends on someone remembering \u2192 leads decay silently
4. Recurring work (${extractFocus(o.description)}) has no renewal/objection playbook
Bottleneck: steps 2\u20133. Every lost follow-up is a silent revenue leak.`],
    ["3 Improvement Opportunities", () => `1. Lead intake normalisation \u2014 one form/inbox route, auto-logged, nothing lost (effort: LOW, impact: HIGH)
2. Quote follow-up sequence \u2014 3-touch template triggered by "quote sent" (effort: LOW, impact: HIGH)
3. Objection playbook for renewals/maintenance plans \u2014 standard answers for the top 5 objections (effort: MEDIUM, impact: MEDIUM)`],
    ["Proposed Mini Demo", (o) => `A 1-screen demo for ${o.clientName}: paste an inbound enquiry \u2192 the assistant drafts (a) a qualification reply, (b) a quote checklist, (c) the day-3 follow-up. All drafts land in a review box \u2014 a human sends them. Nothing is sent automatically.`],
    ["Implementation Plan", () => `Week 1: intake route + quote template + follow-up sequence drafts
Week 2: objection playbook + mini demo walkthrough + handoff
Operator checkpoints: end of each week. No system goes live without sign-off.`],
    ["Risks & Safety Notes", () => `- No client data leaves the client's systems during the audit
- All AI drafts are review-gated; a human sends every message
- If current volume is under ~10 leads/week, automation ROI is marginal \u2014 say so honestly`],
    ["Next Client Question", (o) => `"Walk me through the last quote you lost \u2014 where exactly did the follow-up stop?"${langNote(o)}`]
  ],
  "svc-landing-audit": [
    ["First Impression", (o) => `Based on the brief for ${o.clientName}: "${o.description.slice(0, 180)}". First-5-seconds test: can a visitor tell WHO this is for, WHAT they get, and WHY trust it? Operator: verify against the live page before delivery.`],
    ["UX / Friction Issues", () => `Checklist applied:
- Above-the-fold headline: outcome-led or feature-led?
- Primary CTA visible without scrolling?
- Mobile: tap targets, load weight, form length
- Navigation: does it leak visitors away from the conversion path?`],
    ["Conversion Issues", () => `- One page, one goal: count the competing CTAs
- Proof: real testimonials/numbers vs decorative logos
- Risk reversal: guarantee, free step, or nothing?
- Form friction: every extra field costs conversions`],
    ["AI Opportunities", () => `- Instant-answer widget for the top 5 pre-sale questions (review-gated content)
- Personalised headline variants per traffic source
- Enquiry summarisation so the owner answers in one minute`],
    ["Suggested Sections", () => `1. Outcome headline + subline
2. Pain mirror (3 bullets in the visitor's words)
3. Offer with concrete scope
4. Proof
5. Simple 3-step "how it works"
6. Risk reversal + single CTA`],
    ["Quick Wins", (o) => `Ranked by effort/impact for ${o.clientName}:
1. Rewrite headline to outcome (1h)
2. Cut form to 3 fields (1h)
3. Move one real proof element above the fold (2h)${langNote(o)}`]
  ],
  "svc-recruitment-ops-audit": [
    ["Pipeline Map", (o) => `Reconstructed for ${o.clientName} from brief: sourcing \u2192 screening \u2192 client submission \u2192 interview loop \u2192 offer \u2192 placement \u2192 aftercare. Brief: "${o.description.slice(0, 180)}". Operator: confirm stage names with the client.`],
    ["Leak Diagnosis", () => `Typical leak points to verify:
1. Screening\u2192submission lag (candidates go cold in 48h)
2. No structured client feedback loop after submission
3. Aftercare ignored \u2192 refunds/replacements eat margin`],
    ["3 Fixes Ranked by Impact", () => `1. 24h submission SLA with a daily "aging candidates" list (HIGH)
2. Feedback template sent with every submission (MEDIUM)
3. Day-7/30/80 aftercare check-ins, templated (MEDIUM)`],
    ["Automation Candidates", () => `- Aging-pipeline digest (internal report, no external send)
- Interview scheduling links
- Aftercare reminder drafts \u2014 human sends every one`],
    ["Implementation Plan", () => `Week 1: pipeline stages + SLA report. Week 2: templates + reminders. Candidate personal data stays in the agency's ATS \u2014 the factory works at process level only.`],
    ["Risks", (o) => `- GDPR: no candidate data enters this system
- SLA pressure can hurt quality \u2014 pair with a screening checklist${langNote(o)}`]
  ],
  "svc-client-dashboard": [
    ["Dashboard Goal", (o) => `${o.clientName} needs one screen answering the owner's daily questions. Brief: "${o.description.slice(0, 180)}".`],
    ["Component Plan", () => `1. Pipeline funnel (counts + conversion per stage)
2. This-week jobs/deadlines list
3. Money row: quoted / won / invoiced / overdue
4. Alerts: items stuck > N days
5. Activity log (latest 20 events)`],
    ["Data Source Map", () => `Per component: where the data lives today (spreadsheet / inbox / tool), who updates it, and the single source of truth chosen for v1. Operator fills specifics after the discovery call.`],
    ["Build Order", () => `v1: pipeline funnel + stuck alerts (highest decision value)
v2: money row
v3: activity log + weekly digest`],
    ["Effort Estimate Bands", () => `v1: days, not weeks, if data source is one spreadsheet. Integration with a real CRM moves it to weeks. Bands, not promises \u2014 refine after discovery.`],
    ["Risks", (o) => `- Garbage-in: dashboard is only as honest as the source data
- Concept only: nothing is connected in this service${langNote(o)}`]
  ],
  "svc-social-pack": [
    ["Post Angle", (o) => `For ${o.clientName}: "${o.description.slice(0, 160)}". Angle: the specific, unglamorous mistake the audience makes daily \u2014 named plainly, then fixed.`],
    ["Carousel Outline", () => `S1 Hook (the mistake, in the audience's words)
S2 Why it keeps happening
S3-5 The fix in 3 concrete steps
S6 Proof or example
S7 CTA: one small action today`],
    ["Slide-by-Slide Copy", (o) => `S1: "You're losing ${extractFocus(o.description)} money in a place you never look."
S2: "Not because you're lazy \u2014 because nobody owns the follow-up."
S3: "Step 1: write down where the last 5 deals died."
S4: "Step 2: one template for the day-3 follow-up."
S5: "Step 3: one owner, one daily 10-minute review."
S6: "[Operator: insert client's real number/example here]"
S7: "Do step 1 today. It takes 15 minutes."`],
    ["Caption", () => `Most businesses don't have a leads problem \u2014 they have a follow-up problem. 3 steps that cost nothing, in the carousel. Which step is missing in your business?`],
    ["Hashtags", (o) => `#smallbusiness #workflow #followup #sales [operator: add 3 niche tags]${langNote(o)}

[SAFETY: the factory never posts. This pack is copy for manual publishing.]`]
  ],
  "svc-automation-blueprint": [
    ["Process Map", (o) => `Process as described by ${o.clientName}: "${o.description.slice(0, 220)}". Operator: number the steps with the client and mark who touches each one.`],
    ["Automation Candidates", () => `For each step: AUTOMATE (mechanical, no judgment) / ASSIST (AI drafts, human decides) / KEEP HUMAN (money, clients, exceptions). Default to ASSIST wherever a client can see the output.`],
    ["Tool Recommendation", () => `Prefer tools already paid for. Otherwise: one workflow tool + one AI-drafting step + one review inbox. Name concrete tools only after confirming current stack \u2014 no hidden subscriptions.`],
    ["Rollout Plan", () => `Phase 1: shadow mode \u2014 automation drafts, human does the work as before, compare
Phase 2: assist mode \u2014 human approves each output
Phase 3: automate only the steps that survived 2 weeks of review with zero corrections`],
    ["Human-in-the-Loop Points", () => `Mandatory checkpoints: anything sent to a client, anything touching money, anything irreversible. These are design constraints, not suggestions.`],
    ["Risks", (o) => `- Automating a broken process makes it break faster \u2014 fix the process first
- Key-person risk: document the workflow so it survives staff changes${langNote(o)}`]
  ]
};
function buildServiceContent(service, order, constraints = []) {
  const sections = SECTIONS_BY_SERVICE[service.id];
  if (!sections) throw new Error(`No content builder for service ${service.id}`);
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const header = constraints.length > 0 ? `PRODUCTION CONSTRAINTS (operator/client input):
${constraints.map((c) => `\u2022 ${c}`).join("\n")}

` : "";
  const body = header + sections.map(([h, fn]) => `\u2501\u2501 ${h} \u2501\u2501

${fn(order)}`).join("\n\n");
  const packDraft = `\u2501\u2501 Delivery Pack Draft \u2501\u2501

Client: ${order.clientName}
Service: ${service.name}
Date: ${date}
Promise: ${service.promise}
Deliverables covered: ${service.expectedDeliverables.join("; ")}
Review before delivery: ${service.reviewSteps.join(" \u2192 ")}
Safety: ${service.safetyNotes}`;
  return {
    title: `${service.name} \u2014 ${order.clientName} \u2014 ${date}`,
    content: `SERVICE: ${service.name}
CLIENT: ${order.clientName}
URGENCY: ${order.urgency ?? "normal"} \xB7 LANGUAGE: ${order.language ?? "EN"}

${body}

${packDraft}`
  };
}

// packages/factory-core/src/integrity.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// packages/integrity-guard/src/drift-sensor.ts
function mean(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function stdDev(values) {
  const m = mean(values);
  return Math.sqrt(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length);
}
var DriftSensor = class {
  baselineMean;
  baselineStd;
  constructor(baselineData) {
    if (baselineData.length === 0) {
      throw new Error("DriftSensor requires a non-empty baseline");
    }
    this.baselineMean = mean(baselineData);
    const std = stdDev(baselineData);
    this.baselineStd = std === 0 ? 1 : std;
  }
  /** Z-score of the current window against the baseline. 0 for an empty window. */
  calculateDrift(currentData) {
    if (currentData.length === 0) return 0;
    return Math.abs(mean(currentData) - this.baselineMean) / this.baselineStd;
  }
};

// packages/integrity-guard/src/pinocchio-nose.ts
var clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
var PinocchioNose = class {
  #noseLength;
  criticalLimit;
  constructor(opts = {}) {
    this.criticalLimit = Math.max(1, Math.min(100, opts.criticalLimit ?? 80));
    this.#noseLength = clamp(opts.initialLength ?? 0);
  }
  get noseLength() {
    return this.#noseLength;
  }
  /** Spec mode: nose = min(100, round(drift × 20)). Returns true when breached. */
  setFromDrift(driftScore) {
    this.#noseLength = clamp(driftScore * 20);
    return this.isBreached();
  }
  /** Cumulative mode: add centimeters. Returns true when breached. */
  grow(cm) {
    this.#noseLength = clamp(this.#noseLength + Math.abs(cm));
    return this.isBreached();
  }
  /** Truth heals: shrink the nose (never below 0). */
  shrink(cm) {
    this.#noseLength = clamp(this.#noseLength - Math.abs(cm));
  }
  isBreached() {
    return this.#noseLength >= this.criticalLimit;
  }
};

// packages/integrity-guard/src/hrar-protocol.ts
var HRARProtocol = class {
  #cleanup;
  #exitProcess;
  constructor(opts = {}) {
    if (opts.cleanup) this.#cleanup = opts.cleanup;
    this.#exitProcess = opts.exitProcess ?? false;
  }
  async execute(finalNoseLength) {
    const report = {
      executedAt: (/* @__PURE__ */ new Date()).toISOString(),
      finalNoseLength,
      cleanupRan: false,
      processExitRequested: this.#exitProcess
    };
    if (this.#cleanup) {
      try {
        await this.#cleanup();
        report.cleanupRan = true;
      } catch (err) {
        report.cleanupError = err instanceof Error ? err.message : String(err);
      }
    }
    if (this.#exitProcess) {
      process.exit(1);
    }
    return report;
  }
};

// packages/factory-core/src/integrity.ts
var INTEGRITY_LIMITS = {
  critical: 80,
  // nose ≥ 80 → HRAR (quarantine)
  watch: 40,
  // nose ≥ 40 → watch status
  growRejected: 25,
  growRework: 12,
  growQualityCap: 15,
  shrinkAccepted: 10
};
var QUALITY_BASELINE = [0.8, 0.85, 0.9, 0.85, 0.8];
var qualitySensor = new DriftSensor(QUALITY_BASELINE);
var PRODUCER_AGENTS = ["MA", "SA", "DA", "RA", "QAA"];
var INTEGRITY_RESET_REASONS = [
  "false_positive",
  "retrained",
  "accepted_risk",
  "operator_override",
  "other"
];
function isValidResetReason(value) {
  return INTEGRITY_RESET_REASONS.includes(value);
}
function freshRecord(agentId) {
  return { agentId, noseLength: 0, status: "healthy", breaches: 0, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
}
function getIntegrityRecords(store2) {
  return PRODUCER_AGENTS.map((id) => store2.getIntegrityRecord(id) ?? freshRecord(id));
}
function isAgentQuarantined(store2, agentId) {
  return store2.getIntegrityRecord(agentId)?.status === "quarantined";
}
function statusFor(nose, wasQuarantined) {
  if (wasQuarantined) return "quarantined";
  if (nose.isBreached()) return "quarantined";
  if (nose.noseLength >= INTEGRITY_LIMITS.watch) return "watch";
  return "healthy";
}
async function applyDelta(store2, agentId, deltaCm, signal) {
  const prev = store2.getIntegrityRecord(agentId) ?? freshRecord(agentId);
  const nose = new PinocchioNose({
    criticalLimit: INTEGRITY_LIMITS.critical,
    initialLength: prev.noseLength
  });
  if (deltaCm >= 0) nose.grow(deltaCm);
  else nose.shrink(-deltaCm);
  const wasQuarantined = prev.status === "quarantined";
  const breachedNow = !wasQuarantined && nose.isBreached();
  const next = {
    agentId,
    noseLength: nose.noseLength,
    status: statusFor(nose, wasQuarantined),
    breaches: prev.breaches + (breachedNow ? 1 : 0),
    lastSignal: signal,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  store2.upsertIntegrityRecord(next);
  if (breachedNow) {
    const protocol = new HRARProtocol({
      cleanup: () => {
        store2.addEvent({
          id: randomUUID3(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId,
          eventType: "integrity.quarantine",
          detail: `HRAR: nose ${nose.noseLength}cm \u2265 ${INTEGRITY_LIMITS.critical} \u2014 ${agentId} quarantined from client production (training still allowed). Cause: ${signal}. Operator reset (with reason) required.`
        });
      },
      exitProcess: false
    });
    await protocol.execute(nose.noseLength);
  }
  return next;
}
async function recordOperatorIntegritySignal(store2, agentId, action, itemId) {
  const delta = action === "rejected" ? INTEGRITY_LIMITS.growRejected : action === "needs_rework" ? INTEGRITY_LIMITS.growRework : -INTEGRITY_LIMITS.shrinkAccepted;
  return applyDelta(store2, agentId, delta, `operator ${action} on ${itemId}`);
}
async function recordQualityIntegritySignal(store2, agentId, qualityScore, itemId) {
  if (qualityScore >= qualitySensor.baselineMean) return void 0;
  const drift = qualitySensor.calculateDrift([qualityScore]);
  const grow = Math.min(INTEGRITY_LIMITS.growQualityCap, Math.round(drift * 2));
  if (grow <= 0) return void 0;
  return applyDelta(store2, agentId, grow, `quality ${qualityScore} below baseline on ${itemId} (drift ${drift.toFixed(1)})`);
}
function resetAgentIntegrity(store2, agentId, reason, note) {
  const prev = store2.getIntegrityRecord(agentId);
  if (!prev || prev.noseLength === 0 && prev.status === "healthy") return void 0;
  const previousNose = prev.noseLength;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const next = {
    agentId,
    noseLength: 0,
    status: "healthy",
    breaches: prev.breaches,
    // breach history is never erased by a reset
    lastSignal: `operator reset (${reason})`,
    updatedAt: now
  };
  store2.upsertIntegrityRecord(next);
  store2.addEvent({
    id: randomUUID3(),
    timestamp: now,
    agentId,
    eventType: "integrity.reset",
    detail: `Operator reset ${agentId} integrity (was ${prev.status}, nose ${previousNose}cm \u2192 0cm). Reason: ${reason}.${note ? ` Note: ${note}.` : ""} Breach history preserved (${prev.breaches} total). Client production re-enabled. Reset by: operator (God Layer).`
  });
  return next;
}

// packages/factory-core/src/missions.ts
var ICP = "Seed-stage B2B SaaS founders (10\u201350 employees)";
var PRODUCT = "Fractional RevOps sprint \u2014 2 weeks, fixed scope, \u20AC2,500\u2013\u20AC4,500";
var TASK_TYPES = {
  marketing: ["ad-pack", "hook-set", "carousel-outline", "landing-section", "campaign-angle"],
  sales: ["pitch-pack", "objection-map", "follow-up-script", "qualification-questions", "offer-draft-template"],
  delivery: ["demo-block", "onboarding-checklist", "landing-template", "dashboard-component-plan", "repo-task-draft"],
  research: ["lead-source-list", "niche-research", "keyword-set", "opportunity-map", "audience-list"],
  qa: ["qa-report", "cleanup-report", "agent-improvement-report", "weak-asset-review", "next-day-plan"]
};
var DEPT_AGENT = {
  marketing: "MA",
  sales: "SA",
  delivery: "DA",
  research: "RA",
  qa: "QAA"
};
var SAAS_NICHES = [
  "HR tech for small teams",
  "Vertical SaaS for professional services",
  "Sales automation for B2B SMBs",
  "Analytics for e-commerce founders",
  "Project management for agencies",
  "Billing and subscription management",
  "Compliance tech for regulated industries",
  "Customer success platforms",
  "Pricing and packaging optimisation",
  "Revenue intelligence and forecasting"
];
function dayOfYear(date) {
  const d = new Date(date);
  return Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
}
function selectTaskType(dept) {
  const list = TASK_TYPES[dept];
  return list[Math.floor(Math.random() * list.length)];
}
function constraintHeader(constraints) {
  if (constraints.length === 0) return "";
  return `PRODUCTION CONSTRAINTS (operator/client input):
${constraints.map((c) => `\u2022 ${c}`).join("\n")}

`;
}
function extractNicheFocus(constraints) {
  const text = constraints.join(" ").toLowerCase();
  const m = text.match(/for\s+([a-z][a-z\s]+?)(?:\s+companies|\s+firms|\s+businesses|\s+founders|[.,]|$)/);
  return m?.[1]?.trim() ?? "";
}
function scoreContent(content, constraints) {
  let s = 0;
  if (content.length > 800) s += 0.3;
  else if (content.length > 400) s += 0.2;
  else if (content.length > 150) s += 0.1;
  if (content.includes("\n\n")) s += 0.1;
  if (/[0-9]/.test(content)) s += 0.1;
  if (content.split("\n").some((l) => /^[-•*]/.test(l.trim()))) s += 0.1;
  if (/€[\d,]+|\$[\d,]+/.test(content)) s += 0.1;
  if (/\d+%|\d+[\s-](day|week|hour|minute)/.test(content)) s += 0.1;
  if (constraints.length === 0) {
    s += 0.2;
  } else {
    const lower = content.toLowerCase();
    const hit = constraints.filter((c) => c.split(/\s+/).some((w) => w.length > 4 && lower.includes(w.toLowerCase())));
    s += hit.length / constraints.length * 0.2;
  }
  return Math.min(Math.round(s * 100) / 100, 1);
}
function marketing(taskType, date, constraints) {
  const niche = extractNicheFocus(constraints) || "seed-stage SaaS";
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "hook-set":
      return {
        title: `Hook Set \u2014 ${date} \u2014 Outbound + LinkedIn`,
        content: ch + `HOOK SET \u2014 10 Angles for ${ICP}
Product: ${PRODUCT}

A/B Test Group 1 \u2014 Pain-first:
\u2022 "Your pipeline is a leaky bucket. Here's the 2-week fix."
\u2022 "At $30K MRR, your pipeline isn't failing. Your offer is."
\u2022 "Most ${niche} founders have the same problem: weak pipeline, wrong offer."

A/B Test Group 2 \u2014 Specificity:
\u2022 "How we added $50K pipeline for a founder just like you \u2014 in 14 days."
\u2022 "3 qualified calls in 2 weeks. No SDR. No ad spend. Fixed scope."
\u2022 "\u20AC2,500 sprint \u2192 3\u20135 intro meetings. Here's the breakdown."

A/B Test Group 3 \u2014 Curiosity:
\u2022 "One question that diagnoses your whole outbound problem."
\u2022 "Skip the SDR hire. This sprint does the same job for 1/10th the cost."
\u2022 "Your ICP reads your offer in 4 seconds. What do they feel?"
\u2022 "We had a founder triple her booked calls in 14 days. She changed one thing."

Usage notes:
- Test 1 hook per channel per week
- LinkedIn: use Group 2 (specificity wins in feed)
- Cold email subject: Group 3 (curiosity drives opens)
- Never use all 3 groups at once \u2014 isolate variables
- Operator: replace [placeholder numbers] with real case data when available`
      };
    case "carousel-outline":
      return {
        title: `LinkedIn Carousel \u2014 ${date} \u2014 Pipeline Sprint`,
        content: ch + `LINKEDIN CAROUSEL \u2014 6 Frames
Topic: "Why Your Pipeline Stalls at $30K MRR (and One Sprint That Fixes It)"
Target: ${ICP}

Frame 1 \u2014 Hook (must stop the scroll):
Headline: "Your pipeline didn't die. Your offer did."
Visual: Bold text, dark background. No stock photos.
CTA: "Swipe to see the exact problem \u2192"

Frame 2 \u2014 Problem (be specific):
Headline: "At seed stage, founders make 3 outbound mistakes:"
Body:
\u2022 Generic ICP: "B2B companies with 10\u2013100 employees" (too wide)
\u2022 Weak offer: features, not outcomes
\u2022 Wrong channel: LinkedIn DMs without warm intent
Visual: 3-item list, numbered

Frame 3 \u2014 Agitation (make it real):
Headline: "Result: you're getting replies but no meetings."
Body: "Or worse \u2014 silence. Your product is working. Your offer isn't landing."
Visual: Silence emoji / unread DM mockup concept

Frame 4 \u2014 Solution (concrete, not fluffy):
Headline: "A 2-week RevOps sprint rebuilds the offer and the outreach."
Body:
\u2022 Week 1: ICP audit + one high-converting offer
\u2022 Week 2: Test with real prospects + book 3\u20135 calls
\u2022 Fixed scope. Fixed price. One decision.

Frame 5 \u2014 Proof placeholder:
Headline: "[Operator: insert one founder result here]"
Body: "'We booked X calls in Y days.' \u2014 Name, Company"
Note: Leave blank until real case study is ready. Do not fabricate.

Frame 6 \u2014 CTA:
Headline: "One question: Is your current offer landing?"
Body: "DM me the word 'offer' and I'll tell you exactly what's wrong \u2014 in 24h."
Visual: Clean, single CTA button concept`
      };
    case "landing-section":
      return {
        title: `Landing Section \u2014 ${date} \u2014 Hero + Benefits`,
        content: ch + `LANDING PAGE \u2014 Above the Fold + Benefit Section
Product: ${PRODUCT}
ICP: ${ICP}

\u2501\u2501 HERO SECTION \u2501\u2501

H1: "Turn Your Pipeline From Leaky to Loaded \u2014 in 14 Days"
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer, tests it with your exact ICP, and books 3\u20135 qualified intro meetings. \u20AC2,500\u2013\u20AC4,500. No retainer."

Primary CTA: "Book Your Pipeline Audit (Free, 20 min)"
Secondary CTA: "See how it works \u2192"

Trust element: "Used by ${niche} founders at seed and pre-Series A"

\u2501\u2501 BENEFIT SECTION \u2501\u2501

What you get in 14 days:

1. ICP Audit
   Before we write a single word, we diagnose why your current outreach isn't landing.
   You get a written teardown with 3 concrete fixes.

2. One High-Converting Offer
   Not a deck. Not a brochure. One sharp, outcome-led offer your ICP actually reads.
   Built around their language, their pain, their buying trigger.

3. 3\u20135 Qualified Intro Meetings
   We test the offer with real prospects in your ICP. You get meetings booked.
   If we don't hit 3, Week 2 is free.

\u2501\u2501 PRICING BLOCK \u2501\u2501

Fixed Sprint: \u20AC2,500\u2013\u20AC4,500
- Week 1: Audit + offer build (\u20AC1,500\u2013\u20AC2,000)
- Week 2: Test + booking (\u20AC1,000\u2013\u20AC2,500)
- Add-on: Full outbound sequence (+\u20AC750)
- Add-on: LinkedIn content pack (+\u20AC500)

Guarantee: 3 qualified meetings or Week 2 free.

Note: Operator must approve all copy before publishing. Do not publish without review.`
      };
    case "campaign-angle":
      return {
        title: `Campaign Angle \u2014 ${date} \u2014 Q3 Positioning`,
        content: ch + `CAMPAIGN ANGLE \u2014 Strategic Concept
Quarter: Q3 / Audience: ${niche}
Product: ${PRODUCT}

ANGLE: "The Founder's Tipping Point"

Insight: Seed-stage founders hit a critical moment at $20K\u2013$40K MRR. They've proven the product works, but they can't scale pipeline without changing how they sell. This is the tipping point \u2014 and the window for a sprint offer.

Narrative arc:
1. Recognition: "You're not stuck. You're at the tipping point."
2. Tension: "At this stage, the old playbook (founder selling everything manually) stops scaling."
3. Solution: "One sprint resets your outbound. You don't need more volume. You need a better offer."
4. Proof: [operator inserts real case study]
5. Action: Book a 20-min audit

Channel plan:
\u2022 LinkedIn organic: 3 posts/week, founder-voice, story-driven
\u2022 Cold email: 30\u201350 new contacts/week, offer-led subject lines
\u2022 Retargeting: 30-day cookie, short copy, \u20AC15/day budget
\u2022 Referral: ask 3 existing clients for one intro

KPIs to track:
- Hook engagement rate (target > 3% on LinkedIn)
- Email open rate (target > 35%)
- Audit booking rate from landing page (target > 4%)
- Cost per booked call (target < \u20AC200)

Review this angle in 30 days. Adjust based on which channel converts.`
      };
    default:
      return {
        title: `Ad Pack \u2014 ${date} \u2014 Multi-Channel`,
        content: ch + `AD PACK \u2014 Multi-Channel
Target: ${ICP} / Niche focus: ${niche}
Product: ${PRODUCT}

\u2501\u2501 LINKEDIN SPONSORED \u2501\u2501

Headline: "14-Day Pipeline Sprint \u2014 Fixed Scope, Guaranteed Audit"
Body (150 chars): "SaaS founders: stop guessing why outreach fails. We audit your ICP + build one high-converting offer in 14 days. \u20AC2,500\u2013\u20AC4,500. 3 meetings or Week 2 is free."
CTA button: "Book Audit"
Targeting: Job title = Founder/CEO/Co-founder | Company size: 10\u201350 | Industry: Software/SaaS

\u2501\u2501 COLD EMAIL SUBJECT LINES (A/B) \u2501\u2501

A: "Your pipeline (quick question)"
B: "14 days to 3 qualified calls \u2014 founders only"
C: "Why your outreach isn't landing [and what fixes it]"

\u2501\u2501 RETARGETING SHORT COPY \u2501\u2501

"Still thinking about the pipeline sprint? Scope is limited to 3 founders per month. One spot left for ${new Date(date).toLocaleString("en", { month: "long" })}."

\u2501\u2501 FACEBOOK/INSTAGRAM (if tested) \u2501\u2501

Headline: "SaaS founder? Your offer might be the problem."
Body: "We've helped founders at $20K\u2013$50K MRR book 3\u20135 qualified calls in 14 days \u2014 without hiring an SDR. Fixed-scope sprint. Fixed price."
CTA: Learn More \u2192 [landing page]

\u2501\u2501 BUDGET GUIDANCE \u2501\u2501

LinkedIn: \u20AC20\u2013\u20AC40/day | CPL target: < \u20AC150
Retargeting: \u20AC15/day | CPL target: < \u20AC80
Cold email: No direct cost \u2014 tool cost only
Total monthly: \u20AC1,050\u2013\u20AC1,650 + operator time

Operator: All copy must be personalised before publishing. Budgets are estimates only.`
      };
  }
}
function sales(taskType, date, constraints) {
  const niche = extractNicheFocus(constraints) || "SaaS";
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "objection-map":
      return {
        title: `Objection Map \u2014 ${date} \u2014 RevOps Sprint`,
        content: ch + `OBJECTION MAP \u2014 8 Common Objections + Responses
Product: ${PRODUCT}

1. "Too expensive for where we are."
   Root cause: Price/value mismatch or wrong ICP
   Response: "What's one booked call worth to your business right now? If it's > \u20AC500, the math works. And we have a Week-2-free guarantee if we don't hit 3 calls."
   Escalation: Offer a paid 90-min ICP audit (\u20AC350) as a low-risk entry.

2. "We already have an SDR."
   Root cause: Perceived overlap
   Response: "Great. Is your SDR hitting quota consistently? This sprint isn't headcount \u2014 it's the offer your SDR sends. We make their work convert, not replace them."

3. "I need to think about it."
   Root cause: No urgency / no clarity
   Response: "Totally fair. What's the one thing you'd need to see to make this a yes?"
   Then: close on a specific next step, not just "follow up."

4. "We don't have the bandwidth right now."
   Root cause: Perceived complexity
   Response: "The sprint requires 2 hours of your time in Week 1 for the ICP interview. After that, we handle everything. Your job is to approve or reject what we produce."

5. "We'll do this ourselves."
   Root cause: Trust gap or cost sensitivity
   Response: "Absolutely. Most founders do \u2014 and it takes 3\u20134 months. If you want to move faster, this sprint compresses that into 14 days."

6. "Can you do it for less?"
   Root cause: Budget constraint or anchoring
   Response: "The fixed price reflects a fixed scope. If you reduce the scope, we reduce the price. What would you cut: the offer build or the testing week?"

7. "I don't have a list / contacts to test with."
   Root cause: Prospect doesn't understand the service
   Response: "That's exactly what we solve. We build the ICP list as part of Week 1. You don't need contacts before we start."

8. "How do I know this will work for ${niche}?"
   Root cause: Niche specificity concern
   Response: "The offer framework works across B2B verticals. We tailor the language to your ICP in Week 1. [Operator: add niche-specific case study here when available.]"`
      };
    case "follow-up-script":
      return {
        title: `Follow-Up Script \u2014 ${date} \u2014 3-Touch Sequence`,
        content: ch + `FOLLOW-UP SEQUENCE \u2014 3 Touches After First Contact
Context: Prospect expressed interest but hasn't booked / hasn't replied

\u2501\u2501 TOUCH 1 \u2014 Day 1\u20132 After First Contact \u2501\u2501

Subject: "Quick follow-up \u2014 pipeline sprint"
Body:
"Hi [Name],

Following up on my note about the RevOps sprint for ${niche} founders.

One question: is your current outreach producing qualified meetings, or are you getting polite replies that don't convert?

If it's the latter \u2014 that's fixable in 14 days. Happy to walk you through how.

[CTA: 10-min call this week?]"

\u2501\u2501 TOUCH 2 \u2014 Day 3\u20134 \u2501\u2501

Subject: "[Resource] Why offers fail at seed stage"
Body:
"Hi [Name],

Sharing something that's come up a lot with ${niche} founders I work with:

The offer isn't the problem. The framing is.

[Brief insight \u2014 2 sentences max. Make it specific to their situation if possible.]

Still happy to do the 20-min pipeline audit \u2014 no commitment. Want to grab 15 min this week?"

\u2501\u2501 TOUCH 3 \u2014 Day 7 (Breakup) \u2501\u2501

Subject: "Closing the loop"
Body:
"Hi [Name],

I don't want to keep your inbox busy if the timing isn't right.

If pipeline is something you're actively working on in the next 30 days, I'm here. If not, I'll reach back out next quarter.

Either way \u2014 good luck with the sprint."

Notes for operator:
- Never send Touch 3 without personalising
- If they reply at any point, switch to conversation mode immediately
- Track reply rate by touch; cut whichever touch underperforms`
      };
    case "qualification-questions":
      return {
        title: `Qualification Questions \u2014 ${date} \u2014 BANT + Pain`,
        content: ch + `QUALIFICATION FRAMEWORK \u2014 10 Questions
Context: First 20-min discovery call with ${niche} founder

\u2501\u2501 COMPANY CONTEXT (2 min) \u2501\u2501

1. "Walk me through where you are in the business \u2014 revenue, team size, how long you've been selling."
   \u2192 Listen for: $15K\u2013$60K MRR, 5\u201320 person team, 6\u201324 months post-launch

2. "Who's running outbound right now \u2014 you, a co-founder, someone you hired?"
   \u2192 Listen for: founder-led or early first hire (not a built-out SDR team)

\u2501\u2501 PAIN IDENTIFICATION (8 min) \u2501\u2501

3. "What's the pipeline situation looking like? Are you getting enough qualified conversations?"
   \u2192 Listen for: inconsistency, low conversion, reliance on warm network

4. "When you reach out to a prospect today, what does your offer look like?"
   \u2192 Listen for: generic pitch, feature-led copy, no clear outcome statement

5. "How long does it typically take from first contact to a booked call?"
   \u2192 Listen for: > 2 weeks = offer/outreach problem; no answer = no system

6. "What have you tried to fix this already?"
   \u2192 Listen for: ad spend, SDR hire, content \u2014 shows sophistication level

7. "What happens if pipeline stays at this level for another 90 days?"
   \u2192 Listen for: real urgency vs nice-to-have

\u2501\u2501 AUTHORITY + TIMING (5 min) \u2501\u2501

8. "If we ran the sprint and you loved the result, who else would need to sign off on continuing to work together?"
   \u2192 Listen for: solo decision or investor/board veto

9. "What does your timeline look like? When would you want to start seeing results?"
   \u2192 Listen for: within 30 days = high intent; "eventually" = nurture sequence

10. "What would make this a clear yes for you?"
    \u2192 Unblocks the real objection if they haven't stated it

Notes: Score each answer 1\u20133. Total \u2265 22 = strong qualified lead. Total < 15 = nurture.`
      };
    case "offer-draft-template":
      return {
        title: `Offer Draft Template \u2014 ${date} \u2014 Fill-In Version`,
        content: ch + `OFFER DRAFT TEMPLATE \u2014 Fractional RevOps Sprint
Operator: fill in [brackets], remove instruction notes before sending

\u2501\u2501 SUBJECT \u2501\u2501
"[Outcome in 8 words or fewer] \u2014 [timeframe]"
Example: "3 qualified calls in 14 days \u2014 [Niche] founders"

\u2501\u2501 OPENING (1\u20132 sentences) \u2501\u2501
"[Name], [observation about their specific situation based on research].
I work with ${niche} founders who [shared pain point] \u2014 and there's a specific fix that works in 2 weeks."

\u2501\u2501 OFFER BLOCK \u2501\u2501
Here's what I'm proposing:

\u2022 Week 1: ICP audit + one high-converting offer built for your exact buyer
\u2022 Week 2: Test with [X] prospects from your ICP + [Y] booked intro calls

Investment: \u20AC[amount] fixed. No retainer. No bloat.
[Add: guarantee statement if applicable]

\u2501\u2501 SOCIAL PROOF \u2501\u2501
"[Case study or founder quote \u2014 operator must provide. Do not fabricate.]"

\u2501\u2501 CTA \u2501\u2501
"One question: [specific question relevant to their situation]?
If yes \u2014 [clear next step, e.g., 'I have 15 min on Thursday at 2pm CET']."

\u2501\u2501 P.S. \u2501\u2501
"[Relevant detail that shows you did research on them \u2014 company news, a post they wrote, a product update.]"

\u2501\u2501 SCORING CHECKLIST \u2501\u2501
Before sending, confirm:
\u25A1 ICP match: Yes / No
\u25A1 Real pain stated (not assumed): Yes / No
\u25A1 Specific outcome promised: Yes / No
\u25A1 Price clear: Yes / No
\u25A1 CTA has one specific action: Yes / No
\u25A1 P.S. is personalised: Yes / No

Only send if all 6 are checked.`
      };
    default:
      return {
        title: `Pitch Pack \u2014 ${date} \u2014 Executive Summary`,
        content: ch + `PITCH PACK \u2014 Executive Summary Deck
Audience: ${ICP} / Niche: ${niche}
Product: ${PRODUCT}

\u2501\u2501 SLIDE OUTLINE (8 slides, 15\u201320 min presentation) \u2501\u2501

Slide 1 \u2014 Title
"How to Add $50K Pipeline in 14 Days Without Hiring an SDR"
Your name, company, date

Slide 2 \u2014 The Problem (Their World)
"At seed stage, founder-led sales hits a ceiling."
\u2022 Pipeline is inconsistent \u2014 feast or famine
\u2022 Offer is feature-led, not outcome-led
\u2022 Warm network is running dry
\u2022 Hiring an SDR costs \u20AC5K/month and takes 3 months to ramp

Slide 3 \u2014 The Turning Point
"The bottleneck isn't volume. It's your offer."
One specific example of a weak vs strong offer side-by-side.

Slide 4 \u2014 The Solution
"A 2-week RevOps sprint: audit + offer + meetings."
Week 1: ICP audit, offer rewrite, prospect list
Week 2: Test with real prospects, book 3\u20135 calls

Slide 5 \u2014 Why This Works
3 proof points (operator: replace with real case data):
1. [Founder name] booked [X] calls in [Y] days \u2014 [sector]
2. [Metric: offer open rate / reply rate / conversion]
3. [Before/after comparison]

Slide 6 \u2014 Pricing + Scope
\u20AC2,500\u2013\u20AC4,500 fixed. What's included. What's not.
Guarantee: 3 meetings or Week 2 is free.

Slide 7 \u2014 Next Step
"One action: book a 20-min pipeline audit."
Calendar link / direct CTA.

Slide 8 \u2014 Q&A

Speaker notes (Slide 3): Pause here. Ask "Does this sound familiar?" \u2014 wait for yes before moving on.
Speaker notes (Slide 6): Don't negotiate on price without reducing scope first.`
      };
  }
}
function delivery(taskType, date, constraints) {
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "onboarding-checklist":
      return {
        title: `Onboarding Checklist \u2014 ${date} \u2014 Sprint Week 1\u20132`,
        content: ch + `SPRINT ONBOARDING CHECKLIST
Product: ${PRODUCT}
Owner: Operator (check off each item before moving to next)

\u2501\u2501 PRE-SPRINT (Before Day 1) \u2501\u2501
\u25A1 Contract signed + invoice sent
\u25A1 Kickoff call scheduled (Day 1, 60 min)
\u25A1 Client fills onboarding form (ICP, product, current outreach samples)
\u25A1 Access granted: CRM read-only (if applicable), LinkedIn, email tool
\u25A1 Shared Notion/Drive folder created

\u2501\u2501 WEEK 1 \u2014 Audit + Offer Build \u2501\u2501

Day 1 \u2014 Kickoff (60 min):
\u25A1 ICP interview: who is the buyer, what do they care about, what have they tried
\u25A1 Review current offer / outreach samples
\u25A1 Align on success definition: what does "3 qualified calls" mean to them
\u25A1 Set Week 1 deliverables + review date (Day 5)

Day 2\u20133 \u2014 ICP Audit:
\u25A1 Map current ICP against 4 dimensions: industry, size, role, pain
\u25A1 Identify top 1\u20133 ICP segments
\u25A1 Document "wrong ICP" signals to filter out
\u25A1 Draft ICP one-pager (1 page, operator reviews)

Day 4 \u2014 Offer Build:
\u25A1 Draft offer (using offer draft template from sales_asset)
\u25A1 Score against KPIs: clarity, price, margin, CTA
\u25A1 Internal review (factory agent F equivalent)
\u25A1 Revise if score < 0.75

Day 5 \u2014 Delivery Review:
\u25A1 Present ICP audit + offer to client (30 min)
\u25A1 Collect feedback (written, same day)
\u25A1 Confirm approval to proceed to Week 2

\u2501\u2501 WEEK 2 \u2014 Test + Booking \u2501\u2501

Day 6\u20137 \u2014 Prospect List:
\u25A1 Build list: 50\u2013100 contacts matching ICP
\u25A1 Validate: name, title, company, LinkedIn, email
\u25A1 Segment by ICP tier (A = perfect match, B = strong, C = borderline)

Day 8\u201310 \u2014 Outreach:
\u25A1 Send offer to Tier A prospects (20\u201330 contacts)
\u25A1 Track: sent / opened / replied / booked
\u25A1 Follow-up Touch 1 on Day 2 after send
\u25A1 Follow-up Touch 2 on Day 4 after send

Day 11\u201312 \u2014 Calls + Conversion:
\u25A1 Conduct booked calls (operator or client)
\u25A1 Qualify each call against framework
\u25A1 Document qualified vs unqualified

Day 13 \u2014 Wrap-Up:
\u25A1 Count booked qualified calls (target: 3+)
\u25A1 Prepare Week 2 report (1 page)

Day 14 \u2014 Sprint Close:
\u25A1 Deliver final report: ICP audit + offer + outreach results + pipeline impact
\u25A1 Invoice: Week 2 payment
\u25A1 Offer: retainer proposal or next sprint brief
\u25A1 Archive all assets to Warehouse`
      };
    case "dashboard-component-plan":
      return {
        title: `Dashboard Component Plan \u2014 ${date} \u2014 RevOps Sprint View`,
        content: ch + `DASHBOARD COMPONENT PLAN \u2014 RevOps Sprint View
Purpose: Operator visibility into sprint health for the ${PRODUCT}

\u2501\u2501 COMPONENT 1 \u2014 Pipeline Health Score \u2501\u2501
Type: KPI card (single number)
Data: (qualified calls booked / target) \xD7 100
Display: Large number + colour (green \u2265 80%, yellow 50\u201379%, red < 50%)
Update: Per sprint day

\u2501\u2501 COMPONENT 2 \u2014 Outreach Funnel \u2501\u2501
Type: Horizontal funnel chart
Stages: Contacted \u2192 Opened \u2192 Replied \u2192 Called \u2192 Qualified
Data source: Outreach tracker (manual entry or CRM)
Display: Count + conversion % at each stage
Benchmark: Industry avg shown as grey line

\u2501\u2501 COMPONENT 3 \u2014 Offer Score Timeline \u2501\u2501
Type: Line chart
Data: Offer quality score by iteration (1st draft, revised, final)
X-axis: Iteration number | Y-axis: Score (0\u20131)
Threshold line: 0.75 (pass/fail)

\u2501\u2501 COMPONENT 4 \u2014 Prospect Tier Breakdown \u2501\u2501
Type: Donut chart
Segments: Tier A / Tier B / Tier C / Disqualified
Data source: Prospect list with tier labels
Use: Shows whether list quality matches ICP

\u2501\u2501 COMPONENT 5 \u2014 Day-by-Day Activity Log \u2501\u2501
Type: Timeline/table
Columns: Date, Action, Output, Status
Data: Manual or imported from Factory event log
Filter: By sprint day, by agent, by status

\u2501\u2501 COMPONENT 6 \u2014 Cost per Booked Call \u2501\u2501
Type: KPI card
Formula: Total sprint cost \xF7 qualified calls booked
Display: \u20AC[amount] + trend vs previous sprint
Target: < \u20AC500 per qualified call

Implementation notes:
- All components use data from FactoryStore or manual input
- No third-party dashboard tool required \u2014 this plan is for a custom build
- Operator approves component design before any dev work begins`
      };
    case "landing-template":
      return {
        title: `Landing Template \u2014 ${date} \u2014 One-Page Sprint Page`,
        content: ch + `LANDING PAGE TEMPLATE \u2014 One-Page Sprint Offer
Purpose: Standalone page for the ${PRODUCT}
Operator: Fill [brackets], remove instruction text, review before publishing

\u2501\u2501 NAV (minimal) \u2501\u2501
Logo | "Book Audit" button (primary, top-right)

\u2501\u2501 HERO \u2501\u2501
H1: "[Pain-first headline \u2014 6\u201310 words]"
Example: "Your Pipeline Is Stalling. Here's the 14-Day Fix."
Subhead: "A fixed-scope RevOps sprint that builds one high-converting offer and books 3\u20135 qualified intro meetings for ${ICP}."
CTA: "Book Your Free 20-Min Pipeline Audit \u2192"
Trust line: "Fixed scope. Fixed price. 3 meetings or Week 2 is free."

\u2501\u2501 PROBLEM SECTION \u2501\u2501
H2: "Sound familiar?"
3-column grid:
\u2022 Column 1: "Your outreach gets polite replies, not meetings."
\u2022 Column 2: "You're not sure if the problem is the offer or the list."
\u2022 Column 3: "You don't have bandwidth to run experiments for 3 months."

\u2501\u2501 SOLUTION SECTION \u2501\u2501
H2: "The Sprint"
Two-column layout:

Week 1 \u2014 Audit + Offer Build (\u20AC1,500\u2013\u20AC2,000):
\u2022 ICP deep-dive interview (60 min \u2014 your only time commitment)
\u2022 Full audit of your current offer and outreach
\u2022 One rewritten offer, scored and validated
\u2022 Prospect list: 50+ contacts matching your ICP

Week 2 \u2014 Test + Booking (\u20AC1,000\u2013\u20AC2,500):
\u2022 Outreach to 20\u201330 Tier A prospects
\u2022 3-touch follow-up sequence
\u2022 Target: 3\u20135 qualified intro meetings booked
\u2022 Full results report

\u2501\u2501 PROOF SECTION \u2501\u2501
H2: "Results"
[Operator: insert 1\u20132 real case studies. Do not fabricate. Leave blank until ready.]

\u2501\u2501 PRICING \u2501\u2501
Fixed Sprint: \u20AC2,500\u2013\u20AC4,500
Guarantee: 3 meetings or Week 2 is free.
"No retainer. No scope creep. One decision."

\u2501\u2501 CTA SECTION \u2501\u2501
H2: "Book your audit"
Subhead: "Free, 20 minutes, no commitment."
[Calendar embed or booking form]

\u2501\u2501 FOOTER \u2501\u2501
Contact | Privacy (basic) | No cookie banner needed (no tracking without consent)`
      };
    case "repo-task-draft":
      return {
        title: `Repo Task Draft \u2014 ${date} \u2014 Sprint Deliverables`,
        content: ch + `REPOSITORY TASK DRAFTS \u2014 Sprint Delivery Issues
Project: ${PRODUCT}
Format: GitHub Issues (copy-paste ready)

\u2501\u2501 ISSUE 1 \u2501\u2501
Title: "ICP Audit: Define Tier A/B/C criteria for current sprint"
Labels: delivery, week-1, sprint
Body:
Define qualification tiers for the current sprint's ICP:
- Tier A: Perfect match \u2014 move to outreach immediately
- Tier B: Strong match \u2014 include in outreach with modified copy
- Tier C: Borderline \u2014 do not include in this sprint's outreach

Deliverable: One-page ICP criteria document (Notion or MD file)
Owner: [Assign]
Due: Day 3 of sprint

\u2501\u2501 ISSUE 2 \u2501\u2501
Title: "Offer Build: Draft v1 + score against KPIs"
Labels: delivery, week-1, offer
Body:
Using the ICP Audit output and the offer draft template (sales_asset):
1. Draft offer v1
2. Run through Agent F scoring checklist (offer clarity, price, margin, CTA)
3. If score < 0.75: revise and re-score (max 1 revision)
4. Deliver final offer to client for approval

Deliverable: Final approved offer (plain text, reviewed by operator)
Owner: [Assign]
Due: Day 5 of sprint

\u2501\u2501 ISSUE 3 \u2501\u2501
Title: "Prospect List: 50+ Tier A contacts for outreach"
Labels: delivery, week-2, prospecting
Body:
Build a validated list of 50\u2013100 contacts:
- Match ICP Tier A criteria from Issue 1
- Fields: Name, Title, Company, Company Size, LinkedIn URL, Email
- Source: LinkedIn Sales Navigator / Apollo / manual research
- No scraping of private/logged-in data

Deliverable: CSV in shared Drive. Reviewed by operator before outreach.
Owner: [Assign]
Due: Day 7 of sprint

\u2501\u2501 ISSUE 4 \u2501\u2501
Title: "Outreach: Send + track 3-touch sequence"
Labels: delivery, week-2, outreach
Body:
Using the follow-up script (sales_asset):
1. Send Touch 1 to all Tier A prospects
2. Track: sent / opened / replied / booked
3. Send Touch 2 on Day 2 after Touch 1
4. Send Touch 3 (breakup) on Day 4 after Touch 2
5. Report booked calls daily

Deliverable: Daily log (date, action, replies, calls booked)
Owner: [Assign]
Due: Day 12 (ongoing from Day 8)

\u2501\u2501 ISSUE 5 \u2501\u2501
Title: "Sprint Close: Deliver final report + offboarding"
Labels: delivery, week-2, close
Body:
Compile:
- ICP Audit (Week 1 output)
- Final offer (approved version)
- Outreach results: sent / replied / booked / qualified
- Pipeline impact: calls booked \xD7 estimated deal value
- Recommendation: retainer / next sprint / hold

Deliver to client. File to Warehouse. Close sprint.
Owner: [Assign]
Due: Day 14`
      };
    default:
      return {
        title: `Demo Block \u2014 ${date} \u2014 20-Min Sprint Demo`,
        content: ch + `DEMO SCRIPT \u2014 20-Minute RevOps Sprint Demo
Audience: ${ICP} / Context: Discovery call after qualification

\u2501\u2501 SEGMENT 1 \u2014 Frame the Problem (3 min) \u2501\u2501

"Before I show you anything, I want to make sure we're solving the right problem.

Most founders I work with at [their stage] have the same 3 issues:
1. Pipeline is inconsistent \u2014 you close well but can't get enough first calls
2. Outreach feels like throwing darts in the dark
3. You don't know if the problem is the offer, the list, or the channel

Which of those resonates most for you right now?"

[Wait. Let them answer. Don't rush past this.]

\u2501\u2501 SEGMENT 2 \u2014 Show the Audit (5 min) \u2501\u2501

"Here's what Week 1 looks like. I'm going to show you an example ICP audit I did for a founder similar to you."

[Show: 1-page ICP audit example \u2014 redacted if real client, placeholder if not]

Key points to highlight:
- We start with their language, not our assumptions
- We score the current offer before building a new one
- The output is a written deliverable, not just a conversation

Pause: "Does this make sense as a starting point?"

\u2501\u2501 SEGMENT 3 \u2014 Show the Offer (5 min) \u2501\u2501

"Here's a before/after offer example."

[Show: before (generic pitch) vs after (outcome-led, specific, scored)]

"The before is what most founders are sending. The after is what we build in Week 1."

"How does your current offer compare to the 'before' or the 'after'?"

\u2501\u2501 SEGMENT 4 \u2014 Week 2 Results (4 min) \u2501\u2501

"Week 2: we take the new offer, build a 50-contact prospect list, and run the outreach.

[Operator: insert real result here \u2014 calls booked, timeline, sector]

The goal is 3 qualified calls minimum. If we don't hit it, Week 2 is free."

\u2501\u2501 SEGMENT 5 \u2014 Pricing + CTA (3 min) \u2501\u2501

"The sprint is \u20AC2,500\u2013\u20AC4,500 fixed. Here's exactly what that includes."
[Show: scope breakdown \u2014 do not negotiate during the demo]

"What would make this a clear yes for you today?"

[Wait. Don't fill the silence. Let them respond.]

Notes: Never demo more than 20 minutes. If they're not engaged by Segment 3, ask a direct question.`
      };
  }
}
function research(taskType, date, constraints) {
  const doy = dayOfYear(date);
  const niche = SAAS_NICHES[doy % SAAS_NICHES.length] ?? "B2B SaaS";
  const nicheFocus = extractNicheFocus(constraints) || niche;
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "niche-research":
      return {
        title: `Niche Research \u2014 ${date} \u2014 ${nicheFocus}`,
        content: ch + `NICHE RESEARCH REPORT
Niche: ${nicheFocus}
ICP: ${ICP}

\u2501\u2501 NICHE SUMMARY \u2501\u2501

${nicheFocus} is a sub-segment of the B2B SaaS market with the following characteristics:
- Typical company size: 10\u2013100 employees
- Revenue range at seed: $10K\u2013$80K MRR
- Primary buying trigger: [founder is selling everything manually and hitting a ceiling]
- Key pain: inconsistent pipeline; reliance on referrals

\u2501\u2501 MARKET SIZE SIGNALS (from public sources \u2014 operator to verify) \u2501\u2501

- Number of ${nicheFocus} companies in EU+UK: estimate 500\u20132,000 (based on LinkedIn filters)
- Annual growth: 15\u201325% based on VC investment trends
- Saturation risk: Low to medium \u2014 space is growing faster than outbound capacity

\u2501\u2501 PAIN POINTS SPECIFIC TO THIS NICHE \u2501\u2501

1. Long sales cycles (30\u201390 days) compress MRR predictability
2. Founders often sell to peers \u2014 hard to separate social from commercial relationships
3. ICP definition is blurry: "any company that could use us" syndrome
4. Pricing is often undervalued \u2014 founders undercharge because they fear churn

\u2501\u2501 OFFER ANGLES FOR THIS NICHE \u2501\u2501

1. "Get your first 10 paying customers outside your network" (relevance: high)
2. "Convert demo requests into paid contracts faster" (relevance: medium)
3. "Build a repeatable outbound system before you hire your first SDR" (relevance: high)

\u2501\u2501 CHANNEL RECOMMENDATIONS \u2501\u2501

- LinkedIn: Strong \u2014 founders in ${nicheFocus} are active
- Cold email: Medium \u2014 open rates 25\u201335% with personalisation
- Community: Look for Slack groups, Discord servers specific to ${nicheFocus}
- Warm intro: Highest conversion \u2014 ask existing clients for 2 intros each

\u2501\u2501 KEYWORD RESEARCH STARTING POINTS \u2501\u2501

Commercial: "${nicheFocus} sales consultant", "${nicheFocus} outbound", "${nicheFocus} pipeline"
Informational: "how to sell [niche] software", "${nicheFocus} go-to-market"

\u2501\u2501 NEXT STEP \u2501\u2501

Operator: confirm if this niche is in our current ICP filter. If yes, add to prospect list sourcing criteria.`
      };
    case "keyword-set":
      return {
        title: `Keyword Set \u2014 ${date} \u2014 Organic + Paid`,
        content: ch + `KEYWORD SET \u2014 SEO + PPC
Target: ${nicheFocus} founders | Product: ${PRODUCT}

\u2501\u2501 COMMERCIAL INTENT KEYWORDS (high priority for paid) \u2501\u2501

Tier 1 \u2014 Direct match (small volume, high intent):
\u2022 "revops consultant for startups" (est. 50\u2013200/mo)
\u2022 "b2b saas outbound consultant" (est. 100\u2013300/mo)
\u2022 "pipeline sprint b2b" (est. 10\u201350/mo \u2014 niche, low competition)
\u2022 "fractional revops" (est. 200\u2013500/mo \u2014 growing)
\u2022 "saas founder sales help" (est. 50\u2013150/mo)

Tier 2 \u2014 Broader commercial (higher volume, more competition):
\u2022 "b2b sales consultant" (est. 1K\u20133K/mo)
\u2022 "startup sales consultant" (est. 500\u20131K/mo)
\u2022 "outbound sales strategy" (est. 2K\u20135K/mo)

\u2501\u2501 INFORMATIONAL INTENT (good for LinkedIn + content) \u2501\u2501

\u2022 "why b2b saas pipeline stalls"
\u2022 "how to write a sales offer for startups"
\u2022 "seed stage outbound strategy"
\u2022 "icp qualification framework"
\u2022 "how to qualify leads saas"
\u2022 "sales script for saas founders"
\u2022 "how to get first b2b customers"
\u2022 "when to hire first sdr"
\u2022 "fractional sales consultant vs sdr"

\u2501\u2501 NEGATIVE KEYWORDS (exclude to avoid wasted spend) \u2501\u2501

\u2022 "free" \u2022 "template only" \u2022 "enterprise" (> 500 employees)
\u2022 "ecommerce" \u2022 "b2c" \u2022 "marketing agency"

\u2501\u2501 SEMANTIC CLUSTERS \u2501\u2501

Cluster 1 \u2014 Pipeline: pipeline, qualified leads, booked calls, outbound, meetings
Cluster 2 \u2014 Offer: offer writing, sales copy, value proposition, pitch
Cluster 3 \u2014 Consulting: consultant, fractional, sprint, revops, revenue operations
Cluster 4 \u2014 Stage: seed stage, pre-series a, early stage, founder-led sales

\u2501\u2501 SUGGESTED CONTENT PIECES \u2501\u2501

1. "The Seed-Stage Pipeline Audit: 5 Questions That Diagnose Your Outbound" (organic)
2. "What Is a RevOps Sprint? (And Is It Right for Your Stage?)" (comparison)
3. "ICP vs Persona: Why Founders Confuse Them and Lose Deals" (informational)

Operator: Validate search volumes in Google Keyword Planner or Ahrefs before running paid ads.`
      };
    case "opportunity-map":
      return {
        title: `Opportunity Map \u2014 ${date} \u2014 5 Whitespace Opportunities`,
        content: ch + `OPPORTUNITY MAP \u2014 5 Whitespace Opportunities
Lens: ${nicheFocus} / Product: ${PRODUCT}

\u2501\u2501 OPPORTUNITY 1 \u2014 Pre-Series A Timing \u2501\u2501

Signal: Founders who just closed a seed round (\u20AC500K\u2013\u20AC2M) have cash and urgency to prove pipeline before Series A.
Window: 3\u20136 months post-close
Entry: Monitor Crunchbase/LinkedIn for recent seed announcements in ${nicheFocus}
Offer angle: "You've raised. Now you need pipeline proof for your Series A deck."
Risk: Founder may hire in-house instead. Counter with speed argument (2 weeks vs 3 months to ramp).

\u2501\u2501 OPPORTUNITY 2 \u2014 Post-Product-Market Fit Stall \u2501\u2501

Signal: Companies at \u20AC20K\u2013\u20AC50K MRR with flat growth for 2+ months.
Window: Ongoing \u2014 look for "we have the product, struggling with growth" language in founder posts
Entry: LinkedIn content targeting this transition moment
Offer angle: "The product is working. The offer isn't landing yet."
Risk: Founders may attribute flat growth to product, not sales.

\u2501\u2501 OPPORTUNITY 3 \u2014 Failed SDR Hire \u2501\u2501

Signal: Founders who hired and fired a first SDR within 6 months.
Window: 0\u20133 months after the failed hire
Entry: LinkedIn post listening ("we tried SDR and it didn't work")
Offer angle: "Before you hire again \u2014 let a sprint prove the offer works first."
Risk: Founder may be skeptical of all external sales help.

\u2501\u2501 OPPORTUNITY 4 \u2014 Conference Season Timing \u2501\u2501

Signal: B2B SaaS events (SaaStock, SaaSOpen, Product-Led Summit) attract exactly the ICP.
Window: 3\u20134 weeks before each event
Entry: Event sponsorship (low cost) or side events / dinners
Offer angle: "Walk out of [event] with a 2-week sprint starting next Monday."
Risk: High competition from other consultants at same events.

\u2501\u2501 OPPORTUNITY 5 \u2014 Community Trust Plays \u2501\u2501

Signal: Founder Slack groups, Indie Hackers, SaaS communities have active Q&A on sales/outbound.
Window: Ongoing \u2014 allocate 2\u20133h per week
Entry: Answer questions genuinely for 30 days before pitching anything
Offer angle: Trust-based warm DM after 30 days of value-add
Risk: Time-intensive. Lower ROI per hour than direct outreach, but builds brand.

\u2501\u2501 PRIORITISATION \u2501\u2501

Highest ROI: Opportunity 2 (PMF stall) \u2014 clearest pain, widest audience
Fastest to test: Opportunity 3 (failed SDR) \u2014 acute pain, immediate window
Operator: review this map monthly and mark which opportunities are active.`
      };
    case "audience-list":
      return {
        title: `Audience Segmentation \u2014 ${date} \u2014 Target Personas`,
        content: ch + `AUDIENCE SEGMENTATION MATRIX
ICP: ${ICP} | Focus: ${nicheFocus}

\u2501\u2501 PERSONA 1 \u2014 The Overwhelmed Founder \u2501\u2501

Profile:
- Revenue: $15K\u2013$35K MRR
- Stage: 12\u201324 months post-launch
- Team: 3\u20138 people (no dedicated sales)
- Pain: "I'm closing deals from my network but I can't scale it"
- Trigger: Warm network is drying up, next hire is unclear

Messaging angle: "You don't need more calls. You need a better offer."
Channel: LinkedIn DM (they're active), direct email
Content type: Short diagnostic (3 questions that show them the problem)

\u2501\u2501 PERSONA 2 \u2014 The Frustrated Experimenter \u2501\u2501

Profile:
- Revenue: $30K\u2013$60K MRR
- Stage: Has tried ads, SDR, cold email \u2014 mixed results
- Team: 5\u201315 people (1 sales hire, not performing)
- Pain: "We're spending on outbound but it's not converting"
- Trigger: Q2 pipeline is below plan; pressure from investors

Messaging angle: "Before you spend more \u2014 fix the offer first."
Channel: LinkedIn + cold email with case study
Content type: Before/after offer teardown

\u2501\u2501 PERSONA 3 \u2014 The Pre-Series A Founder \u2501\u2501

Profile:
- Revenue: $40K\u2013$80K MRR
- Stage: 18\u201336 months, planning Series A in 6\u201312 months
- Team: 10\u201325 people (building out go-to-market)
- Pain: "We need to show investors a predictable pipeline"
- Trigger: Series A prep \u2014 needs repeatable sales proof

Messaging angle: "Predictable pipeline before you raise. The sprint is the proof."
Channel: Warm intro or event-based (SaaStock, etc.)
Content type: ROI calculator + deck contribution

\u2501\u2501 SCORING MATRIX \u2501\u2501

Score each prospect 1\u20133 on each dimension:
- Revenue stage fit (1=outside range, 2=edge, 3=perfect match)
- Role (1=not decision-maker, 2=influencer, 3=sole decision-maker)
- Pain signal present (1=none, 2=mild, 3=explicit)
- Timing signal (1=no urgency, 2=watching, 3=active buyer)

Total 10\u201312: Tier A | Total 7\u20139: Tier B | Total < 7: Nurture only`
      };
    default:
      return {
        title: `Lead Source List \u2014 ${date} \u2014 8 Validated Sources`,
        content: ch + `LEAD SOURCE LIST \u2014 8 Validated Sources
ICP: ${ICP} | Focus: ${nicheFocus}

Quality rating: \u2605\u2605\u2605 High | \u2605\u2605 Medium | \u2605 Low

\u2501\u2501 SOURCE 1 \u2014 LinkedIn Sales Navigator \u2605\u2605\u2605 \u2501\u2501

Filters: Job Title: Founder/CEO/Co-Founder | Company Size: 10\u201350 | Industry: Software
Free signal: Posts containing "pipeline", "outbound", "MRR", "seed stage"
Reach: Thousands \u2014 filter to 50\u2013100 Tier A per sprint
Cost: \u20AC65\u2013\u20AC100/month for Navigator
Note: Do not scrape. Manual review of profiles before outreach.

\u2501\u2501 SOURCE 2 \u2014 Crunchbase (seed rounds) \u2605\u2605\u2605 \u2501\u2501

Filter: Funding type = Seed | Amount: $250K\u2013$3M | Date: Last 6 months | Category: SaaS/B2B
Signal: Recently funded = cash + urgency
Reach: 50\u2013200 companies/month (EU + UK focus)
Cost: Free basic / $49/month Pro
Note: Cross-reference with LinkedIn to find founder contact.

\u2501\u2501 SOURCE 3 \u2014 Apollo.io \u2605\u2605 \u2501\u2501

Filters: Same as LinkedIn above
Advantage: Direct email included
Risk: Data quality varies \u2014 verify before outreach
Cost: $49\u2013$99/month
Note: Validate email addresses before sending cold email.

\u2501\u2501 SOURCE 4 \u2014 Indie Hackers / MicroConf community \u2605\u2605 \u2501\u2501

Signal: Founders who post about revenue milestones, outbound struggles
Reach: Smaller but high-intent
Method: Read + engage before DM. Never cold pitch in community threads.
Cost: Free

\u2501\u2501 SOURCE 5 \u2014 Product Hunt (Makers) \u2605\u2605 \u2501\u2501

Signal: Launched product in last 6 months + B2B category
Reach: 20\u201350 relevant founders/week
Method: Check "made by" profile \u2192 LinkedIn \u2192 qualify
Cost: Free

\u2501\u2501 SOURCE 6 \u2014 SaaStock / SaaSOpen (event lists) \u2605\u2605\u2605 \u2501\u2501

Signal: Attending = active, growth-minded founder
Reach: 100\u2013500 relevant contacts per event
Method: Pre-event LinkedIn outreach with event reference
Cost: Conference ticket or side event only

\u2501\u2501 SOURCE 7 \u2014 VC Portfolio Pages \u2605\u2605 \u2501\u2501

Seed-stage VC portfolio companies = pre-qualified funding signal
VCs to monitor: Seedcamp, LocalGlobe, Point Nine, Cherry Ventures (EU focus)
Method: Portfolio page \u2192 company \u2192 founder LinkedIn
Cost: Free | Volume: 20\u201350 new companies/month

\u2501\u2501 SOURCE 8 \u2014 Referral (existing clients) \u2605\u2605\u2605 \u2501\u2501

Method: After sprint delivery, ask: "Who else in your network has the same pipeline problem?"
Conversion rate: 30\u201350% (warm intro vs cold)
Cost: Free | Risk: Low \u2014 trust is pre-established
Action: Build referral ask into sprint offboarding checklist

\u2501\u2501 PRIORITY ORDER FOR NEXT SPRINT \u2501\u2501

1. Crunchbase (fresh signal) \u2192 2. LinkedIn Nav (volume) \u2192 3. Referral (highest conversion)`
      };
  }
}
function qa(taskType, date, constraints) {
  const ch = constraintHeader(constraints);
  switch (taskType) {
    case "cleanup-report":
      return {
        title: `Cleanup Report \u2014 ${date} \u2014 Asset Library`,
        content: ch + `CLEANUP REPORT \u2014 Asset Library Review
Date: ${date}

\u2501\u2501 SCOPE \u2501\u2501
Review all daily_review and warehouse assets for: stale content, outdated numbers, placeholder text, and copy debt.

\u2501\u2501 CLEANUP CHECKLIST \u2501\u2501

Marketing assets:
\u25A1 Any hook that references a date > 30 days old \u2192 update or archive
\u25A1 Any copy that uses [placeholder] text \u2192 complete or trash
\u25A1 Landing sections with missing proof/case study \u2192 flag as "needs real data"
\u25A1 Campaign angles with no KPI tracking \u2192 add KPI block or archive

Sales assets:
\u25A1 Objection responses that mention competitors by name \u2192 remove (risk of inaccuracy)
\u25A1 Offer templates with prices not reviewed in 60 days \u2192 flag for pricing review
\u25A1 Follow-up scripts with broken structure (gaps in touch sequence) \u2192 fix
\u25A1 Qualification questions that reference stages that no longer match ICP \u2192 update

Delivery assets:
\u25A1 Checklists with tasks that reference unavailable tools \u2192 update
\u25A1 Demo scripts referencing case studies that aren't real yet \u2192 mark clearly as placeholder
\u25A1 Onboarding docs that don't match current sprint scope \u2192 sync

Research assets:
\u25A1 Lead source lists older than 90 days \u2192 re-validate (sources change)
\u25A1 Niche research with market size data > 1 year old \u2192 refresh or caveat
\u25A1 Keyword sets not validated in Search Console or Ahrefs \u2192 mark unvalidated

\u2501\u2501 COPY DEBT LOG \u2501\u2501

Item: [Operator fills in each flagged asset]
Action needed: [update / trash / complete with real data]
Owner: [Operator]
Due: [within 7 days]

\u2501\u2501 RULE \u2501\u2501
Assets in Warehouse should be deployment-ready. If an asset in Warehouse has a [placeholder], move it back to daily_review until complete.`
      };
    case "agent-improvement-report":
      return {
        title: `Agent Improvement Report \u2014 ${date} \u2014 Pipeline Agents`,
        content: ch + `AGENT IMPROVEMENT REPORT
Date: ${date}

\u2501\u2501 METHODOLOGY \u2501\u2501
Review last 7 days of Factory events. Score each agent on: output quality (0\u20131), speed (issues or delays), error rate.

\u2501\u2501 AGENT A \u2014 Signal Intake Officer \u2501\u2501
Current performance: Categorises signals correctly for clear inputs. Misses category for ambiguous signals.
Improvement: Expand CATEGORY_KEYWORDS with 5 additional signal words per category.
Priority: Low

\u2501\u2501 AGENT B \u2014 ICP Qualifier \u2501\u2501
Current performance: Threshold at 0.5 works well. Some borderline signals (score 0.45\u20130.55) are unclear.
Improvement: Add confidence band: 0.45\u20130.55 = "borderline \u2014 operator review recommended"
Priority: Medium

\u2501\u2501 AGENT C \u2014 Lead Enricher \u2501\u2501
Current performance: Buyer persona assignment is too generic ("Founder / CEO").
Improvement: Add domain-specific buyer types (e.g., "Technical Founder", "Commercial Founder", "Repeat Founder")
Priority: Low

\u2501\u2501 AGENT D \u2014 Offer Strategist \u2501\u2501
Current performance: Positioning block is binary (direct outbound / consultative). Real signals are more nuanced.
Improvement: Add 3rd positioning type: "Social proof first" for founders with strong testimonials
Priority: Medium

\u2501\u2501 AGENT E \u2014 Offer Builder \u2501\u2501
Current performance: Stub template is solid structure. Lacks variation over repeated runs.
Improvement: Add 3 alternative offer frameworks (AIDA, PAS, outcome-first) and rotate by signal type.
Priority: High

\u2501\u2501 AGENT F \u2014 Offer Evaluator \u2501\u2501
Current performance: 4 KPIs cover the basics. Missing: personalisation score.
Improvement: Add KPI 5: personalisation \u2014 checks if offer references specific buyer pain, not generic.
Priority: Medium

\u2501\u2501 AGENT G \u2014 Offer Editor \u2501\u2501
Current performance: CTA fix is effective. Price justification fix is too mechanical.
Improvement: Price justification should reference ROI framing, not just reword the pricing line.
Priority: Medium

\u2501\u2501 AGENTS H\u2013N \u2501\u2501
No active issues in current sprint. Review again in 30 days when volume increases.

\u2501\u2501 PRIORITY ACTIONS \u2501\u2501
1. Agent E: Add offer framework rotation (this sprint)
2. Agent B: Add confidence band for borderline scores (next sprint)
3. Agent D: Add social-proof positioning type (next sprint)`
      };
    case "weak-asset-review":
      return {
        title: `Weak Asset Review \u2014 ${date} \u2014 Low Score Items`,
        content: ch + `WEAK ASSET REVIEW \u2014 Low Quality Score Items
Date: ${date} | Threshold: qualityScore < 0.6

\u2501\u2501 REVIEW PROTOCOL \u2501\u2501

1. Pull all daily digitals with qualityScore < 0.6 or status = needs_rework
2. For each: identify root cause of low score
3. Decide: rework, trash, or accept with caveat
4. Log decision with operator feedback for next mission run

\u2501\u2501 COMMON FAILURE MODES \u2501\u2501

FAILURE MODE 1 \u2014 Too generic:
Symptom: Content reads as if written for any B2B company, not specifically for Seed-stage SaaS
Fix: Add ICP-specific numbers (MRR ranges), stage-specific language (seed/PMF/pre-series A)
Check: Does the asset pass the "could this apply to a plumber?" test? If yes \u2192 revise.

FAILURE MODE 2 \u2014 Missing numbers:
Symptom: No price, no timeline, no quantity, no target metric
Fix: Add at least 3 specific numbers (\u20AC amount, number of days, number of calls)
Check: Count numbers in the asset. Target: \u2265 5 concrete numbers.

FAILURE MODE 3 \u2014 No CTA:
Symptom: Asset ends without a clear next step for the reader
Fix: Add one specific CTA \u2014 action + channel + timeframe
Check: Can the reader do something right now after reading this? If not \u2192 revise.

FAILURE MODE 4 \u2014 Stale constraints:
Symptom: Operator feedback from previous run is not addressed in the content
Fix: Re-run the generator with the constraint explicitly incorporated
Check: Read the constraint. Read the asset. Is the constraint visibly addressed? If not \u2192 rework.

FAILURE MODE 5 \u2014 Placeholder not filled:
Symptom: "[Operator to insert X]" appears in the content
Fix: Either fill in the real data or mark the asset as "blocked \u2014 needs data" and do not send to warehouse
Rule: No asset with an unfilled placeholder may enter Warehouse.

\u2501\u2501 SCORING RUBRIC \u2501\u2501
0.0\u20130.4: Trash or major rework
0.4\u20130.6: Minor rework \u2014 fix identified failure mode
0.6\u20130.8: Accept with operator note
0.8\u20131.0: Accept and send to Warehouse`
      };
    case "next-day-plan":
      return {
        title: `Next-Day Plan \u2014 ${date} \u2014 Tomorrow's Priorities`,
        content: ch + `NEXT-DAY PRODUCTION PLAN
Date: ${date} | Plan for: ${new Date(new Date(date).getTime() + 864e5).toISOString().slice(0, 10)}

\u2501\u2501 CARRY-FORWARD ITEMS (from today) \u2501\u2501
[ ] Any assets in needs_rework status \u2192 rework first thing
[ ] Any approval queue items pending operator decision \u2192 resolve before running new missions
[ ] Any open feedback events \u2192 confirm addressed in today's generator run

\u2501\u2501 TOMORROW'S MISSION FOCUS \u2501\u2501

Marketing: [operator: note any campaign that needs copy refresh or a new hook test]
Sales: [operator: note any objection that came up in calls this week \u2014 add to objection map]
Delivery: [operator: note any sprint step that took longer than planned \u2014 update checklist]
Research: [operator: note any niche or keyword that performed well \u2014 expand]
QA: [operator: review tomorrow's output against today's feedback before accepting]

\u2501\u2501 PRODUCTION RULES FOR TOMORROW \u2501\u2501

1. Run runDailyMissions() at start of work session
2. Review all 5 outputs before accepting any
3. Apply existing operator feedback before accepting the marketing or sales asset
4. Do not send any asset to Warehouse with an unfilled placeholder
5. Close any needs_rework items from today before end of day

\u2501\u2501 DAILY PRODUCTION KPIs \u2501\u2501

\u2022 5 assets produced: Yes / No
\u2022 Assets reviewed by operator: Yes / No
\u2022 Assets accepted to Warehouse: __ / 5
\u2022 Assets sent to Trash: __ / 5
\u2022 Feedback events created: __ (target: 0, meaning all accepted)
\u2022 Time spent in review: __ min (target: < 30 min/day)

\u2501\u2501 WEEKLY REFLECTION (fill each Friday) \u2501\u2501
\u2022 Best asset this week: [department + title]
\u2022 Weakest pattern: [failure mode that repeated]
\u2022 One change to make to generators next week: [specific]
\u2022 Operator satisfaction with the daily loop (1\u201310): [score]`
      };
    default:
      return {
        title: `QA Report \u2014 ${date} \u2014 Daily Production Audit`,
        content: ch + `DAILY PRODUCTION QA REPORT
Date: ${date}
Scope: All 5 daily digital deliverables

\u2501\u2501 QA CHECKLIST \u2014 Applied to Every Asset \u2501\u2501

STRUCTURAL:
\u25A1 All required fields present (id, date, title, department, type, content, status, qualityScore)
\u25A1 No placeholder text left unfilled ("[bracket]" patterns)
\u25A1 Content length \u2265 400 characters (too short = low value)
\u25A1 At least 3 concrete numbers (price, timeline, or metric)
\u25A1 At least one clear call to action or next step

CONTENT QUALITY:
\u25A1 ICP-specific language used (references seed-stage, SaaS, MRR, or founder)
\u25A1 No fabricated data (no made-up case studies, fake company names, invented results)
\u25A1 Operator feedback from previous runs is addressed (if constraints exist)
\u25A1 No duplicate content from a previous date's production

COMPLIANCE:
\u25A1 No external sending instructions (all outreach requires operator approval)
\u25A1 No reference to specific prospect names without operator input
\u25A1 No pricing that contradicts the current operator-approved rate card
\u25A1 No automated action embedded (no "send this automatically" instructions)

\u2501\u2501 SCORING \u2501\u2501

Pass all 16 checks: qualityScore = 0.9\u20131.0 \u2192 Accept
Pass 13\u201315 checks: qualityScore = 0.7\u20130.89 \u2192 Accept with note
Pass 10\u201312 checks: qualityScore = 0.5\u20130.69 \u2192 Needs rework
Pass < 10 checks: qualityScore < 0.5 \u2192 Reject to trash

\u2501\u2501 TODAY'S FINDINGS \u2501\u2501
[Operator: fill in after reviewing each asset]

Marketing: __/16 checks passed | Action: __
Sales: __/16 checks passed | Action: __
Delivery: __/16 checks passed | Action: __
Research: __/16 checks passed | Action: __
QA: __/16 checks passed | Action: __

\u2501\u2501 OVERALL DAILY SCORE \u2501\u2501
(Sum of qualityScores / 5) = __ | Target: \u2265 0.75`
      };
  }
}
function generateContent(dept, taskType, date, constraints) {
  switch (dept) {
    case "marketing":
      return marketing(taskType, date, constraints);
    case "sales":
      return sales(taskType, date, constraints);
    case "delivery":
      return delivery(taskType, date, constraints);
    case "research":
      return research(taskType, date, constraints);
    case "qa":
      return qa(taskType, date, constraints);
  }
}
function generateAssetContent(dept, taskType, date, constraints) {
  const g = generateContent(dept, taskType, date, constraints);
  return { title: g.title, content: g.content, qualityScore: scoreContent(g.content, constraints) };
}
var DEPARTMENTS = ["marketing", "sales", "delivery", "research", "qa"];
async function runDailyMissions(store2, date) {
  const today = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const existing = store2.getDailyDigitalsForDate(today).filter((d) => !d.orderId);
  if (existing.length >= 5) return existing;
  const constraintsByDept = store2.getRecentFeedbackConstraints(7);
  const digitals = [];
  for (const dept of DEPARTMENTS) {
    const taskType = selectTaskType(dept);
    const constraints = constraintsByDept[dept] ?? [];
    const generated = generateContent(dept, taskType, today, constraints);
    const score = scoreContent(generated.content, constraints);
    const missionId = `dm-${today}-${dept}`;
    const digitalId = `dd-${today}-${dept}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const digital = {
      id: digitalId,
      date: today,
      title: generated.title,
      department: dept,
      type: `${dept}_asset`,
      taskType,
      content: generated.content,
      status: "draft_ready",
      qualityScore: score,
      createdByAgentId: DEPT_AGENT[dept],
      linkedMissionId: missionId,
      revisionCount: 0,
      createdAt: now,
      updatedAt: now,
      location: "daily_review"
    };
    const mission = {
      id: missionId,
      date: today,
      department: dept,
      taskType,
      constraints,
      status: "complete",
      outputId: digitalId
    };
    store2.addDailyDigital(digital);
    store2.addDailyMission(mission);
    void recordQualityIntegritySignal(store2, DEPT_AGENT[dept], score, digitalId);
    const event = {
      id: randomUUID4(),
      timestamp: now,
      agentId: DEPT_AGENT[dept],
      eventType: "daily.mission_complete",
      detail: `${dept}/${taskType} \u2192 ${digitalId} (score=${score})`
    };
    store2.addEvent(event);
    digitals.push(digital);
  }
  return digitals;
}
function acceptDigital(store2, id) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "accepted", updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "accepted", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "accepted"
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.accepted",
    detail: `${d.title} accepted`
  });
}
function reworkDigital(store2, id, feedback) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "needs_rework", operatorFeedback: feedback, updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return "";
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "needs_rework", d.id);
  const revTaskId = `rev-${id}-${Date.now()}`;
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "needs_rework",
    feedback,
    nextRevisionTaskId: revTaskId
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.needs_rework",
    detail: `${d.title} \u2192 rework: "${feedback.slice(0, 80)}"`
  });
  return revTaskId;
}
function rejectDigital(store2, id, feedback) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "rejected", location: "trash", operatorFeedback: feedback, updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "rejected", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "rejected",
    feedback
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.rejected",
    detail: `${d.title} rejected: "${feedback.slice(0, 80)}"`
  });
}
function regenerateDigital(store2, id) {
  const d = store2.getDailyDigital(id);
  if (!d || d.status !== "needs_rework") return void 0;
  const constraints = [];
  if (d.orderId) {
    const order2 = store2.getOrder(d.orderId);
    if (order2) constraints.push(`Client brief from ${order2.clientName}: ${order2.description}`);
  }
  if (d.operatorFeedback) constraints.push(d.operatorFeedback);
  const deptFeedback = store2.getRecentFeedbackConstraints(7)[d.department] ?? [];
  for (const fb of deptFeedback) if (!constraints.includes(fb)) constraints.push(fb);
  const taskType = d.taskType ?? selectTaskType(d.department);
  const order = d.orderId ? store2.getOrder(d.orderId) : void 0;
  const service = order?.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const generated = service && order ? (() => {
    const g = buildServiceContent(service, order, constraints);
    return { ...g, qualityScore: scoreContent(g.content, constraints) };
  })() : generateAssetContent(d.department, taskType, d.date, constraints);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, {
    title: generated.title,
    content: generated.content,
    qualityScore: generated.qualityScore,
    taskType,
    status: "draft_ready",
    revisionCount: d.revisionCount + 1,
    updatedAt: now
  });
  if (d.orderId) {
    store2.updateOrder(d.orderId, {
      status: "ready_for_review",
      revisionCount: (store2.getOrder(d.orderId)?.revisionCount ?? 0) + 1,
      updatedAt: now
    });
  }
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: d.orderId ? "order.regenerated" : "daily.regenerated",
    detail: `${d.id} rev ${d.revisionCount + 1} \u2014 feedback applied: "${(d.operatorFeedback ?? "").slice(0, 60)}"`
  });
  return store2.getDailyDigital(id);
}
function warehouseDigital(store2, id) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDailyDigital(id, { status: "accepted", location: "warehouse", updatedAt: now });
  const d = store2.getDailyDigital(id);
  if (!d) return;
  void recordOperatorIntegritySignal(store2, d.createdByAgentId, "warehoused", d.id);
  store2.addFeedbackEvent({
    id: randomUUID4(),
    timestamp: now,
    digitalId: id,
    department: d.department,
    action: "warehoused"
  });
  store2.addEvent({
    id: randomUUID4(),
    timestamp: now,
    agentId: DEPT_AGENT[d.department],
    eventType: "daily.warehoused",
    detail: `${d.title} \u2192 warehouse`
  });
}

// packages/factory-core/src/orders.ts
import { randomUUID as randomUUID5 } from "node:crypto";
var TASK_KEYWORDS = {
  marketing: [
    [/\bads?\b|ad pack|advert/i, "ad-pack"],
    [/hook/i, "hook-set"],
    [/carousel/i, "carousel-outline"],
    [/landing/i, "landing-section"],
    [/campaign|angle/i, "campaign-angle"]
  ],
  sales: [
    [/pitch|deck|presentation/i, "pitch-pack"],
    [/objection/i, "objection-map"],
    [/follow.?up|sequence/i, "follow-up-script"],
    [/qualif/i, "qualification-questions"],
    [/offer|template/i, "offer-draft-template"]
  ],
  delivery: [
    [/demo/i, "demo-block"],
    [/onboard|checklist/i, "onboarding-checklist"],
    [/landing|website|page/i, "landing-template"],
    [/dashboard|component/i, "dashboard-component-plan"],
    [/repo|github|issue|task/i, "repo-task-draft"]
  ],
  research: [
    [/lead|source|list of/i, "lead-source-list"],
    [/niche|market/i, "niche-research"],
    [/keyword|seo/i, "keyword-set"],
    [/opportunit/i, "opportunity-map"],
    [/audience|persona|segment/i, "audience-list"]
  ],
  qa: [
    [/clean/i, "cleanup-report"],
    [/agent|improve/i, "agent-improvement-report"],
    [/weak|review/i, "weak-asset-review"],
    [/plan|tomorrow|next/i, "next-day-plan"],
    [/audit|qa|quality/i, "qa-report"]
  ]
};
function inferTaskType(dept, description) {
  for (const [pattern, taskType] of TASK_KEYWORDS[dept]) {
    if (pattern.test(description)) return taskType;
  }
  const list = TASK_TYPES[dept];
  return list[Math.floor(Math.random() * list.length)];
}
function createOrder(store2, input) {
  const service = input.serviceId ? getServiceDefinition(input.serviceId) : void 0;
  if (input.serviceId && !service) {
    throw new Error(`Unknown service id: ${input.serviceId}`);
  }
  const department = service?.defaultDepartment ?? input.department;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const order = {
    id: `ord-${randomUUID5().slice(0, 8)}`,
    clientName: input.clientName,
    ...input.contact ? { contact: input.contact } : {},
    description: input.description,
    department,
    ...service ? { serviceId: service.id, serviceName: service.name } : {},
    ...input.urgency ? { urgency: input.urgency } : {},
    ...input.language ? { language: input.language } : {},
    ...input.operatorNotes ? { operatorNotes: input.operatorNotes } : {},
    taskType: service?.defaultTaskType ?? inferTaskType(department, input.description),
    status: "new",
    revisionCount: 0,
    createdAt: now,
    updatedAt: now
  };
  store2.addOrder(order);
  store2.addEvent({
    id: randomUUID5(),
    timestamp: now,
    agentId: DEPT_AGENT[department],
    eventType: "order.received",
    detail: `${order.id} from ${input.clientName}${service ? ` [${service.name}]` : ""}: "${input.description.slice(0, 80)}"`
  });
  return order;
}
function produceOrderDeliverable(store2, orderId) {
  const order = store2.getOrder(orderId);
  if (!order || order.status !== "new" && order.status !== "in_production") return void 0;
  if (order.deliverableId && store2.getDailyDigital(order.deliverableId)?.status === "draft_ready") {
    return store2.getDailyDigital(order.deliverableId);
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const constraints = [`Client brief from ${order.clientName}: ${order.description}`];
  const deptFeedback = store2.getRecentFeedbackConstraints(7)[order.department] ?? [];
  for (const fb of deptFeedback) constraints.push(fb);
  const service = order.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const taskType = order.taskType ?? service?.defaultTaskType ?? inferTaskType(order.department, order.description);
  const generated = service ? (() => {
    const g = buildServiceContent(service, order, deptFeedback);
    return { ...g, qualityScore: scoreContent(g.content, deptFeedback) };
  })() : generateAssetContent(order.department, taskType, today, constraints);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const digital = {
    id: `dd-order-${order.id}`,
    date: today,
    title: `[ORDER ${order.id}] ${generated.title}`,
    department: order.department,
    type: `${order.department}_asset`,
    taskType,
    content: generated.content,
    status: "draft_ready",
    qualityScore: generated.qualityScore,
    createdByAgentId: DEPT_AGENT[order.department],
    linkedMissionId: `order-${order.id}`,
    orderId: order.id,
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
    location: "daily_review"
  };
  store2.addDailyDigital(digital);
  void recordQualityIntegritySignal(store2, DEPT_AGENT[order.department], generated.qualityScore, digital.id);
  store2.updateOrder(order.id, { status: "ready_for_review", deliverableId: digital.id, taskType, updatedAt: now });
  store2.addEvent({
    id: randomUUID5(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "order.produced",
    detail: `${order.id} \u2192 ${digital.id} (${order.department}/${taskType}, score=${generated.qualityScore})`
  });
  return digital;
}

// packages/factory-core/src/autopilot.ts
import { randomUUID as randomUUID6 } from "node:crypto";
function short(text, max = 140) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
function completedStep(input) {
  const startedAt = input.startedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
  const agent = getAgent(input.agentId);
  return {
    id: `aws-${randomUUID6().slice(0, 8)}`,
    agentId: input.agentId,
    agentName: agent.name,
    ...input.department ? { department: input.department } : {},
    jobType: input.jobType,
    status: input.status ?? "completed",
    inputSummary: input.inputSummary,
    ...input.outputSummary ? { outputSummary: input.outputSummary } : {},
    ...input.outputId ? { outputId: input.outputId } : {},
    startedAt,
    finishedAt,
    ...input.constraintsApplied && input.constraintsApplied.length > 0 ? { constraintsApplied: input.constraintsApplied } : {}
  };
}
function nextOperatorAction(store2) {
  const state = store2.snapshot();
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review");
  if (readyOrders.length > 0) return "Przejrzyj zlecenie klienta";
  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework");
  if (reworks.length > 0) return "Poczekaj na cykl poprawek lub go uruchom";
  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready");
  if (trainingDrafts.length > 0) return "Przejrzyj zasoby treningowe";
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending");
  if (pendingApprovals.length > 0) return "Przejrzyj pozycj\u0119 do zatwierdzenia w pipeline";
  return "System jest bezczynny / brak pilnej akcji";
}
function idleReason(store2, date) {
  const state = store2.snapshot();
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const trainingDrafts = state.dailyDigitals.filter((d) => !d.orderId && d.status === "draft_ready").length;
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length;
  if (readyOrders + trainingDrafts + pendingApprovals > 0) {
    return "Fabryka czeka na przegl\u0105d operatora.";
  }
  const todayTraining = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length;
  if (todayTraining >= 5) {
    return "Brak otwartych zlece\u0144 klienta, brak poprawek, a dzienny limit treningu jest ju\u017C wykonany.";
  }
  return "Brak otwartych zlece\u0144 klienta, brak poprawek i nie utworzono \u017Cadnego uruchamialnego zadania treningowego.";
}
function directorInputSummary(store2, date) {
  const state = store2.snapshot();
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length;
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const reworks = state.dailyDigitals.filter((d) => d.status === "needs_rework").length;
  const trainingToday = state.dailyDigitals.filter((d) => !d.orderId && d.date === date).length;
  return `otwarte zlecenia=${openOrders}; gotowe do przegl\u0105du=${readyOrders}; wymaga poprawek=${reworks}; trening dzi\u015B=${trainingToday}/5`;
}
async function runAutonomousCycle(store2, date, trigger = "manual") {
  const today = date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const steps = [];
  const outputsCreated = [];
  const knownOutputIds = new Set(store2.snapshot().dailyDigitals.map((d) => d.id));
  const directorInput = directorInputSummary(store2, today);
  let mode = "IDLE";
  let ordersProduced = [];
  let reworksRegenerated = [];
  let trainingCreated = 0;
  try {
    const runnable = store2.getOpenOrders().filter((order) => {
      const existing = order.deliverableId ? store2.getDailyDigital(order.deliverableId) : void 0;
      return existing?.status !== "needs_rework";
    });
    const integrityBlocked = runnable.filter((order) => isAgentQuarantined(store2, DEPT_AGENT[order.department]));
    const openOrders = runnable.filter((order) => !isAgentQuarantined(store2, DEPT_AGENT[order.department]));
    for (const order of integrityBlocked) {
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: `BLOCKED by integrity guard: ${DEPT_AGENT[order.department]} is quarantined (HRAR). Training allowed; client production halted until operator reset.`
      }));
    }
    ordersProduced = [];
    for (const order of openOrders) {
      const stepStartedAt = (/* @__PURE__ */ new Date()).toISOString();
      const constraints = [`Client brief from ${order.clientName}: ${order.description}`];
      if (order.operatorFeedback) constraints.push(order.operatorFeedback);
      const deliverable = produceOrderDeliverable(store2, order.id);
      if (deliverable) {
        ordersProduced.push(order.id);
        if (!knownOutputIds.has(deliverable.id)) {
          outputsCreated.push(deliverable.id);
          knownOutputIds.add(deliverable.id);
        }
      }
      steps.push(completedStep({
        agentId: DEPT_AGENT[order.department],
        department: order.department,
        jobType: "client_order_production",
        status: deliverable ? "completed" : "skipped",
        inputSummary: `${order.id} for ${order.clientName}: ${short(order.description)}`,
        outputSummary: deliverable ? `Produced ${deliverable.type} for review with score ${deliverable.qualityScore}.` : "No deliverable produced; order was not in a runnable state.",
        ...deliverable ? { outputId: deliverable.id } : {},
        constraintsApplied: constraints,
        startedAt: stepStartedAt
      }));
    }
    reworksRegenerated = [];
    for (const digital of store2.getDigitalsNeedingRework()) {
      const stepStartedAt = (/* @__PURE__ */ new Date()).toISOString();
      const constraints = [];
      if (digital.orderId) {
        const order = store2.getOrder(digital.orderId);
        if (order) constraints.push(`Client brief from ${order.clientName}: ${order.description}`);
      }
      if (digital.operatorFeedback) constraints.push(digital.operatorFeedback);
      const regenerated = regenerateDigital(store2, digital.id);
      if (regenerated) {
        reworksRegenerated.push(digital.id);
        outputsCreated.push(regenerated.id);
        knownOutputIds.add(regenerated.id);
      }
      steps.push(completedStep({
        agentId: digital.createdByAgentId,
        department: digital.department,
        jobType: digital.orderId ? "client_order_rework" : "training_rework",
        status: regenerated ? "completed" : "skipped",
        inputSummary: `${digital.id} needed rework: ${short(digital.operatorFeedback ?? "no feedback text")}`,
        outputSummary: regenerated ? `Regenerated output and returned it to review with score ${regenerated.qualityScore}.` : "No regeneration happened; item was not in needs_rework state.",
        ...regenerated ? { outputId: regenerated.id } : {},
        constraintsApplied: constraints,
        startedAt: stepStartedAt
      }));
    }
    if (openOrders.length === 0 && reworksRegenerated.length === 0) {
      const before = store2.getDailyDigitalsForDate(today).filter((d) => !d.orderId).length;
      const digitals = await runDailyMissions(store2, today);
      const newDigitals = digitals.filter((d) => !knownOutputIds.has(d.id));
      trainingCreated = newDigitals.length;
      for (const digital of newDigitals) {
        outputsCreated.push(digital.id);
        knownOutputIds.add(digital.id);
        const mission = store2.snapshot().dailyMissions.find((m) => m.outputId === digital.id);
        steps.push(completedStep({
          agentId: digital.createdByAgentId,
          department: digital.department,
          jobType: "daily_training_mission",
          inputSummary: `Training quota ${before}/5 for ${today}; selected ${digital.department}/${digital.taskType ?? "unknown-task"}.`,
          outputSummary: `Created ${digital.type} for daily review with score ${digital.qualityScore}.`,
          outputId: digital.id,
          constraintsApplied: mission?.constraints ?? []
        }));
      }
    }
    mode = ordersProduced.length > 0 ? "CLIENT_MODE" : reworksRegenerated.length > 0 ? "REWORK_MODE" : trainingCreated > 0 ? "NO_CLIENT_TRAINING_MODE" : "IDLE";
    const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    const reason = mode === "IDLE" ? idleReason(store2, today) : void 0;
    const next = nextOperatorAction(store2);
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      inputSummary: directorInput,
      outputSummary: reason ? `Cycle idle: ${reason}` : `Cycle completed in ${mode}.`,
      ...reason ? { constraintsApplied: [reason] } : {},
      startedAt
    }));
    store2.addWorkRun({
      id: `fwr-${randomUUID6().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "completed",
      trigger,
      steps,
      outputsCreated,
      ...reason ? { idleReason: reason } : {},
      nextOperatorAction: next
    });
    if (ordersProduced.length + reworksRegenerated.length + trainingCreated > 0) {
      store2.addEvent({
        id: randomUUID6(),
        timestamp: finishedAt,
        agentId: "N",
        eventType: "factory.cycle",
        detail: `mode=${mode} orders=${ordersProduced.length} reworks=${reworksRegenerated.length} training=${trainingCreated}`
      });
    }
    return { mode, ordersProduced, reworksRegenerated, trainingCreated };
  } catch (err) {
    const finishedAt = (/* @__PURE__ */ new Date()).toISOString();
    const message = err instanceof Error ? err.message : String(err);
    steps.unshift(completedStep({
      agentId: "N",
      jobType: "cycle_arbitration",
      status: "failed",
      inputSummary: directorInput,
      outputSummary: `Cycle failed: ${short(message)}`,
      startedAt
    }));
    store2.addWorkRun({
      id: `fwr-${randomUUID6().slice(0, 8)}`,
      startedAt,
      finishedAt,
      mode,
      status: "failed",
      trigger,
      steps,
      outputsCreated,
      idleReason: `Cycle failed: ${message}`,
      nextOperatorAction: "Sprawd\u017A nieudany cykl fabryki"
    });
    throw err;
  }
}

// packages/factory-core/src/packs.ts
import { randomUUID as randomUUID7 } from "node:crypto";
function firstParagraph(text, max = 320) {
  const stripped = text.replace(/^SERVICE:.*\n?CLIENT:.*\n?URGENCY:.*\n+/m, "");
  const para = stripped.split(/\n\n/).find((p) => p.trim().length > 40) ?? stripped;
  const clean = para.replace(/^━━ .+ ━━\n+/m, "").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}
function createDeliveryPack(store2, outputId) {
  const digital = store2.getDailyDigital(outputId);
  if (!digital?.orderId) return void 0;
  const order = store2.getOrder(digital.orderId);
  if (!order) return void 0;
  const existing = store2.snapshot().deliveryPacks.find((p) => p.sourceOutputId === outputId);
  if (existing) return existing;
  const service = order.serviceId ? getServiceDefinition(order.serviceId) : void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const pack = {
    id: `pack-${randomUUID7().slice(0, 8)}`,
    orderId: order.id,
    sourceOutputId: outputId,
    clientName: order.clientName,
    ...order.serviceId ? { serviceId: order.serviceId } : {},
    serviceName: order.serviceName ?? service?.name ?? `${order.department} deliverable`,
    date: now.slice(0, 10),
    executiveSummary: firstParagraph(digital.content),
    mainDeliverable: digital.content,
    recommendations: service ? service.expectedDeliverables.map((d) => `Deliverable covered: ${d}`) : [`Review the ${order.department} output against the client brief before delivery.`],
    nextSteps: service ? service.reviewSteps : ["Operator review", "Personalise for the client", "Deliver through your own channel"],
    safetyNote: service?.safetyNotes ?? "Internal artifact. The factory never sends anything \u2014 the operator delivers manually after review.",
    status: "draft",
    revisionCount: digital.revisionCount,
    createdAt: now,
    updatedAt: now
  };
  store2.addDeliveryPack(pack);
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: DEPT_AGENT[order.department],
    eventType: "pack.created",
    detail: `${pack.id} from ${outputId} for ${order.clientName} (${pack.serviceName})`
  });
  return pack;
}
function approveDeliveryPack(store2, packId) {
  const pack = store2.getDeliveryPack(packId);
  if (!pack || pack.status !== "draft") return void 0;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDeliveryPack(packId, { status: "approved", updatedAt: now });
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.approved",
    detail: `Operator approved ${packId} for ${pack.clientName}`
  });
  return store2.getDeliveryPack(packId);
}
function warehouseDeliveryPack(store2, packId) {
  const pack = store2.getDeliveryPack(packId);
  if (!pack || pack.status !== "approved") return void 0;
  const order = store2.getOrder(pack.orderId);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  store2.updateDeliveryPack(packId, { status: "warehouse_ready", updatedAt: now });
  const record = {
    id: `case-${randomUUID7().slice(0, 8)}`,
    clientName: pack.clientName,
    ...pack.serviceId ? { serviceId: pack.serviceId } : {},
    serviceName: pack.serviceName,
    problem: order?.description ?? "(order record missing)",
    outputSummary: pack.executiveSummary,
    status: "closed_ready",
    createdAt: now,
    deliveryPackId: pack.id,
    followUpSuggestion: `Check in with ${pack.clientName} 7 days after delivery: did the ${pack.serviceName} land, and is there a follow-on scope?`
  };
  store2.addCaseRecord(record);
  store2.addEvent({
    id: randomUUID7(),
    timestamp: now,
    agentId: "N",
    eventType: "pack.warehoused",
    detail: `${packId} warehouse_ready; case ${record.id} recorded for ${pack.clientName}`
  });
  return record;
}
function renderPackMarkdown(pack) {
  return `# ${pack.serviceName}

**Client:** ${pack.clientName}
**Date:** ${pack.date}
**Status:** ${pack.status} \xB7 revision ${pack.revisionCount}

## Executive Summary

${pack.executiveSummary}

## Main Deliverable

${pack.mainDeliverable}

## Recommendations

${pack.recommendations.map((r) => `- ${r}`).join("\n")}

## Next Steps

${pack.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}

---
*Safety note: ${pack.safetyNote}*
*Internal artifact ${pack.id} (source ${pack.sourceOutputId}, order ${pack.orderId}). The operator delivers this \u2014 the factory never sends.*`;
}

// packages/factory-core/src/production-line.ts
var STATION_DEFS = [
  { id: "intake", name: "Przyj\u0119cie", agentId: "N", purpose: "Odczytuje kontekst zlecenia/treningu/us\u0142ugi i wybiera \u015Bcie\u017Ck\u0119 produkcji" },
  { id: "research", name: "Badania", agentId: "RA", purpose: "Wyodr\u0119bnia kontekst, ryzyka, za\u0142o\u017Cenia, odbiorc\xF3w, niewiadome" },
  { id: "strategy", name: "Strategia", agentId: "SA", purpose: "Definiuje k\u0105t komercyjny, logik\u0119 oferty, argument dla klienta" },
  { id: "content", name: "Tre\u015B\u0107", agentId: "MA", purpose: "Tworzy szkic w\u0142a\u015Bciwych sekcji deliverabla" },
  { id: "delivery", name: "Realizacja", agentId: "DA", purpose: "Zamienia surow\u0105 prac\u0119 w u\u017Cyteczny artefakt dla klienta / plan wdro\u017Cenia" },
  { id: "qa", name: "QA", agentId: "QAA", purpose: "Sprawdza bezpiecze\u0144stwo, jasno\u015B\u0107, brakuj\u0105ce sekcje, ryzyka operatora" },
  { id: "packaging", name: "Pakowanie", agentId: "N", purpose: "Przygotowuje pakiet dostawy / kandydata do magazynu" },
  { id: "operator_review", name: "Przegl\u0105d Operatora", agentId: "N", purpose: "Cz\u0142owiek-operator: zatwierdza, poprawia, odrzuca, magazynuje (God Layer)" }
];
var DEPT_STATION = {
  research: "research",
  sales: "strategy",
  marketing: "content",
  delivery: "delivery",
  qa: "qa"
};
function short2(text, max = 140) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
function agentName(id) {
  try {
    return getAgent(id).name;
  } catch {
    return id;
  }
}
function clientOrderTask(order, digital) {
  const station = DEPT_STATION[order.department];
  const agentId = STATION_DEFS.find((s) => s.id === station).agentId;
  let status;
  let nextStation;
  let nextOperatorAction2;
  if (!digital) {
    status = "queued";
    nextStation = station;
    nextOperatorAction2 = "Uruchom cykl, by wyprodukowa\u0107 deliverable tego zlecenia";
  } else if (digital.status === "needs_rework") {
    status = "blocked";
    nextStation = station;
    nextOperatorAction2 = "Uruchom cykl, by odtworzy\u0107 oznaczony deliverable";
  } else if (digital.status === "draft_ready") {
    status = "waiting_review";
    nextStation = "operator_review";
    nextOperatorAction2 = "Przejrzyj wynik klienta \u2192 Zatwierd\u017A do Pakietu Dostawy, Popraw lub Odrzu\u0107";
  } else {
    status = "completed";
    nextStation = "packaging";
    nextOperatorAction2 = "Utw\xF3rz / przenie\u015B dalej pakiet dostawy";
  }
  return {
    id: `plt-order-${order.id}`,
    source: "client",
    station,
    status,
    agentId,
    agentName: agentName(agentId),
    department: order.department,
    title: order.serviceName ? `${order.serviceName} \u2014 ${order.clientName}` : `${order.department} \u2014 ${order.clientName}`,
    inputSummary: short2(order.description),
    outputSummary: digital ? short2(digital.title, 120) : "Jeszcze nie wyprodukowano",
    ...digital ? { outputId: digital.id } : {},
    orderId: order.id,
    clientName: order.clientName,
    ...order.serviceName ? { serviceName: order.serviceName } : {},
    revisionCount: order.revisionCount,
    ...digital ? { qualityScore: digital.qualityScore } : {},
    ...nextStation ? { nextStation } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function trainingTask(d) {
  const station = DEPT_STATION[d.department];
  let status;
  let nextOperatorAction2;
  if (d.status === "needs_rework") {
    status = "blocked";
    nextOperatorAction2 = "Uruchom cykl, by odtworzy\u0107 ten szkic treningowy";
  } else if (d.status === "draft_ready") {
    status = "waiting_review";
    nextOperatorAction2 = "Zaakceptuj, Zmagazynuj, Popraw lub Odrzu\u0107 ten zas\xF3b treningowy";
  } else if (d.status === "rejected") {
    status = "skipped";
    nextOperatorAction2 = "Odrzucono \u2014 nie wymaga akcji";
  } else {
    status = "completed";
    nextOperatorAction2 = d.location === "warehouse" ? "Zmagazynowano \u2014 nie wymaga akcji" : "Zaakceptowano \u2014 nie wymaga akcji";
  }
  return {
    id: `plt-train-${d.id}`,
    source: "training",
    station,
    status,
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: short2(d.title, 120),
    inputSummary: `Dzienna misja treningowa \u2014 ${d.department}/${d.taskType ?? "task"} (${d.date})`,
    outputSummary: `${d.type} \xB7 wynik ${d.qualityScore}`,
    outputId: d.id,
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    ...d.status === "draft_ready" ? { nextStation: "operator_review" } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function reworkTask(d, order) {
  const station = DEPT_STATION[d.department];
  return {
    id: `plt-rework-${d.id}`,
    source: "rework",
    station,
    status: "blocked",
    agentId: d.createdByAgentId,
    agentName: agentName(d.createdByAgentId),
    department: d.department,
    title: `Poprawka: ${short2(d.title, 100)}`,
    inputSummary: `Feedback operatora: ${short2(d.operatorFeedback ?? "(brak tekstu)", 120)}`,
    outputSummary: `Oczekuje na odtworzenie (obecnie rev ${d.revisionCount})`,
    outputId: d.id,
    ...d.orderId ? { orderId: d.orderId } : {},
    ...order ? { clientName: order.clientName } : {},
    ...order?.serviceName ? { serviceName: order.serviceName } : {},
    revisionCount: d.revisionCount,
    qualityScore: d.qualityScore,
    constraintsApplied: [
      ...order ? [`Brief klienta od ${order.clientName}: ${short2(order.description, 100)}`] : [],
      ...d.operatorFeedback ? [d.operatorFeedback] : []
    ],
    nextStation: station,
    nextOperatorAction: "Uruchom cykl, by zastosowa\u0107 feedback i odtworzy\u0107"
  };
}
function packTask(p) {
  let status;
  let nextStation;
  let nextOperatorAction2;
  if (p.status === "draft") {
    status = "ready_for_operator";
    nextStation = "operator_review";
    nextOperatorAction2 = "Zatwierd\u017A pakiet dostawy na /delivery";
  } else if (p.status === "approved") {
    status = "ready_for_operator";
    nextStation = "operator_review";
    nextOperatorAction2 = "Zmagazynuj zatwierdzony pakiet \u2192 tworzy kart\u0119 sprawy";
  } else {
    status = "completed";
    nextOperatorAction2 = "gotowe do magazynu \u2014 skopiuj pakiet i dostarcz go samodzielnie";
  }
  return {
    id: `plt-pack-${p.id}`,
    source: "delivery_pack",
    station: "packaging",
    status,
    agentId: "N",
    agentName: agentName("N"),
    title: `${p.serviceName} \u2014 ${p.clientName}`,
    inputSummary: `Wyj\u015Bcie \u017Ar\xF3d\u0142owe ${p.sourceOutputId} (zlecenie ${p.orderId})`,
    outputSummary: short2(p.executiveSummary, 140),
    outputId: p.sourceOutputId,
    orderId: p.orderId,
    clientName: p.clientName,
    serviceName: p.serviceName,
    packId: p.id,
    revisionCount: p.revisionCount,
    ...nextStation ? { nextStation } : {},
    nextOperatorAction: nextOperatorAction2
  };
}
function stationStatus(id, tasks) {
  if (tasks.length === 0) {
    if (id === "operator_review" || id === "packaging" || id === "intake") return "idle";
    return "idle";
  }
  if (tasks.some((t) => t.status === "blocked")) return "blocked";
  if (tasks.some((t) => t.status === "waiting_review")) return "waiting_review";
  if (tasks.some((t) => t.status === "ready_for_operator")) return "ready_for_operator";
  if (tasks.some((t) => t.status === "queued")) return "queued";
  if (tasks.some((t) => t.status === "completed")) return "completed";
  return "idle";
}
function deriveProductionLine(state, ctx) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const orderById = new Map(state.orders.map((o) => [o.id, o]));
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]));
  const clientLine = [...state.orders].reverse().map((o) => clientOrderTask(o, o.deliverableId ? digitalById.get(o.deliverableId) : void 0));
  const trainingLine = state.dailyDigitals.filter((d) => !d.orderId && d.date === today).map(trainingTask);
  const reworkLine = state.dailyDigitals.filter((d) => d.status === "needs_rework").map((d) => reworkTask(d, d.orderId ? orderById.get(d.orderId) : void 0));
  const deliveryPackLine = [...state.deliveryPacks].reverse().map(packTask);
  const allTasks = [...clientLine, ...trainingLine, ...reworkLine, ...deliveryPackLine];
  const stations = STATION_DEFS.map((def) => {
    let tasks;
    if (def.id === "operator_review") {
      tasks = allTasks.filter((t) => t.status === "waiting_review" || t.status === "ready_for_operator");
    } else if (def.id === "packaging") {
      tasks = deliveryPackLine;
    } else if (def.id === "intake") {
      tasks = clientLine.length + trainingLine.length > 0 ? [{
        id: "plt-intake",
        source: "client",
        station: "intake",
        status: "completed",
        agentId: "N",
        agentName: agentName("N"),
        title: "Przyj\u0119cie i wyb\xF3r \u015Bcie\u017Cki",
        inputSummary: `Zlecenia: ${state.orders.length}, zadania treningowe dzi\u015B: ${trainingLine.length}`,
        outputSummary: `Tryb ${ctx.mode}; \u015Bcie\u017Cki produkcji przypisane do stacji producent\xF3w`,
        nextOperatorAction: ctx.nextOperatorAction
      }] : [];
    } else {
      tasks = allTasks.filter((t) => t.station === def.id);
    }
    const status = stationStatus(def.id, tasks);
    const producerIds = ["research", "strategy", "content", "delivery", "qa"];
    const foldedSkip = tasks.length === 0 && producerIds.includes(def.id) && allTasks.some((t) => t.source === "client" || t.source === "training");
    const lastTask = tasks[tasks.length - 1];
    const quarantined = state.integrity.some(
      (r) => r.status === "quarantined" && r.agentId === def.agentId
    );
    return {
      id: def.id,
      name: def.name,
      agentId: def.agentId,
      purpose: def.purpose,
      status: quarantined ? "blocked" : foldedSkip ? "skipped" : status,
      ...lastTask ? { lastTask } : {},
      taskCount: tasks.length
    };
  });
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    mode: ctx.mode,
    autopilotEnabled: ctx.autopilotEnabled,
    safeMode: true,
    trainingToday: ctx.trainingToday,
    activeClientOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production" || o.status === "ready_for_review").length,
    deliveryPacks: {
      draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
      approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
      warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length
    },
    nextOperatorAction: ctx.nextOperatorAction,
    stations,
    trainingLine,
    clientLine,
    reworkLine,
    deliveryPackLine
  };
}

// tests/factory-serve.ts
import { randomUUID as randomUUID8 } from "node:crypto";
var PORT = Number(process.env["PORT"] ?? 7778);
var ON_VERCEL = Boolean(process.env["VERCEL"]);
var DATA_DIR = process.env["FACTORY_DATA_DIR"] ?? (ON_VERCEL ? "/tmp/.factory-data" : join2(process.cwd(), ".factory-data"));
if (!existsSync2(DATA_DIR)) mkdirSync2(DATA_DIR, { recursive: true });
var store = new FactoryStore(DATA_DIR);
var autopilotEnabled = store.getAutopilotEnabled();
var lastCycleSummary = "jeszcze nieuruchomiony";
var VALID_DEPARTMENTS = ["marketing", "sales", "delivery", "research", "qa"];
var DEMO_CLIENTS = [
  {
    key: "hvac",
    clientName: "HVAC TestCo",
    serviceId: "svc-ai-workflow-audit",
    language: "EN",
    description: "We install and maintain HVAC systems. We need a simple workflow to handle inbound leads, quote follow-ups, and maintenance plan objections."
  },
  {
    key: "brighthire",
    clientName: "BrightHire Agency",
    serviceId: "svc-recruitment-ops-audit",
    language: "EN",
    description: "We are a 12-person recruitment agency. Candidates go cold between screening and client submission and we lose placements to slow feedback."
  },
  {
    key: "neonblocks",
    clientName: "NeonBlocks Studio",
    serviceId: "svc-social-pack",
    language: "EN",
    description: "Indie game studio. We know we should post but never have content ready. Need a carousel pack about our build-in-public journey."
  },
  {
    key: "builderpro",
    clientName: "Local Builder Pro",
    serviceId: "svc-landing-audit",
    language: "EN",
    description: "Local construction firm. Our landing page gets visits from ads but almost no enquiry form submissions."
  }
];
function productionLineFor(state) {
  const ops = deriveOps(state);
  return deriveProductionLine(state, {
    mode: ops.mode,
    autopilotEnabled,
    nextOperatorAction: ops.nextActionTitle,
    trainingToday: `${ops.trainingToday}/5`
  });
}
var E = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var plPreview = (text, max = 60) => text.length > max ? `${text.slice(0, max)}...` : text;
var badge = (text, cls) => `<span class="badge ${cls}">${E(text)}</span>`;
var STATUS_LABELS = {
  new: "nowe",
  in_production: "w produkcji",
  ready_for_review: "gotowe do przegl\u0105du",
  approved: "zatwierdzone",
  closed: "zamkni\u0119te",
  rejected: "odrzucone",
  draft: "szkic",
  draft_ready: "szkic gotowy",
  accepted: "zaakceptowane",
  needs_rework: "wymaga poprawek",
  archived: "zarchiwizowane",
  warehouse_ready: "gotowe do magazynu",
  warehoused: "zmagazynowane",
  pending: "oczekuj\u0105ce",
  healthy: "zdrowy",
  watch: "obserwacja",
  quarantined: "kwarantanna",
  completed: "zako\u0144czone",
  waiting_review: "czeka na przegl\u0105d",
  ready_for_operator: "czeka na operatora",
  blocked: "zablokowane",
  queued: "w kolejce",
  skipped: "pomini\u0119te",
  idle: "bezczynne",
  warehouse: "magazyn",
  trash: "kosz",
  training: "trening",
  rework: "poprawka",
  "client order": "zlecenie klienta",
  client: "zlecenie klienta",
  delivery_pack: "pakiet dostawy",
  "pack draft": "szkic pakietu",
  "pack approved": "pakiet zatwierdzony",
  failed: "nieudane"
};
var statusLabel = (s) => STATUS_LABELS[s] ?? s;
var MODE_LABELS = {
  CLIENT_MODE: "TRYB KLIENTA",
  REWORK_MODE: "TRYB POPRAWEK",
  NO_CLIENT_TRAINING_MODE: "TRYB TRENINGOWY",
  IDLE: "BEZCZYNNY"
};
var modeLabel = (m) => MODE_LABELS[m] ?? m;
var DEPARTMENT_LABELS = {
  marketing: "Marketing",
  sales: "Sprzeda\u017C",
  delivery: "Realizacja",
  research: "Badania",
  qa: "QA"
};
var departmentLabel = (d) => DEPARTMENT_LABELS[d] ?? d;
var STATION_ID_LABELS = {
  intake: "Przyj\u0119cie",
  research: "Badania",
  strategy: "Strategia",
  content: "Tre\u015B\u0107",
  delivery: "Realizacja",
  qa: "QA",
  packaging: "Pakowanie",
  operator_review: "Przegl\u0105d Operatora"
};
var stationIdLabel = (s) => STATION_ID_LABELS[s] ?? s;
var nav = (active) => {
  const links = [
    ["/admin", "Kokpit"],
    ["/", "Fabryka"],
    ["/factory-run", "Start Dnia"],
    ["/production-line", "Linia Produkcyjna"],
    ["/orders", "Zlecenia"],
    ["/delivery", "Dostawy"],
    ["/leads", "Leady"],
    ["/warehouse", "Magazyn"],
    ["/trash", "Kosz"],
    ["/events", "Zdarzenia"],
    ["/daily-review", "Przegl\u0105d Dzienny"]
  ];
  return `<nav class="nav">${links.map(([href, label]) => `<a href="${href}" class="${active === href ? "active" : ""}">${label}</a>`).join("")}</nav>`;
};
var layout = (title, activePath, body) => `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rdze\u0144 Fabryki \u2014 ${E(title)}</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1117;color:#e6edf3;font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px 60px}
.nav{display:flex;gap:4px;margin-bottom:24px;border-bottom:1px solid #21262d;padding-bottom:8px}
.nav a{color:#8b949e;text-decoration:none;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:500}
.nav a:hover,.nav a.active{background:#21262d;color:#e6edf3}
h1{font-size:20px;font-weight:600;margin-bottom:4px}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#8b949e;margin:22px 0 8px}
.sub{color:#8b949e;font-size:13px;margin-bottom:18px}
.stats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.stat{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:8px 14px;min-width:90px}
.stat .v{font-size:18px;font-weight:600}
.stat .l{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e}
table{width:100%;border-collapse:collapse;background:#161b22;border:1px solid #21262d;border-radius:8px;overflow:hidden;margin-bottom:16px}
th,td{text-align:left;padding:7px 11px;border-bottom:1px solid #21262d;vertical-align:top}
th{font-size:10.5px;text-transform:uppercase;letter-spacing:.5px;color:#8b949e;background:#11161d}
tr:last-child td{border-bottom:none}
.mono{font-family:ui-monospace,monospace;font-size:12px}
.dim{color:#8b949e}
.badge{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid transparent}
.badge.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
.badge.warn{background:#34270a;color:#d29922;border-color:#4d3c14}
.badge.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.badge.muted{background:#21262d;color:#8b949e;border-color:#30363d}
.badge.info{background:#0f2740;color:#58a6ff;border-color:#1c3a5e}
.v.ok{color:#3fb950}.v.warn{color:#d29922}.v.bad{color:#f85149}.v.info{color:#58a6ff}
.form-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:18px}
.form-card label{display:block;font-size:12px;color:#8b949e;margin-bottom:4px}
textarea{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px/1.5 ui-sans-serif,system-ui,sans-serif;padding:8px 10px;resize:vertical;min-height:80px}
button{cursor:pointer;border-radius:6px;border:1px solid #30363d;background:#21262d;color:#e6edf3;padding:5px 14px;font-size:13px;font-weight:600}
button.ok{background:#11321f;color:#3fb950;border-color:#234b2e}
button.bad{background:#3a1418;color:#f85149;border-color:#5a1e23}
.offer-pre{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:8px;font-size:12px;color:#c9d1d9;max-height:200px;overflow-y:auto;margin:4px 0}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.flash{background:#11321f;border:1px solid #234b2e;border-radius:6px;padding:10px 14px;margin-bottom:14px;color:#3fb950;font-size:13px}
.flash.bad{background:#3a1418;border-color:#5a1e23;color:#f85149}
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:16px}
.agent-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:10px 12px}
.daily-card{background:#161b22;border:1px solid #21262d;border-radius:8px;padding:14px;margin-bottom:14px}
.daily-card.draft{border-left:3px solid #58a6ff}
.daily-card.accepted{border-left:3px solid #3fb950}
.daily-card.needs_rework{border-left:3px solid #d29922}
.daily-card.rejected{border-left:3px solid #f85149}
.daily-card.archived{border-left:3px solid #8b949e}
.daily-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.daily-title{font-weight:600;font-size:14px}
.daily-content{white-space:pre-wrap;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:10px;font-size:12px;color:#c9d1d9;max-height:320px;overflow-y:auto;margin:8px 0 10px}
.daily-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.feedback-area{display:flex;flex-direction:column;gap:4px;flex:1;min-width:200px}
.score-bar{display:inline-block;width:60px;height:6px;border-radius:3px;background:#21262d;vertical-align:middle;margin-left:4px;overflow:hidden}
.score-fill{height:100%;border-radius:3px}
.agent-card .aid{font-weight:700;font-size:15px;color:#58a6ff;margin-right:6px}
.agent-card .aname{font-weight:600;font-size:13px}
.agent-card .arole{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px}
.agent-card .afield{font-size:11.5px;color:#8b949e;margin-top:2px}
.agent-card .afield span{color:#c9d1d9}
.admin-shell{position:relative;display:flex;flex-direction:column;gap:14px}
.admin-shell:before{content:"";position:absolute;inset:-18px -16px auto;height:220px;background:linear-gradient(135deg,rgba(255,45,209,.16),rgba(0,245,255,.12) 46%,rgba(255,184,0,.08));filter:blur(18px);opacity:.75;pointer-events:none}
.admin-hero,.admin-panel,.admin-card,.admin-action{position:relative;background:rgba(13,17,23,.88);border:1px solid rgba(0,245,255,.28);box-shadow:0 0 0 1px rgba(255,45,209,.08),0 18px 46px rgba(0,0,0,.28)}
.admin-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(230px,.65fr);gap:18px;border-radius:8px;padding:18px;overflow:hidden}
.admin-hero:after{content:"OSA//CTRL";position:absolute;right:14px;top:8px;color:rgba(255,45,209,.18);font:800 44px/1 ui-monospace,monospace;letter-spacing:4px;transform:rotate(-4deg)}
.admin-kicker{color:#00f5ff;font:700 11px/1 ui-monospace,monospace;letter-spacing:1.8px;text-transform:uppercase;margin-bottom:8px}
.admin-title{font-size:30px;line-height:1.05;font-weight:800;margin:0 0 8px;color:#f5fbff;text-shadow:0 0 22px rgba(0,245,255,.24)}
.admin-sub{max-width:700px;color:#a9b7c5;font-size:13px}
.admin-mode{display:flex;flex-direction:column;gap:8px;align-items:flex-start;justify-content:flex-end}
.admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.admin-card{border-radius:8px;padding:12px;min-height:86px}
.admin-card .v{font-size:24px;font-weight:800}
.admin-card .l{font-size:10px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.7px;margin-top:2px}
.admin-panel{border-radius:8px;padding:14px}
.admin-subpanel{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:12px}
.admin-panel.hot{border-color:rgba(255,184,0,.5);background:linear-gradient(135deg,rgba(52,39,10,.82),rgba(13,17,23,.92))}
.admin-panel.danger{border-color:rgba(248,81,73,.55)}
.admin-panel h2{margin-top:0;color:#f5fbff}
.admin-action{border-radius:8px;padding:14px;border-color:rgba(255,45,209,.28)}
.admin-action strong{display:block;font-size:16px;margin-bottom:4px;color:#fff}
.admin-two{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(320px,.9fr);gap:14px}
.admin-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.admin-list{display:flex;flex-direction:column;gap:10px}
.admin-order{background:#10151d;border:1px solid #273241;border-left:3px solid #00f5ff;border-radius:8px;padding:12px}
.admin-order.ready{border-left-color:#ffb800}.admin-order.done{border-left-color:#3fb950}.admin-order.bad{border-left-color:#f85149}
.admin-input-row{display:grid;grid-template-columns:1fr 1fr 150px;gap:8px;margin-bottom:8px}
.admin-input-row input,.admin-input-row select,.admin-panel input,.admin-panel select{width:100%;background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,system-ui,sans-serif;padding:7px 10px}
.admin-panel textarea{background:#0a0f16;border-color:#334155}
.admin-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.admin-actions form{display:flex;gap:6px;flex-wrap:wrap;align-items:flex-start}
.admin-actions input{background:#0a0f16;border:1px solid #334155;border-radius:6px;color:#e6edf3;font:12px ui-sans-serif,system-ui,sans-serif;padding:6px 8px;min-width:190px}
.admin-preview{white-space:pre-wrap;background:#070b11;border:1px solid #263241;border-radius:6px;padding:9px;font-size:12px;color:#dbe7f0;max-height:180px;overflow:auto;margin-top:8px}
.admin-table{background:rgba(10,15,22,.88)}
.admin-safety{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.admin-safety ul{margin:0;padding-left:18px;color:#a9b7c5;font-size:12.5px}
.admin-safety li{margin:4px 0}
.workroom-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.work-agent{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;min-height:138px}
.work-agent.active{border-color:rgba(0,245,255,.55)}.work-agent.waiting{border-color:rgba(255,184,0,.45)}.work-agent.failed{border-color:rgba(248,81,73,.55)}
.work-agent .name{font-weight:800;color:#f5fbff;margin-bottom:4px}
.work-agent .meta{font-size:11px;color:#a9b7c5;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.work-agent .line{font-size:12px;color:#dbe7f0;margin-top:5px}
.timeline{display:flex;flex-direction:column;gap:8px;margin-top:10px}
.timeline-step{background:#070b11;border:1px solid #263241;border-left:3px solid #00f5ff;border-radius:8px;padding:10px}
.timeline-step.failed{border-left-color:#f85149}.timeline-step.skipped{border-left-color:#8b949e}
.idle-box{background:rgba(52,39,10,.55);border:1px solid rgba(255,184,0,.42);border-radius:8px;padding:12px;color:#f0d28a}
.idle-box .kicker{font-size:10.5px;text-transform:uppercase;letter-spacing:.7px;color:#d29922;margin-bottom:4px}
.run-drill{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:8px 12px;margin-bottom:8px}
.run-drill summary{cursor:pointer;font-size:12.5px;color:#dbe7f0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.run-drill[open]{border-color:rgba(0,245,255,.45)}
.station-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.station{background:#0b1119;border:1px solid #263241;border-radius:8px;padding:11px;border-top:3px solid #30363d}
.station.completed{border-top-color:#3fb950}.station.waiting_review{border-top-color:#d29922}.station.ready_for_operator{border-top-color:#58a6ff}
.station.blocked{border-top-color:#f85149}.station.queued{border-top-color:#a371f7}.station.skipped{border-top-color:#8b949e;opacity:.7}.station.idle{opacity:.55}
.station .sname{font-weight:800;color:#f5fbff;font-size:13px}
.station .sagent{font-size:10.5px;color:#00f5ff;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.station .spurpose{font-size:11px;color:#8b949e;margin-bottom:6px;min-height:28px}
.station .sline{font-size:11.5px;color:#dbe7f0;margin-top:3px}
.pl-task{background:#0b1119;border:1px solid #263241;border-radius:8px;border-left:3px solid #30363d;padding:10px;margin-bottom:8px}
.pl-task.waiting_review{border-left-color:#d29922}.pl-task.blocked{border-left-color:#f85149}.pl-task.ready_for_operator{border-left-color:#58a6ff}.pl-task.completed{border-left-color:#3fb950}.pl-task.queued{border-left-color:#a371f7}.pl-task.skipped{border-left-color:#8b949e}
@media (max-width:860px){.station-board{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:560px){.station-board{grid-template-columns:1fr}}
.run-drill .drill-body{margin-top:8px;border-top:1px solid #263241;padding-top:8px}
.wait-items{margin:8px 0 0;padding-left:18px;color:#a9b7c5;font-size:12px}
.wait-items li{margin:3px 0}
.wait-items a{color:#58a6ff}
.admin-table a{color:#58a6ff;text-decoration:none}
@media (max-width:860px){
  .admin-hero,.admin-two,.admin-safety{grid-template-columns:1fr}
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .admin-input-row{grid-template-columns:1fr}
}
@media (max-width:560px){
  .admin-grid,.admin-three,.workroom-grid{grid-template-columns:1fr}
  .admin-title{font-size:24px}
  .admin-hero{padding:14px}
}
</style>
</head>
<body>
<div class="wrap">
${nav(activePath)}
${body}
</div>
</body>
</html>`;
function renderFactory(state, flash) {
  const pending = state.approvalQueue.filter((a) => a.status === "pending");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const agentRows = [
    ["A", "Oficer Przyj\u0119cia Sygna\u0142u", "intake", "Sygna\u0142y JobQueue", "IntakeBrief"],
    ["B", "Kwalifikator ICP", "qualification", "IntakeBriefs", "QualifiedLead / Trash"],
    ["C", "Wzbogacacz Lead\xF3w", "enrichment", "QualifiedLeads", "EnrichedLead"],
    ["D", "Strateg Oferty", "strategy", "EnrichedLeads", "OfferStrategy"],
    ["E", "Budowniczy Oferty", "offer-builder", "OfferStrategies", "DraftOffer"],
    ["F", "Ewaluator Oferty", "evaluation", "DraftOffers", "ScoredOffer"],
    ["G", "Redaktor Oferty", "editing", "Nieudane ScoredOffers", "Poprawiony DraftOffer"],
    ["H", "Stra\u017Cnik Zatwierdze\u0144", "approval-gate", "Zaliczone ScoredOffers", "ApprovalItem (oczekuj\u0105ce)"],
    ["I", "Monitor Zatwierdze\u0144", "routing", "Zatwierdzone pozycje", "WarehouseItem"],
    ["J", "Obserwator Sukcesji", "succession", "Wszyscy agenci", "SuccessionFlag"],
    ["K", "Tropiciel Rodowodu", "lineage", "SuccessionFlags", "SuccessionBrief"],
    ["L", "Audytor Jako\u015Bci", "quality", "WarehouseItems", "QualityMetric"],
    ["M", "Reporter Wydajno\u015Bci", "reporting", "QualityMetrics", "Scorecard"],
    ["N", "Dyrektor Fabryki", "direction", "Wszystkie etapy", "CorrectionBrief"]
  ];
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production").length;
  const mode = openOrders > 0 ? "CLIENT_MODE" : "NO_CLIENT_TRAINING_MODE";
  return layout("Fabryka", "/", `
<h1>Rdze\u0144 Fabryki v0.2</h1>
<p class="sub">
  Linia Pozyskiwania Ofert + Zlecenia Klient\xF3w + Trening Dzienny \u2014 zgoda operatora wymagana zanim cokolwiek wyjdzie na zewn\u0105trz \xB7
  ${badge(modeLabel(mode), openOrders > 0 ? "warn" : "info")} \xB7
  ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "muted")}
  <span class="dim" style="font-size:11px">ostatni cykl: ${E(lastCycleSummary)}</span>
</p>
<form method="POST" action="/api/autopilot" style="margin-bottom:14px">
  <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
  <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wzn\xF3w Autopilota"}</button>
</form>
${flashHtml}
<div class="stats">
  <div class="stat"><div class="v info">${state.signals.length}</div><div class="l">Sygna\u0142y</div></div>
  <div class="stat"><div class="v ok">${state.leads.filter((l) => l.qualified).length}</div><div class="l">Zakwalifikowane</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Oczekuj\u0105ce</div></div>
  <div class="stat"><div class="v ok">${state.warehouse.length}</div><div class="l">Magazyn</div></div>
  <div class="stat"><div class="v muted">${state.trash.length}</div><div class="l">Kosz</div></div>
  <div class="stat"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia</div></div>
</div>

<div class="form-card">
  <label>Zg\u0142o\u015B sygna\u0142 \u2014 opisz prospekta lub problem biznesowy (tylko wej\u015Bcie operatora)</label>
  <form method="POST" action="/api/signal">
    <textarea name="raw" placeholder="np. Za\u0142o\u017Cyciel B2B SaaS, seed stage, s\u0142aby pipeline, MRR utkn\u0105\u0142 na $30K. Potrzebna oferta outboundowa." required></textarea>
    <div style="margin-top:8px"><button type="submit">Uruchom Pipeline \u2192</button></div>
  </form>
</div>

<h2>Kolejka Zatwierdze\u0144 (${pending.length} oczekuj\u0105cych)</h2>
${pending.length === 0 ? '<p class="dim">Brak ofert oczekuj\u0105cych na zatwierdzenie.</p>' : pending.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("pending"), "warn")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygna\u0142: ${E(item.signalId)} \xB7 wynik: ${item.finalOffer.score} \xB7 iteracje: ${item.finalOffer.iterations}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div class="actions" style="margin-top:8px">
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="approve"><input type="hidden" name="id" value="${E(item.id)}"><button class="ok" type="submit">Zatwierd\u017A \u2192 Magazyn</button></form>
    <form method="POST" action="/api/action"><input type="hidden" name="action" value="reject"><input type="hidden" name="id" value="${E(item.id)}"><button class="bad" type="submit">Odrzu\u0107</button></form>
  </div>
</div>`).join("")}

<h2>Rejestr Agent\xF3w</h2>
<div class="agents-grid">
${agentRows.map(([id, name, role, watch, next]) => `
<div class="agent-card">
  <div><span class="aid">${E(id)}</span><span class="aname">${E(name)}</span></div>
  <div class="arole">${E(role)}</div>
  <div class="afield">Obserwuje: <span>${E(watch)}</span></div>
  <div class="afield">Dalej: <span>${E(next)}</span></div>
</div>`).join("")}
</div>`);
}
function renderLeads(state) {
  const leads = state.leads.filter((l) => l.qualified);
  return layout("Leady", "/leads", `
<h1>Zakwalifikowane Leady</h1>
<p class="sub">${leads.length} lead\xF3w przesz\u0142o kwalifikacj\u0119 ICP</p>
${leads.length === 0 ? '<p class="dim">Brak zakwalifikowanych lead\xF3w. Zg\u0142o\u015B sygna\u0142 na stronie Fabryki.</p>' : `
<table>
<thead><tr><th>ID Sygna\u0142u</th><th>Kategoria</th><th>Sygna\u0142y ICP</th><th>Wynik Dopasowania</th><th>Powody</th></tr></thead>
<tbody>
${leads.map((l) => `<tr>
  <td class="mono">${E(l.signalId)}</td>
  <td>${E(l.brief.category)}</td>
  <td class="dim">${E(l.brief.icpSignals.join(", ") || "\u2014")}</td>
  <td>${badge(String(l.fitScore), l.fitScore >= 0.75 ? "ok" : "warn")}</td>
  <td class="dim" style="font-size:12px">${E(l.qualificationReasons.join(" \xB7 "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderWarehouse(state) {
  const digitalAssets = state.dailyDigitals.filter((d) => d.location === "warehouse");
  return layout("Magazyn", "/warehouse", `
<h1>Magazyn \u2014 Zatwierdzone Wyniki</h1>
<p class="sub">${state.warehouse.length} ofert + ${digitalAssets.length} zasob\xF3w cyfrowych zatwierdzonych przez operatora \xB7 <strong style="color:#f85149">sent: false \u2014 brak automatycznej wysy\u0142ki</strong></p>

<h2>Zatwierdzone Oferty (${state.warehouse.length})</h2>
${state.warehouse.length === 0 ? '<p class="dim">Brak zatwierdzonych ofert.</p>' : state.warehouse.map((item) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(statusLabel("approved"), "ok")} <span class="mono dim">${E(item.id)}</span>
    <span class="dim" style="font-size:12px;margin-left:8px">sygna\u0142: ${E(item.signalId)} \xB7 wynik: ${item.qualityScore} \xB7 zatwierdzono: ${E(item.approvedAt.slice(0, 16).replace("T", " "))}</span>
  </div>
  <div class="offer-pre">${E(item.finalOffer.offerText)}</div>
  <div style="margin-top:6px;font-size:12px;color:#8b949e">Agent I skierowa\u0142 do magazynu. U\u017Cycie tej oferty na zewn\u0105trz wymaga dzia\u0142ania operatora.</div>
</div>`).join("")}

<h2>Zasoby Cyfrowe (${digitalAssets.length})</h2>
${digitalAssets.length === 0 ? '<p class="dim">Brak zasob\xF3w cyfrowych w magazynie.</p>' : digitalAssets.map((d) => `
<div class="form-card">
  <div style="margin-bottom:6px">
    ${badge(departmentLabel(d.department), "info")} ${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}
    <strong>${E(d.title)}</strong>
    <span class="dim" style="font-size:12px;margin-left:8px">wynik: ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 ${E(d.date)}</span>
  </div>
  <div class="offer-pre">${E(d.content)}</div>
</div>`).join("")}

<h2>Pakiety Dostawy (${state.deliveryPacks.length})</h2>
${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w dostawy.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th><th>\u0179r\xF3d\u0142o</th><th>Utworzono</th></tr></thead>
<tbody>
${[...state.deliveryPacks].reverse().map((p) => `<tr>
  <td class="mono">${E(p.id)}</td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
  <td class="mono dim">${E(p.sourceOutputId)}</td>
  <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderTrash(state) {
  const trashedDigitals = state.dailyDigitals.filter((d) => d.location === "trash");
  return layout("Kosz", "/trash", `
<h1>Kosz \u2014 Odrzucone i Nieudane</h1>
<p class="sub">${state.trash.length} pozycji z pipeline'u + ${trashedDigitals.length} odrzuconych zasob\xF3w cyfrowych</p>

<h2>Pozycje z Pipeline'u (${state.trash.length})</h2>
${state.trash.length === 0 ? '<p class="dim">Kosz jest pusty.</p>' : `
<table>
<thead><tr><th>ID</th><th>ID Sygna\u0142u</th><th>Pow\xF3d</th><th>Odrzucono</th></tr></thead>
<tbody>
${state.trash.map((t) => `<tr>
  <td class="mono">${E(t.id)}</td>
  <td class="mono">${E(t.signalId)}</td>
  <td>${E(t.reason)}</td>
  <td class="dim">${E(t.trashedAt.slice(0, 16).replace("T", " "))}</td>
</tr>`).join("")}
</tbody>
</table>`}

<h2>Odrzucone Zasoby Cyfrowe (${trashedDigitals.length})</h2>
${trashedDigitals.length === 0 ? '<p class="dim">Brak odrzuconych zasob\xF3w.</p>' : `
<table>
<thead><tr><th>ID</th><th>Dzia\u0142</th><th>Tytu\u0142</th><th>Feedback</th><th>Data</th></tr></thead>
<tbody>
${trashedDigitals.map((d) => `<tr>
  <td class="mono">${E(d.id)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
  <td>${E(d.title)}</td>
  <td class="dim" style="font-size:12px">${E(d.operatorFeedback ?? "\u2014")}</td>
  <td class="dim">${E(d.date)}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderDailyReview(state, flash) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const todayItems = trainingItems.filter((d) => d.date === today);
  const pending = todayItems.filter((d) => d.status === "draft_ready" || d.status === "needs_rework");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const statusBadgeCls = (s) => {
    if (s === "accepted") return "ok";
    if (s === "needs_rework") return "warn";
    if (s === "rejected") return "bad";
    if (s === "draft_ready") return "info";
    return "muted";
  };
  const deptBadgeCls = (d) => {
    const m = { marketing: "info", sales: "ok", delivery: "warn", research: "muted", qa: "bad" };
    return m[d] ?? "muted";
  };
  const scoreColor = (s) => s >= 0.75 ? "#3fb950" : s >= 0.5 ? "#d29922" : "#f85149";
  const renderCard = (item) => {
    const isActionable = item.status === "draft_ready" || item.status === "needs_rework";
    const scoreBar = `<span class="score-bar"><span class="score-fill" style="width:${Math.round(item.qualityScore * 100)}%;background:${scoreColor(item.qualityScore)}"></span></span>`;
    const feedbackNote = item.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-top:4px">Feedback: ${E(item.operatorFeedback)}</div>` : "";
    const revNote = item.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${item.revisionCount}</span>` : "";
    const actions = isActionable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily" style="display:flex;gap:6px">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily" style="display:flex;gap:6px;align-items:flex-start">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">\u2192 Magazyn</button>
  </form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Feedback do poprawki..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="warn" type="submit" style="align-self:flex-start">Wymaga Poprawek</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(item.id)}">
      <input name="feedback" placeholder="Pow\xF3d odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzu\u0107 do Kosza</button>
    </form>
  </div>
</div>` : `<div class="dim" style="font-size:12px">Status: ${E(statusLabel(item.status))}${item.location === "warehouse" ? " \xB7 w magazynie" : ""}</div>`;
    return `<div class="daily-card ${item.status === "draft_ready" ? "draft" : item.status}">
  <div class="daily-header">
    ${badge(departmentLabel(item.department), deptBadgeCls(item.department))}
    ${badge(statusLabel(item.status), statusBadgeCls(item.status))}
    <span class="daily-title">${E(item.title)}</span>
    ${revNote}
    <span class="dim" style="font-size:11px">wynik ${item.qualityScore}${scoreBar}</span>
    <span class="dim" style="font-size:11px">${E(item.type)}</span>
  </div>
  ${feedbackNote}
  <div class="daily-content">${E(item.content)}</div>
  ${actions}
</div>`;
  };
  const olderItems = trainingItems.filter((d) => d.date !== today);
  const olderDates = [...new Set(olderItems.map((d) => d.date))].sort().reverse();
  return layout("Przegl\u0105d Dzienny", "/daily-review", `
<h1>Przegl\u0105d Dzienny \u2014 TRYB TRENINGOWY</h1>
<p class="sub">5 cyfrowych deliverabli dziennie \xB7 operator ocenia ka\u017Cdy \xB7 feedback wp\u0142ywa na kolejny przebieg</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${todayItems.length}</div><div class="l">Dzi\u015B</div></div>
  <div class="stat"><div class="v ${pending.length ? "warn" : "ok"}">${pending.length}</div><div class="l">Do Przegl\u0105du</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.status === "accepted").length}</div><div class="l">Zaakceptowane</div></div>
  <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">W Magazynie</div></div>
  <div class="stat"><div class="v bad">${trainingItems.filter((d) => d.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
  <div class="stat"><div class="v muted">${state.feedbackEvents.length}</div><div class="l">Zdarzenia Feedbacku</div></div>
</div>

${todayItems.length === 0 ? `
<div class="form-card">
  <p style="margin-bottom:10px;color:#8b949e">Brak misji uruchomionych na dzi\u015B (${today}).</p>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="action" value="run">
    <input type="hidden" name="date" value="${today}">
    <button type="submit">Uruchom Dzisiejsze 5 Misji \u2192</button>
  </form>
</div>` : `
<h2>Dzi\u015B \u2014 ${today} (${todayItems.length} deliverabli)</h2>
${todayItems.map(renderCard).join("")}
`}

${olderDates.length > 0 ? `
<h2>Poprzednie Dni</h2>
<table>
<thead><tr><th>Data</th><th>Dzia\u0142</th><th>Tytu\u0142</th><th>Status</th><th>Wynik</th><th>Lokalizacja</th></tr></thead>
<tbody>
${olderDates.flatMap(
    (date) => olderItems.filter((d) => d.date === date).map((d) => `<tr>
  <td class="dim">${E(d.date)}</td>
  <td>${badge(departmentLabel(d.department), "muted")}</td>
  <td>${E(d.title)}</td>
  <td>${badge(statusLabel(d.status), d.status === "accepted" ? "ok" : d.status === "rejected" ? "bad" : "warn")}</td>
  <td class="mono">${d.qualityScore}</td>
  <td class="dim">${E(statusLabel(d.location))}</td>
</tr>`)
  ).join("")}
</tbody>
</table>` : ""}

${state.feedbackEvents.length > 0 ? `
<h2>Zdarzenia Feedbacku \u2014 Ograniczenia dla Kolejnego Przebiegu</h2>
<table>
<thead><tr><th>Czas</th><th>Dzia\u0142</th><th>Akcja</th><th>Feedback</th></tr></thead>
<tbody>
${[...state.feedbackEvents].reverse().slice(0, 20).map((e) => `<tr>
  <td class="mono dim">${E(e.timestamp.slice(0, 16).replace("T", " "))}</td>
  <td>${badge(departmentLabel(e.department), "muted")}</td>
  <td>${badge(statusLabel(e.action), e.action === "accepted" || e.action === "warehoused" ? "ok" : e.action === "needs_rework" ? "warn" : "bad")}</td>
  <td class="dim" style="font-size:12px">${E(e.feedback ?? "\u2014")}</td>
</tr>`).join("")}
</tbody>
</table>` : ""}`);
}
function renderOrders(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const orders = [...state.orders].reverse();
  const open = state.orders.filter((o) => o.status === "new" || o.status === "in_production");
  const ready = state.orders.filter((o) => o.status === "ready_for_review");
  const orderBadgeCls = (s) => {
    if (s === "approved" || s === "closed") return "ok";
    if (s === "ready_for_review") return "warn";
    if (s === "rejected") return "bad";
    return "info";
  };
  const deliverableBlock = (order) => {
    const d = order.deliverableId ? state.dailyDigitals.find((x) => x.id === order.deliverableId) : void 0;
    if (!d) return '<div class="dim" style="font-size:12px">Brak deliverabla \u2014 autopilot wyprodukuje go w ci\u0105gu minuty.</div>';
    const reviewable = d.status === "draft_ready";
    return `
<div class="daily-content">${E(d.content)}</div>
<div class="dim" style="font-size:11px;margin-bottom:8px">deliverable: ${E(d.id)} \xB7 wynik ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 status ${E(statusLabel(d.status))}</div>
${reviewable ? `
<div class="daily-actions">
  <form method="POST" action="/api/daily"><input type="hidden" name="action" value="warehouse"><input type="hidden" name="id" value="${E(d.id)}"><button class="ok" type="submit">Zatwierd\u017A \u2192 Magazyn</button></form>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Co powinno si\u0119 zmieni\u0107..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14;align-self:flex-start">Zg\u0142o\u015B Poprawk\u0119</button>
    </form>
  </div>
  <div class="feedback-area">
    <form method="POST" action="/api/daily" style="display:flex;flex-direction:column;gap:4px">
      <input type="hidden" name="action" value="reject">
      <input type="hidden" name="id" value="${E(d.id)}">
      <input name="feedback" placeholder="Pow\xF3d odrzucenia..." style="background:#0d1117;border:1px solid #30363d;border-radius:5px;color:#e6edf3;font:12px ui-sans-serif,sans-serif;padding:4px 8px" required>
      <button class="bad" type="submit" style="align-self:flex-start">Odrzu\u0107 Wynik Zlecenia</button>
    </form>
  </div>
</div>` : ""}`;
  };
  return layout("Zlecenia", "/orders", `
<h1>Zlecenia Klient\xF3w</h1>
<p class="sub">Prawdziwa praca \u2014 zlecenie klienta zawsze ma priorytet nad treningiem dziennym. Nic nie jest dostarczane bez zgody operatora.</p>
${flashHtml}

<div class="stats">
  <div class="stat"><div class="v info">${state.orders.length}</div><div class="l">Razem</div></div>
  <div class="stat"><div class="v ${open.length ? "warn" : "ok"}">${open.length}</div><div class="l">W Produkcji</div></div>
  <div class="stat"><div class="v ${ready.length ? "warn" : "ok"}">${ready.length}</div><div class="l">Gotowe do Przegl\u0105du</div></div>
  <div class="stat"><div class="v ok">${state.orders.filter((o) => o.status === "approved" || o.status === "closed").length}</div><div class="l">Zatwierdzone</div></div>
  <div class="stat"><div class="v bad">${state.orders.filter((o) => o.status === "rejected").length}</div><div class="l">Odrzucone</div></div>
</div>

<div class="form-card">
  <label>Nowe zlecenie klienta \u2014 dla kogo i czego potrzebuje?</label>
  <form method="POST" action="/api/order">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <input name="contact" placeholder="Kontakt (opcjonalnie)" style="flex:1;min-width:180px;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
      <select name="department" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzeda\u017C</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
    </div>
    <textarea name="description" placeholder="np. Tekst strony l\u0105dowania dla firmy budowlanej sprzedaj\u0105cej gara\u017Ce prefabrykowane \u2014 potrzebna sekcja cenowa i CTA formularza kontaktowego" required></textarea>
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie \u2192 Wyprodukuj Teraz</button></div>
  </form>
</div>

<h2>Zlecenia (${orders.length})</h2>
${orders.length === 0 ? '<p class="dim">Brak zlece\u0144. Gdy nie ma zlece\u0144, fabryka uruchamia zamiast tego 5 losowych misji treningowych dziennie.</p>' : orders.map((o) => `
<div class="daily-card ${o.status === "ready_for_review" ? "draft" : o.status === "approved" || o.status === "closed" ? "accepted" : o.status === "rejected" ? "rejected" : "needs_rework"}">
  <div class="daily-header">
    ${badge(statusLabel(o.status), orderBadgeCls(o.status))}
    ${badge(departmentLabel(o.department), "info")}
    <span class="daily-title">${E(o.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(o.id)}</span>
    ${o.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(o.taskType)}</span>` : ""}
    ${o.revisionCount > 0 ? `<span class="dim" style="font-size:11px">rev ${o.revisionCount}</span>` : ""}
  </div>
  <div style="font-size:12.5px;color:#c9d1d9;margin-bottom:8px">"${E(o.description)}"</div>
  ${o.operatorFeedback ? `<div style="font-size:12px;color:#d29922;margin-bottom:6px">Ostatni feedback: ${E(o.operatorFeedback)}</div>` : ""}
  ${deliverableBlock(o)}
</div>`).join("")}`);
}
function deriveOps(state) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const openOrders = state.orders.filter((o) => {
    if (o.status !== "new" && o.status !== "in_production") return false;
    const d = o.deliverableId ? state.dailyDigitals.find((x) => x.id === o.deliverableId) : void 0;
    return d?.status !== "needs_rework";
  }).length;
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review").length;
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const trainingToday = trainingItems.filter((d) => d.date === today).length;
  const trainingDrafts = trainingItems.filter((d) => d.status === "draft_ready").length;
  const needsRework = state.dailyDigitals.filter((d) => d.status === "needs_rework").length;
  const pendingApprovals = state.approvalQueue.filter((a) => a.status === "pending").length;
  const deliveryPacksDraft = state.deliveryPacks.filter((p) => p.status === "draft").length;
  const deliveryPacksApproved = state.deliveryPacks.filter((p) => p.status === "approved").length;
  const waiting = { ordersReadyForReview: readyOrders, trainingDrafts, needsRework, pendingApprovals, deliveryPacksDraft, deliveryPacksApproved };
  const mode = openOrders > 0 ? "CLIENT_MODE" : needsRework > 0 ? "REWORK_MODE" : trainingToday < 5 ? "NO_CLIENT_TRAINING_MODE" : "IDLE";
  let standingStill;
  if (!autopilotEnabled) {
    standingStill = "Fabryka jest wstrzymana, bo autopilot jest WY\u0141\u0104CZONY. Nie uruchomi sama kolejnych cykli, dop\xF3ki nie zostanie wznowiony." + (readyOrders + trainingDrafts > 0 ? ` Tymczasem do przegl\u0105du czeka: zlecenia klienta \u2014 ${readyOrders}, szkice treningowe \u2014 ${trainingDrafts}.` : "");
  } else if (openOrders > 0) {
    standingStill = `Fabryka produkuje: otwarte zlecenia klienta w pipeline \u2014 ${openOrders}.`;
  } else if (needsRework > 0) {
    standingStill = `Fabryka czeka na cykl poprawek, by odtworzy\u0107 oznaczone wyniki: ${needsRework}.`;
  } else if (readyOrders + trainingDrafts + pendingApprovals + deliveryPacksDraft + deliveryPacksApproved > 0) {
    standingStill = `Fabryka czeka na przegl\u0105d operatora: zlecenia klienta \u2014 ${readyOrders}, szkice treningowe \u2014 ${trainingDrafts}.` + (deliveryPacksDraft + deliveryPacksApproved > 0 ? ` Pakiety dostawy czekaj\u0105: szkice \u2014 ${deliveryPacksDraft}, zatwierdzone \u2014 ${deliveryPacksApproved}.` : "") + (pendingApprovals > 0 ? ` Dodatkowo pozycje do zatwierdzenia w pipeline: ${pendingApprovals}.` : "");
  } else if (trainingToday >= 5) {
    standingStill = "Fabryka jest bezczynna, bo dzienny limit treningu jest wykonany, a nie ma otwartych zlece\u0144 klienta.";
  } else {
    standingStill = `Fabryka jest bezczynna: limit treningu na dzi\u015B to ${trainingToday}/5 \u2014 uruchom cykl treningowy lub poczekaj na kolejny tick autopilota.`;
  }
  const [nextActionTitle, nextActionDetail] = readyOrders > 0 ? ["Przejrzyj zlecenie klienta", `Zlecenia klienta czekaj\u0105ce na zatwierdzenie, poprawk\u0119 lub odrzucenie: ${readyOrders}.`] : needsRework > 0 ? ["Poczekaj na cykl poprawek lub go uruchom", `Pozycje oznaczone jako wymaga poprawek: ${needsRework}.`] : trainingDrafts > 0 ? ["Przejrzyj zasoby treningowe", `Szkice treningowe gotowe do przegl\u0105du operatora: ${trainingDrafts}.`] : deliveryPacksDraft > 0 ? ["Zatwierd\u017A pakiet dostawy", `Pakiety dostawy w wersji roboczej na /delivery: ${deliveryPacksDraft}.`] : deliveryPacksApproved > 0 ? ["Zmagazynuj zatwierdzony pakiet dostawy", `Zatwierdzone pakiety gotowe na /delivery: ${deliveryPacksApproved}.`] : pendingApprovals > 0 ? ["Przejrzyj pozycj\u0119 do zatwierdzenia w pipeline", `Oczekuj\u0105ce pozycje do zatwierdzenia: ${pendingApprovals}.`] : !autopilotEnabled ? ["Wzn\xF3w autopilota lub \u015Bwiadomie zostaw wstrzymanego", "Zapisane ustawienie autopilota to WY\u0141., a nic nie czeka na przegl\u0105d."] : trainingToday < 5 && openOrders === 0 ? ["Uruchom cykl treningowy", `Dzi\u015B jest ${trainingToday}/5 zasob\xF3w treningowych.`] : ["Dodaj zlecenie klienta / system bezczynny", "Nic nie wymaga przegl\u0105du. Fabryka jest gotowa na now\u0105 prac\u0119 dla klienta."];
  return { mode, nextActionTitle, nextActionDetail, standingStill, waiting, trainingToday };
}
function renderAdmin(state, flash) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const openOrders = state.orders.filter((o) => o.status === "new" || o.status === "in_production");
  const readyOrders = state.orders.filter((o) => o.status === "ready_for_review");
  const approvedOrders = state.orders.filter((o) => o.status === "approved" || o.status === "closed");
  const rejectedOrders = state.orders.filter((o) => o.status === "rejected");
  const trainingItems = state.dailyDigitals.filter((d) => !d.orderId);
  const todayTraining = trainingItems.filter((d) => d.date === today);
  const pendingTraining = trainingItems.filter((d) => d.status === "draft_ready");
  const acceptedTraining = trainingItems.filter((d) => d.status === "accepted");
  const rejectedTraining = trainingItems.filter((d) => d.status === "rejected");
  const reworkItems = state.dailyDigitals.filter((d) => d.status === "needs_rework");
  const warehouseAssets = state.dailyDigitals.filter((d) => d.location === "warehouse");
  const trashCount = state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length;
  const pendingApprovalCount = state.approvalQueue.filter((a) => a.status === "pending").length;
  const pendingReviewCount = readyOrders.length + pendingTraining.length + reworkItems.length + pendingApprovalCount;
  const packsDraft = state.deliveryPacks.filter((p) => p.status === "draft");
  const packsApproved = state.deliveryPacks.filter((p) => p.status === "approved");
  const packsReady = state.deliveryPacks.filter((p) => p.status === "warehouse_ready");
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const ops = deriveOps(state);
  const mode = ops.mode;
  const nextAction = [ops.nextActionTitle, ops.nextActionDetail];
  const orderBadgeCls = (s) => {
    if (s === "approved" || s === "closed") return "ok";
    if (s === "ready_for_review") return "warn";
    if (s === "rejected") return "bad";
    return "info";
  };
  const itemBadgeCls = (s) => {
    if (s === "accepted") return "ok";
    if (s === "needs_rework") return "warn";
    if (s === "rejected") return "bad";
    if (s === "draft_ready") return "info";
    return "muted";
  };
  const eventBadgeCls = (eventType) => {
    if (/rejected|off/.test(eventType)) return "bad";
    if (/warehouse|approved|accepted|on/.test(eventType)) return "ok";
    if (/rework|cycle/.test(eventType)) return "warn";
    return "info";
  };
  const preview = (text, max = 420) => text.length > max ? `${text.slice(0, max)}...` : text;
  const deliverableFor = (order) => order.deliverableId ? state.dailyDigitals.find((d) => d.id === order.deliverableId) : void 0;
  const renderOrderActions = (d) => {
    if (!d || d.status !== "draft_ready") return "";
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(d.id)}">
    <button class="ok" type="submit">Zatwierd\u017A -> Magazyn</button>
  </form>
  <form method="POST" action="/api/delivery">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="create">
    <input type="hidden" name="outputId" value="${E(d.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Zatwierd\u017A -> Pakiet Dostawy</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zg\u0142o\u015B Poprawk\u0119</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(d.id)}">
    <input name="feedback" placeholder="Pow\xF3d odrzucenia..." required>
    <button class="bad" type="submit">Odrzu\u0107</button>
  </form>
</div>`;
  };
  const renderOrder = (order) => {
    const d = deliverableFor(order);
    const done = order.status === "approved" || order.status === "closed";
    const cls = order.status === "ready_for_review" ? "ready" : done ? "done" : order.status === "rejected" ? "bad" : "";
    return `
<div class="admin-order ${cls}" id="${d ? `out-${E(d.id)}` : `order-${E(order.id)}`}">
  <div class="daily-header">
    ${badge(statusLabel(order.status), orderBadgeCls(order.status))}
    ${badge(departmentLabel(order.department), "info")}
    <span class="daily-title">${E(order.clientName)}</span>
    ${order.taskType ? `<span class="dim" style="font-size:11px">zadanie: ${E(order.taskType)}</span>` : ""}
    <span class="dim" style="font-size:11px">rev ${order.revisionCount}</span>
  </div>
  <div class="dim" style="font-size:12px;margin-bottom:5px">kontakt: ${E(order.contact ?? "nie podano")}</div>
  <div style="font-size:12.5px;color:#dbe7f0">${E(order.description)}</div>
  ${d ? `
    <div class="admin-preview">${E(preview(d.content))}</div>
    <div class="dim" style="font-size:11px;margin-top:6px">deliverable ${E(d.id)} \xB7 od ${E(d.createdByAgentId)} \xB7 wynik ${d.qualityScore} \xB7 rev ${d.revisionCount} \xB7 ${E(statusLabel(d.status))} \xB7 ${E(d.taskType ?? d.type)}</div>
    ${d.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:4px;color:#d29922">feedback operatora: ${E(d.operatorFeedback)}${d.revisionCount > 0 ? ` (zastosowano w rev ${d.revisionCount})` : ""}</div>` : ""}
    ${renderOrderActions(d)}
  ` : '<div class="dim" style="font-size:12px;margin-top:8px">Brak deliverabla.</div>'}
</div>`;
  };
  const orderGroup = (title, items, empty, anchorId) => `
<div class="admin-panel"${anchorId ? ` id="${anchorId}"` : ""}>
  <h2>${E(title)} (${items.length})</h2>
  <div class="admin-list">
    ${items.length === 0 ? `<p class="dim">${E(empty)}</p>` : [...items].reverse().map(renderOrder).join("")}
  </div>
</div>`;
  const renderTrainingActions = (item) => {
    if (item.status !== "draft_ready" && item.status !== "needs_rework") return "";
    return `
<div class="admin-actions">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="accept">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button class="ok" type="submit">Akceptuj</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="warehouse">
    <input type="hidden" name="id" value="${E(item.id)}">
    <button type="submit" style="background:#0f2740;color:#58a6ff;border-color:#1c3a5e">Magazyn</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="rework">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Notatka do poprawki..." required>
    <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Poprawka</button>
  </form>
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/admin">
    <input type="hidden" name="action" value="reject">
    <input type="hidden" name="id" value="${E(item.id)}">
    <input name="feedback" placeholder="Pow\xF3d odrzucenia..." required>
    <button class="bad" type="submit">Odrzu\u0107</button>
  </form>
</div>`;
  };
  const renderTrainingItem = (item) => `
<div class="admin-order ${item.status === "rejected" ? "bad" : item.status === "accepted" ? "done" : item.status === "needs_rework" ? "ready" : ""}" id="out-${E(item.id)}">
  <div class="daily-header">
    ${badge(statusLabel(item.status), itemBadgeCls(item.status))}
    ${badge(departmentLabel(item.department), "info")}
    ${badge(statusLabel("training"), "muted")}
    <span class="daily-title">${E(item.title)}</span>
    <span class="dim" style="font-size:11px">${E(item.taskType ?? item.type)} \xB7 od ${E(item.createdByAgentId)} \xB7 wynik ${item.qualityScore} \xB7 rev ${item.revisionCount} \xB7 ${E(item.date)}</span>
  </div>
  <div class="dim mono" style="font-size:11px;margin-top:4px">output ${E(item.id)}</div>
  <div class="admin-preview">${E(preview(item.content, 300))}</div>
  ${item.operatorFeedback ? `<div class="dim" style="font-size:12px;margin-top:6px;color:#d29922">feedback: ${E(item.operatorFeedback)}${item.revisionCount > 0 ? ` (zastosowano w rev ${item.revisionCount})` : ""}</div>` : ""}
  ${renderTrainingActions(item)}
</div>`;
  const latestWarehouse = [...warehouseAssets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const criticalEvents = [...state.events].reverse().filter(
    (e) => e.eventType.startsWith("order.") || e.eventType === "factory.cycle" || e.eventType.startsWith("daily.") || e.eventType.startsWith("approval.") || e.eventType === "factory.autopilot_on" || e.eventType === "factory.autopilot_off"
  ).slice(0, 18);
  const workroomAgents = ["N", "MA", "SA", "DA", "RA", "QAA"];
  const agentNames = {
    N: "Dyrektor Fabryki",
    MA: "Producent Marketingu",
    SA: "Producent Sprzeda\u017Cy",
    DA: "Producent Realizacji",
    RA: "Producent Bada\u0144",
    QAA: "Producent QA"
  };
  const lastRun = state.workRuns[state.workRuns.length - 1];
  const recentRuns = [...state.workRuns].reverse().slice(0, 8);
  const runStepPairs = [...state.workRuns].reverse().flatMap((run) => run.steps.map((step) => ({ run, step })));
  const latestStepFor = (agentId) => runStepPairs.find((x) => x.step.agentId === agentId);
  const digitalById = new Map(state.dailyDigitals.map((d) => [d.id, d]));
  const renderWorkAgent = (agentId) => {
    const latest = latestStepFor(agentId);
    const step = latest?.step;
    const outputDigital = step?.outputId ? digitalById.get(step.outputId) : void 0;
    const status = !step ? "idle" : latest.run.status === "failed" || step.status === "failed" ? "blocked" : step.status === "skipped" ? "idle" : outputDigital?.status === "draft_ready" || outputDigital?.status === "needs_rework" ? "waiting_review" : "completed";
    const relatedOrder = outputDigital?.orderId;
    const next = agentId === "N" ? nextAction[0] : status === "waiting_review" ? `Operator: przejrzyj ${step?.outputId ?? "output"}` : status === "blocked" ? "Sprawd\u017A nieudany przebieg pracy poni\u017Cej" : "Czeka na pasuj\u0105ce zlecenie, poprawk\u0119 lub slot treningowy";
    return `
<div class="work-agent ${status === "blocked" ? "failed" : status === "waiting_review" ? "active" : "waiting"}">
  <div class="name">${E(agentId)} \xB7 ${E(agentNames[agentId])}</div>
  <div class="meta">${E(statusLabel(status))}${step?.department ? ` \xB7 ${E(departmentLabel(step.department))}` : ""}${step ? ` \xB7 ostatni przebieg ${E(step.finishedAt.slice(0, 19).replace("T", " "))}` : ""}</div>
  <div class="line"><strong>Ostatnie zadanie:</strong> ${E(step?.jobType ?? "jeszcze \u017Cadne")}</div>
  <div class="line"><strong>Ostatnie wej\u015Bcie:</strong> ${step ? E(preview(step.inputSummary, 110)) : "\u2014"}</div>
  <div class="line"><strong>Ostatnie wyj\u015Bcie:</strong> ${E(step?.outputSummary ? preview(step.outputSummary, 110) : "Jeszcze brak zarejestrowanego wyj\u015Bcia")}</div>
  ${step?.outputId ? `<div class="line mono" style="font-size:11px"><strong>ID wyj\u015Bcia:</strong> <a href="#out-${E(step.outputId)}">${E(step.outputId)}</a></div>` : ""}
  ${relatedOrder ? `<div class="line mono" style="font-size:11px"><strong>Powi\u0105zane zlecenie:</strong> ${E(relatedOrder)}</div>` : ""}
  <div class="line"><strong>Dalej:</strong> ${E(next)}</div>
</div>`;
  };
  const renderStep = (step) => `
<div class="timeline-step ${step.status}">
  <div class="daily-header">
    ${badge(step.agentId, "info")}
    ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")}
    <span class="daily-title">${E(step.agentName)}</span>
    <span class="dim" style="font-size:11px">${E(step.jobType)}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(step.inputSummary)}</div>
  ${step.outputSummary ? `<div class="dim" style="font-size:12px;margin-top:4px"><strong>Wyj\u015Bcie:</strong> ${E(step.outputSummary)}</div>` : ""}
  ${step.outputId ? `<div class="dim mono" style="font-size:11px;margin-top:4px">outputId: ${E(step.outputId)}</div>` : ""}
  ${step.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:4px">ograniczenia: ${E(step.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim mono" style="font-size:10.5px;margin-top:4px">${E(step.startedAt.slice(11, 19))} -> ${E(step.finishedAt.slice(11, 19))}</div>
</div>`;
  return layout("Kokpit Szefa/Administratora", "/admin", `
<div class="admin-shell">
  <section class="admin-hero">
    <div>
      <div class="admin-kicker">Centrum dowodzenia za\u0142o\u017Cyciela</div>
      <h1 class="admin-title">Kokpit Szefa/Administratora</h1>
      <p class="admin-sub">Operacyjna kontrola nad factory-core v0.2.1. Autonomia my\u015Blenia bez autonomii dzia\u0142ania: system mo\u017Ce produkowa\u0107 prac\u0119 wewn\u0119trzn\u0105, ale operator zatwierdza ka\u017Cdy krok wychodz\u0105cy na zewn\u0105trz.</p>
    </div>
    <div class="admin-mode">
      ${badge(modeLabel(mode), mode === "CLIENT_MODE" ? "warn" : mode === "REWORK_MODE" ? "warn" : mode === "NO_CLIENT_TRAINING_MODE" ? "info" : "muted")}
      ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "bad")}
      ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
      <span class="dim" style="font-size:12px">ostatni cykl: ${lastRun ? `${E(modeLabel(lastRun.mode))} \xB7 ${E(statusLabel(lastRun.status))} \xB7 via ${E(lastRun.trigger)} \xB7 ${E(lastRun.finishedAt.slice(0, 19).replace("T", " "))}` : "jeszcze nic nie zarejestrowano"}</span>
      <span class="dim" style="font-size:12px">dalej: ${E(nextAction[0])}</span>
      <span class="dim" style="font-size:11px">lokalna pojedyncza instancja \xB7 nic nie opuszcza fabryki bez zgody operatora</span>
    </div>
  </section>

  ${flashHtml}

  <section class="admin-grid" aria-label="Executive Summary">
    <div class="admin-card"><div class="v info">${state.orders.length}</div><div class="l">Zlecenia razem</div></div>
    <div class="admin-card"><div class="v ${readyOrders.length ? "warn" : "ok"}">${readyOrders.length}</div><div class="l">Zlecenia gotowe do przegl\u0105du</div></div>
    <div class="admin-card"><div class="v ${openOrders.length ? "warn" : "ok"}">${openOrders.length}</div><div class="l">Otwarte zlecenia</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Licznik treningu</div></div>
    <div class="admin-card"><div class="v ${pendingReviewCount ? "warn" : "ok"}">${pendingReviewCount}</div><div class="l">Pozycje do przegl\u0105du</div></div>
    <div class="admin-card"><div class="v ok">${state.warehouse.length + warehouseAssets.length}</div><div class="l">Stan magazynu</div></div>
    <div class="admin-card"><div class="v bad">${trashCount}</div><div class="l">Kosz/odrzucone razem</div></div>
    <div class="admin-card"><div class="v info">${state.events.length}</div><div class="l">Zdarzenia razem</div></div>
  </section>

  <section class="admin-grid" aria-label="Business Loop">
    <div class="admin-card"><div class="v info">${SERVICE_CATALOG.length}</div><div class="l">Us\u0142ugi w katalogu</div></div>
    <div class="admin-card"><div class="v ${openOrders.length + readyOrders.length ? "warn" : "ok"}">${openOrders.length + readyOrders.length}</div><div class="l">Aktywne zlecenia klient\xF3w</div></div>
    <div class="admin-card"><div class="v ${packsDraft.length + packsApproved.length ? "warn" : "ok"}">${packsDraft.length}/${packsApproved.length}/${packsReady.length}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
    <div class="admin-card"><div class="v info">${todayTraining.length}/5</div><div class="l">Limit treningu</div></div>
    <div class="admin-card"><div class="v ok">${state.caseRecords.length}</div><div class="l">Karty spraw</div></div>
  </section>

  <section class="admin-action">
    <h2>Nast\u0119pna Akcja Operatora</h2>
    <strong>${E(nextAction[0])}</strong>
    <p class="dim">${E(nextAction[1])}</p>
  </section>

  <section class="admin-two">
    <div class="admin-panel">
      <h2>Dodaj Zlecenie Klienta</h2>
      <form method="POST" action="/api/order">
        <input type="hidden" name="returnTo" value="/admin">
        <div class="admin-input-row">
          <input name="clientName" placeholder="Nazwa klienta" required>
          <input name="contact" placeholder="Kontakt">
          <select name="serviceId">
            <option value="">\u2014 us\u0142uga: dowolny brief \u2014</option>
            ${SERVICE_CATALOG.map((s) => `<option value="${E(s.id)}">${E(s.name)}</option>`).join("")}
          </select>
          <select name="language">
            <option value="EN">EN</option>
            <option value="PL">PL</option>
          </select>
          <select name="department">
            <option value="marketing">Marketing</option>
            <option value="sales">Sprzeda\u017C</option>
            <option value="delivery" selected>Realizacja</option>
            <option value="research">Badania</option>
            <option value="qa">QA</option>
          </select>
        </div>
        <textarea name="description" placeholder="Opisz \u017C\u0105dany deliverable..." required></textarea>
        <div class="admin-actions"><button type="submit">Dodaj Zlecenie</button></div>
      </form>
    </div>

    <div class="admin-panel hot">
      <h2>Kontrola Autopilota</h2>
      <p class="dim" style="margin-bottom:10px">Zapisany stan: <strong>${autopilotEnabled ? "W\u0141." : "WY\u0141."}</strong></p>
      <div class="admin-actions">
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="off">
          <button class="bad" type="submit">Wstrzymaj Autopilota</button>
        </form>
        <form method="POST" action="/api/autopilot">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="on">
          <button class="ok" type="submit">Wzn\xF3w Autopilota</button>
        </form>
        <form method="POST" action="/api/daily">
          <input type="hidden" name="returnTo" value="/admin">
          <input type="hidden" name="action" value="run">
          <input type="hidden" name="date" value="${today}">
          <button type="submit">Uruchom Cykl Treningowy</button>
        </form>
        <form method="POST" action="/api/demo-order">
          <input type="hidden" name="returnTo" value="/admin">
          <button type="submit">Utw\xF3rz Demo Zlecenie HVAC</button>
        </form>
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Zlece\u0144</h2>
    <div class="admin-three">
      <div class="stat"><div class="v info">${openOrders.length}</div><div class="l">nowe / w produkcji</div></div>
      <div class="stat"><div class="v warn">${readyOrders.length}</div><div class="l">gotowe do przegl\u0105du</div></div>
      <div class="stat"><div class="v ok">${approvedOrders.length}</div><div class="l">zatwierdzone / zamkni\u0119te</div></div>
    </div>
  </section>

  <section class="admin-two">
    <div class="admin-list">
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - nowe / w produkcji", openOrders, "Brak zlece\u0144 obecnie w produkcji.")}
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - gotowe do przegl\u0105du", readyOrders, "Brak zlece\u0144 klient\xF3w czekaj\u0105cych na przegl\u0105d.", "orders-review")}
    </div>
    <div class="admin-list">
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - zatwierdzone / zamkni\u0119te", approvedOrders, "Brak zatwierdzonych lub zamkni\u0119tych zlece\u0144.")}
      ${orderGroup("Kontrola Zlece\u0144 Klient\xF3w - odrzucone", rejectedOrders, "Brak odrzuconych zlece\u0144.")}
    </div>
  </section>

  <section class="admin-panel" id="training-review">
    <h2>Przegl\u0105d Treningu Dziennego</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${todayTraining.length}/5</div><div class="l">dzi\u015B</div></div>
      <div class="stat"><div class="v warn">${pendingTraining.length}</div><div class="l">oczekuj\u0105ce szkic gotowy</div></div>
      <div class="stat"><div class="v ok">${acceptedTraining.length}</div><div class="l">zaakceptowane</div></div>
      <div class="stat"><div class="v bad">${rejectedTraining.length}</div><div class="l">odrzucone</div></div>
      <div class="stat"><div class="v warn">${trainingItems.filter((d) => d.status === "needs_rework").length}</div><div class="l">wymaga poprawek</div></div>
      <div class="stat"><div class="v ok">${trainingItems.filter((d) => d.location === "warehouse").length}</div><div class="l">zmagazynowane</div></div>
    </div>
    <div class="admin-list">
      ${trainingItems.length === 0 ? '<p class="dim">Brak zasob\xF3w treningowych.</p>' : [...trainingItems].reverse().slice(0, 12).map(renderTrainingItem).join("")}
    </div>
  </section>

  <section class="admin-panel" id="integrity-guard">
    <h2>Integrity Guard \u2014 Monitor Pinokia</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Nos ro\u015Bnie, gdy odrzucasz (+${INTEGRITY_LIMITS.growRejected}) lub zwracasz do poprawki (+${INTEGRITY_LIMITS.growRework}), a maleje, gdy akceptujesz (\u2212${INTEGRITY_LIMITS.shrinkAccepted}). Przy ${INTEGRITY_LIMITS.critical}cm protok\xF3\u0142 HRAR kwarantannuje agenta z produkcji klienckiej \u2014 trening pozostaje dozwolony. Tylko Tw\xF3j reset (God Layer) to znosi.</p>
    <table class="admin-table">
      <thead><tr><th>Agent</th><th>Nos</th><th>Status</th><th>Naruszenia</th><th>Ostatni sygna\u0142</th><th>Akcja</th></tr></thead>
      <tbody>
        ${getIntegrityRecords(store).map((r) => `<tr>
          <td class="mono">${E(r.agentId)}</td>
          <td><span class="mono">${r.noseLength}cm</span><span class="score-bar"><span class="score-fill" style="width:${r.noseLength}%;background:${r.noseLength >= INTEGRITY_LIMITS.critical ? "#f85149" : r.noseLength >= INTEGRITY_LIMITS.watch ? "#d29922" : "#3fb950"}"></span></span></td>
          <td>${badge(statusLabel(r.status), r.status === "quarantined" ? "bad" : r.status === "watch" ? "warn" : "ok")}</td>
          <td class="mono">${r.breaches}</td>
          <td class="dim" style="font-size:11.5px">${E(r.lastSignal ?? "\u2014")}</td>
          <td>${r.noseLength > 0 || r.status !== "healthy" ? `
            <form method="POST" action="/api/integrity" style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
              <input type="hidden" name="action" value="reset">
              <input type="hidden" name="agentId" value="${E(r.agentId)}">
              <select name="reason" required style="font-size:11px">
                <option value="">pow\xF3d...</option>
                ${INTEGRITY_RESET_REASONS.map((rr) => `<option value="${E(rr)}">${E(rr)}</option>`).join("")}
              </select>
              <input name="note" placeholder="notatka (opcjonalnie)" style="font-size:11px;width:110px">
              <button type="submit" style="font-size:11.5px">Reset (God Layer)</button>
            </form>` : '<span class="dim" style="font-size:11.5px">\u2014</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </section>

  <section class="admin-panel">
    <h2>Linia Produkcyjna Agent\xF3w</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Skr\xF3cony widok hali produkcyjnej. Pe\u0142ny widok: <a href="/production-line" style="color:#58a6ff">/production-line</a></p>
    ${(() => {
    const pl = productionLineFor(state);
    return `
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zadania klienckie</div></div>
      <div class="stat"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
      <div class="stat"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft + pl.deliveryPacks.approved}</div><div class="l">Zadania pakiet\xF3w czekaj\u0105ce</div></div>
      <div class="stat"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Trening dzi\u015B</div></div>
    </div>
    <table class="admin-table">
      <thead><tr><th>Stacja</th><th>Agent</th><th>Status</th><th>Zadania</th><th>Ostatnie</th></tr></thead>
      <tbody>
        ${pl.stations.map((st) => `<tr>
          <td>${E(st.name)}</td>
          <td class="mono">${E(st.agentId)}</td>
          <td>${badge(statusLabel(st.status), plStatusBadgeCls(st.status))}</td>
          <td class="mono">${st.taskCount}</td>
          <td class="dim" style="font-size:11.5px">${st.lastTask ? E(plPreview(st.lastTask.title, 46)) : "\u2014"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <p class="dim" style="font-size:12px;margin-top:6px">Nast\u0119pna akcja operatora: <strong>${E(pl.nextOperatorAction)}</strong></p>`;
  })()}
  </section>

  <section class="admin-panel">
    <h2>Warsztat Fabryki</h2>
    <div class="admin-three" style="margin-bottom:10px">
      <div class="stat"><div class="v ${lastRun?.status === "failed" ? "bad" : lastRun ? "ok" : "muted"}">${E(lastRun ? statusLabel(lastRun.status) : "brak")}</div><div class="l">Status ostatniego cyklu</div></div>
      <div class="stat"><div class="v info">${E(modeLabel(lastRun?.mode ?? mode))}</div><div class="l">Ostatni tryb</div></div>
      <div class="stat"><div class="v warn">${lastRun?.steps.length ?? 0}</div><div class="l">Kroki agent\xF3w</div></div>
    </div>
    <div class="idle-box" style="margin-bottom:10px">
      <div class="kicker">Dlaczego Stoi w Miejscu</div>
      <strong>${E(ops.standingStill)}</strong>
      ${lastRun?.idleReason ? `<div class="dim" style="font-size:11.5px;margin-top:4px">Ostatni zarejestrowany cykl m\xF3wi: ${E(lastRun.idleReason)}</div>` : ""}
      <div class="dim" style="font-size:12px;margin-top:4px">Nast\u0119pna akcja operatora: ${E(nextAction[0])} \u2014 ${E(nextAction[1])}</div>
    </div>
    <div class="workroom-grid" style="margin-bottom:12px">
      ${workroomAgents.map(renderWorkAgent).join("")}
    </div>
    <div class="admin-two">
      <div class="admin-subpanel">
        <h2>O\u015B Czasu Ostatniego Przebiegu Pracy</h2>
        ${lastRun ? `
          <p class="dim" style="font-size:12px;margin-bottom:8px">${E(lastRun.id)} \xB7 ${E(lastRun.trigger)} \xB7 ${E(modeLabel(lastRun.mode))} \xB7 ${E(lastRun.startedAt.slice(0, 19).replace("T", " "))} -> ${E(lastRun.finishedAt.slice(11, 19))} \xB7 wyj\u015Bcia ${lastRun.outputsCreated.length}</p>
          <div class="timeline">${lastRun.steps.map(renderStep).join("")}</div>
        ` : '<p class="dim">\u017Baden autonomiczny cykl jeszcze nie zarejestrowa\u0142 pracy.</p>'}
      </div>
      <div class="admin-subpanel">
        <h2>Czeka na Operatora</h2>
        <p class="dim" style="font-size:12px;margin-bottom:8px">${E(ops.standingStill)}</p>
        <table class="admin-table">
          <tbody>
            <tr><th><a href="#orders-review">Zlecenia klient\xF3w gotowe do przegl\u0105du</a></th><td>${readyOrders.length}</td></tr>
            <tr><th><a href="#training-review">Szkice treningowe czekaj\u0105ce</a></th><td>${pendingTraining.length}</td></tr>
            <tr><th><a href="#training-review">Poprawki czekaj\u0105ce na cykl</a></th><td>${reworkItems.length}</td></tr>
            <tr><th>Pozycje do zatwierdzenia w pipeline (zobacz /factory)</th><td>${pendingApprovalCount}</td></tr>
          </tbody>
        </table>
        ${readyOrders.length + pendingTraining.length + reworkItems.length + packsDraft.length + packsApproved.length > 0 ? `
        <table class="admin-table" style="margin-top:10px">
          <thead><tr><th>Pozycja</th><th>Wyj\u015Bcie</th><th>\u0179r\xF3d\u0142o</th><th>Producent</th><th>Dzia\u0142</th><th>Wynik</th><th>Rev</th><th>Bezpieczna nast\u0119pna akcja</th></tr></thead>
          <tbody>
            ${readyOrders.map((o) => {
    const d = deliverableFor(o);
    return `<tr>
                <td>${E(o.clientName)}</td>
                <td class="mono">${d ? `<a href="#out-${E(d.id)}">${E(d.id)}</a>` : "\u2014"}</td>
                <td>${badge(statusLabel("client"), "warn")}</td>
                <td class="mono">${E(d?.createdByAgentId ?? "\u2014")}</td>
                <td>${E(departmentLabel(o.department))}</td>
                <td class="mono">${d?.qualityScore ?? "\u2014"}</td>
                <td class="mono">${d?.revisionCount ?? 0}</td>
                <td class="dim" style="font-size:11.5px"><a href="#${d ? `out-${E(d.id)}` : "orders-review"}">Zatwierd\u017A \u2192 Magazyn \xB7 Poprawka \xB7 Odrzu\u0107</a></td>
              </tr>`;
  }).join("")}
            ${pendingTraining.slice(0, 8).map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("training"), "muted")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="#out-${E(d.id)}">Akceptuj \xB7 Magazyn \xB7 Poprawka \xB7 Odrzu\u0107</a></td>
              </tr>`).join("")}
            ${reworkItems.map((d) => `<tr>
                <td>${E(preview(d.title, 46))}</td>
                <td class="mono"><a href="#out-${E(d.id)}">${E(d.id)}</a></td>
                <td>${badge(statusLabel("rework"), "warn")}</td>
                <td class="mono">${E(d.createdByAgentId)}</td>
                <td>${E(departmentLabel(d.department))}</td>
                <td class="mono">${d.qualityScore}</td>
                <td class="mono">${d.revisionCount}</td>
                <td class="dim" style="font-size:11.5px">Odtworzy si\u0119 w kolejnym cyklu \u2014 u\u017Cyj "Uruchom Cykl Treningowy"</td>
              </tr>`).join("")}
            ${packsDraft.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack draft"), "info")}</td>
                <td class="mono">\u2014</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">\u2014</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zatwierd\u017A pakiet na /delivery</a></td>
              </tr>`).join("")}
            ${packsApproved.map((p) => `<tr>
                <td>${E(p.clientName)}</td>
                <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
                <td>${badge(statusLabel("pack approved"), "ok")}</td>
                <td class="mono">\u2014</td>
                <td>${E(p.serviceName)}</td>
                <td class="mono">\u2014</td>
                <td class="mono">${p.revisionCount}</td>
                <td class="dim" style="font-size:11.5px"><a href="/delivery#pack-${E(p.id)}">Zmagazynuj pakiet na /delivery</a></td>
              </tr>`).join("")}
          </tbody>
        </table>` : ""}
      </div>
    </div>
  </section>

  <section class="admin-panel">
    <h2>Ostatnie Przebiegi Pracy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Kliknij przebieg, by zobaczy\u0107 ka\u017Cdy krok agenta: wej\u015Bcie, wyj\u015Bcie, ograniczenia, czas.</p>
    ${recentRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebieg\xF3w pracy.</p>' : recentRuns.map((run, i) => `
    <details class="run-drill"${i === 0 ? " open" : ""}>
      <summary>
        <span class="mono dim">${E(run.id)}</span>
        ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : run.mode === "REWORK_MODE" ? "warn" : "info")}
        ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
        <span class="dim" style="font-size:11.5px">wyzwolone przez: ${E(run.trigger)} \xB7 ${E(run.startedAt.slice(0, 19).replace("T", " "))} -> ${E(run.finishedAt.slice(11, 19))} \xB7 krok\xF3w: ${run.steps.length} \xB7 wyj\u015B\u0107: ${run.outputsCreated.length}</span>
      </summary>
      <div class="drill-body">
        ${run.idleReason ? `<div class="dim" style="font-size:12px">Pow\xF3d bezczynno\u015Bci: ${E(run.idleReason)}</div>` : ""}
        <div class="dim" style="font-size:12px">Nast\u0119pna akcja operatora: ${E(run.nextOperatorAction)}</div>
        ${run.outputsCreated.length ? `<div class="dim mono" style="font-size:11px;margin-top:4px">Utworzone wyj\u015Bcia: ${run.outputsCreated.map((o) => E(o)).join(", ")}</div>` : ""}
        <div class="timeline">${run.steps.map(renderStep).join("")}</div>
      </div>
    </details>`).join("")}
  </section>

  <section class="admin-panel">
    <h2>Pakiety Dostawy</h2>
    <p class="dim" style="font-size:12px;margin-bottom:8px">Artefakty gotowe dla klienta. Operator dostarcza je r\u0119cznie \u2014 fabryka nigdy nie wysy\u0142a. Pe\u0142ny widok: <a href="/delivery" style="color:#58a6ff">/delivery</a></p>
    ${state.deliveryPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w dostawy. U\u017Cyj "Zatwierd\u017A -> Pakiet Dostawy" na wyniku klienta.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th><th>Wyj\u015Bcie \u017Ar\xF3d\u0142owe</th><th>Zlecenie</th><th>Utworzono</th></tr></thead>
      <tbody>
        ${[...state.deliveryPacks].reverse().slice(0, 6).map((p) => `<tr>
          <td class="mono"><a href="/delivery#pack-${E(p.id)}">${E(p.id)}</a></td>
          <td>${E(p.clientName)}</td>
          <td>${E(p.serviceName)}</td>
          <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
          <td class="mono dim">${E(p.sourceOutputId)}</td>
          <td class="mono dim">${E(p.orderId)}</td>
          <td class="dim">${E(p.createdAt.slice(0, 16).replace("T", " "))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Podsumowanie Magazynu</h2>
    <p class="dim" style="margin-bottom:10px">${state.warehouse.length} ofert z pipeline'u i ${warehouseAssets.length} zasob\xF3w cyfrowych zatwierdzonych przez operatora. Nie istnieje tu \u017Cadna wysy\u0142ka zewn\u0119trzna, e-mail, push do CRM ani publikacja.</p>
    ${latestWarehouse.length === 0 ? '<p class="dim">Magazyn jest pusty.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Tytu\u0142</th><th>Typ</th><th>Dzia\u0142</th><th>Wynik</th><th>Data</th><th>Podgl\u0105d</th></tr></thead>
      <tbody>
        ${latestWarehouse.map((d) => `<tr>
          <td>${E(d.title)}</td>
          <td>${badge(d.orderId ? statusLabel("client order") : statusLabel("training"), d.orderId ? "warn" : "muted")}</td>
          <td>${badge(departmentLabel(d.department), "info")}</td>
          <td class="mono">${d.qualityScore}</td>
          <td class="dim">${E(d.date)}</td>
          <td class="dim" style="font-size:12px">${E(preview(d.content, 140))}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-panel">
    <h2>Strumie\u0144 Zdarze\u0144</h2>
    ${criticalEvents.length === 0 ? '<p class="dim">Brak istotnych zdarze\u0144.</p>' : `
    <table class="admin-table">
      <thead><tr><th>Czas</th><th>Agent</th><th>Zdarzenie</th><th>Szczeg\xF3\u0142y</th></tr></thead>
      <tbody>
        ${criticalEvents.map((e) => `<tr>
          <td class="mono dim">${E(e.timestamp.slice(0, 19).replace("T", " "))}</td>
          <td>${badge(e.agentId, "info")}</td>
          <td>${badge(e.eventType, eventBadgeCls(e.eventType))}</td>
          <td class="dim" style="font-size:12px">${E(e.detail)}</td>
        </tr>`).join("")}
      </tbody>
    </table>`}
  </section>

  <section class="admin-safety">
    <div class="admin-panel danger">
      <h2>Znane Ryzyka / Skrzynka Bezpiecze\u0144stwa</h2>
      <ul>
        <li>JsonStore jest jednoprocesowy; dwa serwery mog\u0105 nadpisa\u0107 sobie zapisy.</li>
        <li>events.json ro\u015Bnie bez ogranicze\u0144 i przy du\u017Cym wolumenie b\u0119dzie wymaga\u0107 rotacji.</li>
        <li>Przed dodaniem asynchronicznych wywo\u0142a\u0144 LLM do cykli wymagany jest mutex.</li>
        <li>Brak wysy\u0142ki zewn\u0119trznej, publikacji, scrapingu, push do CRM, e-maili czy wydatk\xF3w na reklam\u0119.</li>
        <li>Zgoda operatora jest wymagana, zanim jakikolwiek zas\xF3b opu\u015Bci fabryk\u0119.</li>
        <li>Pakiety dostawy s\u0105 artefaktami wewn\u0119trznymi \u2014 operator zawsze jest w\u0142a\u015Bcicielem dostawy.</li>
      </ul>
    </div>
    <div class="admin-panel">
      <h2>Zasady Edycji w Panelu</h2>
      <ul>
        <li>Ka\u017Cdy zapis to jawny przycisk operatora lub wys\u0142anie formularza.</li>
        <li>Zlecenia klient\xF3w u\u017Cywaj\u0105 istniej\u0105cej bia\u0142ej listy dzia\u0142\xF3w.</li>
        <li>Decyzje z przegl\u0105du u\u017Cywaj\u0105 istniej\u0105cych, logowanych zdarzeniami akcji dziennych.</li>
        <li>Brak surowej edycji JSON i brak destrukcyjnych zbiorczych mutacji.</li>
        <li>Bramka zatwierdzenia nie mo\u017Ce zosta\u0107 omini\u0119ta z poziomu tego kokpitu.</li>
      </ul>
    </div>
  </section>
</div>`);
}
function renderDelivery(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const packs = [...state.deliveryPacks].reverse();
  const statusCls = (st) => st === "warehouse_ready" ? "ok" : st === "approved" ? "info" : "warn";
  return layout("Pakiety Dostawy", "/delivery", `
<h1>Pakiety Dostawy</h1>
<p class="sub">Artefakty gotowe dla klienta, przygotowane przez fabryk\u0119. <strong style="color:#f85149">Fabryka nigdy nie wysy\u0142a \u2014 operator kopiuje pakiet i dostarcza go r\u0119cznie.</strong></p>
${flashHtml}
${packs.length === 0 ? '<p class="dim">Brak pakiet\xF3w. Na /admin u\u017Cyj "Zatwierd\u017A -> Pakiet Dostawy" na wyniku klienta.</p>' : packs.map((p) => `
<div class="admin-order" id="pack-${E(p.id)}">
  <div class="daily-header">
    ${badge(statusLabel(p.status), statusCls(p.status))}
    <span class="daily-title">${E(p.serviceName)} \u2014 ${E(p.clientName)}</span>
    <span class="mono dim" style="font-size:11px">${E(p.id)} \xB7 rev ${p.revisionCount} \xB7 ${E(p.date)}</span>
    <span class="mono dim" style="font-size:11px">\u017Ar\xF3d\u0142o ${E(p.sourceOutputId)} \xB7 zlecenie ${E(p.orderId)}</span>
  </div>
  <div class="offer-pre" style="max-height:340px">${E(renderPackMarkdown(p))}</div>
  <div class="admin-actions" style="margin-top:8px">
    ${p.status === "draft" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="approve">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zatwierd\u017A Pakiet</button>
    </form>` : ""}
    ${p.status === "approved" ? `
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="action" value="warehouse">
      <input type="hidden" name="id" value="${E(p.id)}">
      <button class="ok" type="submit">Zmagazynuj Pakiet + Kart\u0119 Sprawy</button>
    </form>` : ""}
    ${p.status === "warehouse_ready" ? `<span class="dim" style="font-size:12px">gotowe do magazynu \u2014 skopiuj markdown powy\u017Cej i dostarcz przez w\u0142asny kana\u0142.</span>` : ""}
  </div>
</div>`).join("")}

<h2>Karty Spraw (${state.caseRecords.length})</h2>
${state.caseRecords.length === 0 ? '<p class="dim">Brak spraw \u2014 zmagazynowanie zatwierdzonego pakietu tworzy jedn\u0105.</p>' : `
<table>
<thead><tr><th>Sprawa</th><th>Klient</th><th>Us\u0142uga</th><th>Problem</th><th>Pakiet</th><th>Kolejny krok</th><th>Utworzono</th></tr></thead>
<tbody>
${[...state.caseRecords].reverse().map((c) => `<tr>
  <td class="mono">${E(c.id)}</td>
  <td>${E(c.clientName)}</td>
  <td>${E(c.serviceName)}</td>
  <td class="dim" style="font-size:12px">${E(c.problem.slice(0, 90))}</td>
  <td class="mono dim">${E(c.deliveryPackId)}</td>
  <td class="dim" style="font-size:12px">${E(c.followUpSuggestion)}</td>
  <td class="dim">${E(c.createdAt.slice(0, 10))}</td>
</tr>`).join("")}
</tbody>
</table>`}`);
}
function renderFactoryRun(state, flash) {
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const ops = deriveOps(state);
  const latestClientOutput = [...state.dailyDigitals].reverse().find((d) => d.orderId);
  const latestOrder = latestClientOutput?.orderId ? state.orders.find((o) => o.id === latestClientOutput.orderId) : void 0;
  const recentPacks = [...state.deliveryPacks].reverse().slice(0, 5);
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px";
  return layout("Start Dnia", "/factory-run", `
<h1>Start Dnia \u2014 jedna strona do prowadzenia dnia</h1>
<p class="sub">
  ${badge(modeLabel(ops.mode), ops.mode === "IDLE" ? "muted" : "info")}
  ${badge(autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
</p>
${flashHtml}

<div class="idle-box" style="margin-bottom:14px">
  <div class="kicker">Dlaczego Stoi w Miejscu</div>
  <strong>${E(ops.standingStill)}</strong>
  <div class="dim" style="font-size:12px;margin-top:4px">Nast\u0119pna akcja operatora: ${E(ops.nextActionTitle)} \u2014 ${E(ops.nextActionDetail)}</div>
</div>

<h2>Katalog Us\u0142ug (${SERVICE_CATALOG.length})</h2>
<table>
<thead><tr><th>Us\u0142uga</th><th>Dla kogo</th><th>Obietnica</th><th>Dzia\u0142</th><th>Deliverable</th></tr></thead>
<tbody>
${SERVICE_CATALOG.map((sv) => `<tr>
  <td><strong>${E(sv.name)}</strong><br><span class="mono dim" style="font-size:10.5px">${E(sv.id)}</span></td>
  <td class="dim" style="font-size:12px">${E(sv.targetCustomer)}</td>
  <td class="dim" style="font-size:12px">${E(sv.promise)}</td>
  <td>${badge(departmentLabel(sv.defaultDepartment), "info")}</td>
  <td class="dim" style="font-size:11.5px">${E(sv.expectedDeliverables.join(" \xB7 "))}</td>
</tr>`).join("")}
</tbody>
</table>

<div class="form-card">
  <label>Nowe zlecenie klienta \u2014 wybierz us\u0142ug\u0119, opisz sytuacj\u0119 klienta</label>
  <form method="POST" action="/api/order">
    <input type="hidden" name="returnTo" value="/factory-run">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <input name="clientName" placeholder="Nazwa klienta / firmy" required style="flex:1;min-width:170px;${inputStyle}">
      <select name="serviceId" style="${inputStyle}">
        <option value="">\u2014 us\u0142uga: dowolny brief \u2014</option>
        ${SERVICE_CATALOG.map((sv) => `<option value="${E(sv.id)}">${E(sv.name)}</option>`).join("")}
      </select>
      <select name="department" style="${inputStyle}">
        <option value="marketing">Marketing</option>
        <option value="sales">Sprzeda\u017C</option>
        <option value="delivery" selected>Realizacja</option>
        <option value="research">Badania</option>
        <option value="qa">QA</option>
      </select>
      <select name="language" style="${inputStyle}">
        <option value="EN">EN</option>
        <option value="PL">PL</option>
      </select>
      <select name="urgency" style="${inputStyle}">
        <option value="normal">normalny</option>
        <option value="high">wysoki</option>
      </select>
    </div>
    <textarea name="description" placeholder="Brief klienta \u2014 czym si\u0119 zajmuje, co go boli, co ma osi\u0105gn\u0105\u0107 wynik..." required></textarea>
    <input name="operatorNotes" placeholder="Notatki operatora (opcjonalnie)" style="width:100%;margin-top:8px;${inputStyle}">
    <div style="margin-top:8px"><button type="submit">Przyjmij Zlecenie -> Wyprodukuj Teraz</button></div>
  </form>
  <form method="POST" action="/api/demo-order" style="margin-top:10px">
    <input type="hidden" name="returnTo" value="/factory-run">
    <button type="submit">Utw\xF3rz Demo Zlecenie (HVAC TestCo \u2014 Audyt AI Workflow + Mini Demo)</button>
  </form>
</div>

<h2>Kolejka Przegl\u0105du</h2>
<table>
<tbody>
  <tr><th>Wyniki klient\xF3w gotowe do przegl\u0105du</th><td>${ops.waiting.ordersReadyForReview}</td></tr>
  <tr><th>Szkice treningowe czekaj\u0105ce</th><td>${ops.waiting.trainingDrafts}</td></tr>
  <tr><th>Poprawki czekaj\u0105ce na cykl</th><td>${ops.waiting.needsRework}</td></tr>
  <tr><th>Pakiety dostawy (szkic / zatwierdzone)</th><td>${ops.waiting.deliveryPacksDraft} / ${ops.waiting.deliveryPacksApproved}</td></tr>
</tbody>
</table>
<p class="dim" style="font-size:12px">Pe\u0142na kontrola przegl\u0105du jest na <a href="/admin" style="color:#58a6ff">/admin</a> i <a href="/delivery" style="color:#58a6ff">/delivery</a>.</p>

<h2>Najnowszy Wynik Klienta</h2>
${latestClientOutput ? `
<div class="admin-order" id="out-${E(latestClientOutput.id)}">
  <div class="daily-header">
    ${badge(statusLabel(latestClientOutput.status), latestClientOutput.status === "draft_ready" ? "warn" : "ok")}
    <span class="daily-title">${E(latestClientOutput.title)}</span>
    <span class="mono dim" style="font-size:11px">${E(latestClientOutput.id)} \xB7 od ${E(latestClientOutput.createdByAgentId)} \xB7 rev ${latestClientOutput.revisionCount}${latestOrder?.serviceName ? ` \xB7 ${E(latestOrder.serviceName)}` : ""}</span>
  </div>
  <div class="offer-pre" style="max-height:260px">${E(latestClientOutput.content)}</div>
  ${latestClientOutput.status === "draft_ready" ? `
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/delivery">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="create">
      <input type="hidden" name="outputId" value="${E(latestClientOutput.id)}">
      <button class="ok" type="submit">Zatwierd\u017A -> Pakiet Dostawy</button>
    </form>
    <form method="POST" action="/api/daily">
      <input type="hidden" name="returnTo" value="/factory-run">
      <input type="hidden" name="action" value="rework">
      <input type="hidden" name="id" value="${E(latestClientOutput.id)}">
      <input name="feedback" placeholder="Notatka do poprawki..." required>
      <button type="submit" style="background:#34270a;color:#d29922;border-color:#4d3c14">Zg\u0142o\u015B Poprawk\u0119</button>
    </form>
  </div>` : ""}
</div>` : '<p class="dim">Brak jeszcze wyniku klienta \u2014 dodaj zlecenie powy\u017Cej lub utw\xF3rz demo zlecenie.</p>'}

<h2>Gotowo\u015B\u0107 Pakiet\xF3w Dostawy</h2>
${recentPacks.length === 0 ? '<p class="dim">Brak pakiet\xF3w.</p>' : `
<table>
<thead><tr><th>Pakiet</th><th>Klient</th><th>Us\u0142uga</th><th>Status</th></tr></thead>
<tbody>
${recentPacks.map((p) => `<tr>
  <td class="mono"><a href="/delivery#pack-${E(p.id)}" style="color:#58a6ff">${E(p.id)}</a></td>
  <td>${E(p.clientName)}</td>
  <td>${E(p.serviceName)}</td>
  <td>${badge(statusLabel(p.status), p.status === "warehouse_ready" ? "ok" : p.status === "approved" ? "info" : "warn")}</td>
</tr>`).join("")}
</tbody>
</table>`}

<div class="admin-actions" style="margin-top:14px">
  <form method="POST" action="/api/daily">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="run">
    <button type="submit">Uruchom Cykl Teraz</button>
  </form>
  <form method="POST" action="/api/autopilot">
    <input type="hidden" name="returnTo" value="/factory-run">
    <input type="hidden" name="action" value="${autopilotEnabled ? "off" : "on"}">
    <button type="submit">${autopilotEnabled ? "Wstrzymaj Autopilota" : "Wzn\xF3w Autopilota"}</button>
  </form>
</div>`);
}
function plStatusBadgeCls(st) {
  if (st === "completed") return "ok";
  if (st === "waiting_review") return "warn";
  if (st === "ready_for_operator") return "info";
  if (st === "blocked") return "bad";
  if (st === "queued") return "info";
  return "muted";
}
function renderPlTask(t) {
  return `
<div class="pl-task ${t.status}">
  <div class="daily-header">
    ${badge(statusLabel(t.status), plStatusBadgeCls(t.status))}
    ${badge(t.agentId, "info")}
    ${badge(statusLabel(t.source), t.source === "client" ? "warn" : t.source === "rework" ? "bad" : t.source === "delivery_pack" ? "info" : "muted")}
    <span class="daily-title">${E(t.title)}</span>
    <span class="dim" style="font-size:11px">stacja: ${E(stationIdLabel(t.station))}${t.department ? ` \xB7 ${E(departmentLabel(t.department))}` : ""}${typeof t.revisionCount === "number" ? ` \xB7 rev ${t.revisionCount}` : ""}${typeof t.qualityScore === "number" ? ` \xB7 wynik ${t.qualityScore}` : ""}</span>
  </div>
  <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(t.inputSummary)}</div>
  <div class="dim" style="font-size:12px;margin-top:2px"><strong>Wyj\u015Bcie:</strong> ${E(t.outputSummary)}</div>
  ${t.outputId ? `<div class="dim mono" style="font-size:11px">output ${E(t.outputId)}${t.orderId ? ` \xB7 zlecenie ${E(t.orderId)}` : ""}${t.packId ? ` \xB7 pakiet ${E(t.packId)}` : ""}</div>` : ""}
  ${t.constraintsApplied?.length ? `<div class="dim" style="font-size:11px;margin-top:2px">ograniczenia: ${E(t.constraintsApplied.join(" | "))}</div>` : ""}
  <div class="dim" style="font-size:11.5px;margin-top:3px"><strong>Dalej:</strong> ${E(t.nextOperatorAction)}${t.nextStation ? ` (\u2192 ${E(stationIdLabel(t.nextStation))})` : ""}</div>
</div>`;
}
function renderProductionLine(state, flash) {
  const pl = productionLineFor(state);
  const flashHtml = flash ? `<div class="flash ${flash.startsWith("B\u0142\u0105d") ? "bad" : ""}">${E(flash)}</div>` : "";
  const inputStyle = "background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;font:13px ui-sans-serif,sans-serif;padding:6px 10px";
  const lineBlock = (title, tasks, empty) => `
<h2>${E(title)} (${tasks.length})</h2>
${tasks.length === 0 ? `<p class="dim">${E(empty)}</p>` : tasks.map(renderPlTask).join("")}`;
  return layout("Linia Produkcyjna", "/production-line", `
<h1>Linia Produkcyjna Agent\xF3w</h1>
<p class="sub">
  ${badge(modeLabel(pl.mode), pl.mode === "IDLE" ? "muted" : "info")}
  ${badge(pl.autopilotEnabled ? "autopilot W\u0141." : "autopilot WY\u0141.", pl.autopilotEnabled ? "ok" : "bad")}
  ${badge("TRYB BEZPIECZNY \u2014 brak wysy\u0142ki na zewn\u0105trz", "ok")}
  <span class="dim" style="font-size:12px">uczciwy widok synchroniczny \u2014 brak udawanych \u017Cywych agent\xF3w</span>
</p>
${flashHtml}

<section class="admin-grid" aria-label="Production Summary">
  <div class="admin-card"><div class="v info">${pl.activeClientOrders}</div><div class="l">Aktywne zlecenia klient\xF3w</div></div>
  <div class="admin-card"><div class="v info">${E(pl.trainingToday)}</div><div class="l">Limit treningu</div></div>
  <div class="admin-card"><div class="v ${pl.deliveryPacks.draft + pl.deliveryPacks.approved ? "warn" : "ok"}">${pl.deliveryPacks.draft}/${pl.deliveryPacks.approved}/${pl.deliveryPacks.warehouseReady}</div><div class="l">Pakiety szkic/zatw./gotowe</div></div>
  <div class="admin-card"><div class="v ${pl.reworkLine.length ? "warn" : "ok"}">${pl.reworkLine.length}</div><div class="l">Zadania poprawek</div></div>
</section>

<section class="admin-action">
  <h2>Nast\u0119pna Akcja Operatora</h2>
  <strong>${E(pl.nextOperatorAction)}</strong>
</section>

<h2>Tablica Stacji</h2>
<div class="station-board">
  ${pl.stations.map((st) => `
  <div class="station ${st.status}">
    <div class="sagent">${E(st.agentId)} \xB7 ${E(st.name)}</div>
    <div class="sname">${badge(statusLabel(st.status), plStatusBadgeCls(st.status))} <span class="dim" style="font-size:11px">zada\u0144: ${st.taskCount}</span></div>
    <div class="spurpose">${E(st.purpose)}</div>
    ${st.lastTask ? `
      <div class="sline"><strong>Ostatnie:</strong> ${E(plPreview(st.lastTask.title, 60))}</div>
      <div class="sline dim">${E(st.lastTask.nextOperatorAction)}</div>
    ` : `<div class="sline dim">Brak zadania na tej stacji.</div>`}
  </div>`).join("")}
</div>

<div class="form-card">
  <label>Utw\xF3rz Demo Przebieg Produkcyjny \u2014 jawni, wewn\u0119trzni, wyra\u017Anie fikcyjni klienci</label>
  <form method="POST" action="/api/demo-order">
    <input type="hidden" name="returnTo" value="/production-line">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <select name="demo" style="${inputStyle}">
        ${DEMO_CLIENTS.map((d) => `<option value="${E(d.key)}">${E(d.clientName)} \u2014 ${E(d.serviceId)}</option>`).join("")}
      </select>
      <button type="submit">Utw\xF3rz Demo Przebieg Produkcyjny</button>
    </div>
  </form>
  <div class="admin-actions" style="margin-top:8px">
    <form method="POST" action="/api/daily"><input type="hidden" name="returnTo" value="/production-line"><input type="hidden" name="action" value="run"><button type="submit">Uruchom Cykl Teraz</button></form>
  </div>
</div>

${lineBlock("Linia Klienta", pl.clientLine, "Brak zlece\u0144 klient\xF3w \u2014 utw\xF3rz demo przebieg produkcyjny powy\u017Cej.")}
${lineBlock("Linia Treningowa", pl.trainingLine, "Brak zada\u0144 treningowych dzi\u015B. Uruchom cykl bez otwartych zlece\u0144 klient\xF3w.")}
${lineBlock("Linia Poprawek", pl.reworkLine, "Nic nie jest oznaczone do poprawki.")}
${lineBlock("Linia Pakiet\xF3w Dostawy", pl.deliveryPackLine, "Brak pakiet\xF3w dostawy \u2014 zatwierd\u017A wynik klienta do pakietu.")}

<h2>Ostatnie Przebiegi</h2>
${state.workRuns.length === 0 ? '<p class="dim">Brak zarejestrowanych przebieg\xF3w produkcyjnych.</p>' : [...state.workRuns].reverse().slice(0, 6).map((run) => `
<details class="run-drill">
  <summary>
    <span class="mono dim">${E(run.id)}</span>
    ${badge(modeLabel(run.mode), run.mode === "IDLE" ? "muted" : "info")}
    ${badge(statusLabel(run.status), run.status === "failed" ? "bad" : "ok")}
    <span class="dim" style="font-size:11.5px">via ${E(run.trigger)} \xB7 ${E(run.startedAt.slice(0, 19).replace("T", " "))} \xB7 krok\xF3w: ${run.steps.length} \xB7 wyj\u015B\u0107: ${run.outputsCreated.length}</span>
  </summary>
  <div class="drill-body">
    <div class="dim" style="font-size:12px">Nast\u0119pna akcja operatora: ${E(run.nextOperatorAction)}</div>
    ${run.steps.map((step) => `<div class="pl-task ${step.status === "completed" ? "completed" : step.status === "failed" ? "blocked" : "skipped"}">
      <div class="daily-header">${badge(step.agentId, "info")} ${badge(statusLabel(step.status), step.status === "failed" ? "bad" : step.status === "skipped" ? "muted" : "ok")} <span class="daily-title">${E(step.agentName)}</span> <span class="dim" style="font-size:11px">${E(step.jobType)}</span></div>
      <div class="dim" style="font-size:12px"><strong>Wej\u015Bcie:</strong> ${E(step.inputSummary)}</div>
      ${step.outputSummary ? `<div class="dim" style="font-size:12px"><strong>Wyj\u015Bcie:</strong> ${E(step.outputSummary)}</div>` : ""}
      ${step.outputId ? `<div class="dim mono" style="font-size:11px">outputId: ${E(step.outputId)}</div>` : ""}
    </div>`).join("")}
  </div>
</details>`).join("")}`);
}
function renderEvents(state) {
  const events = [...state.events].reverse();
  return layout("Zdarzenia", "/events", `
<h1>Dziennik Zdarze\u0144</h1>
<p class="sub">${events.length} zdarze\u0144 \u2014 wszystkie decyzje pipeline'u zarejestrowane</p>
${events.length === 0 ? '<p class="dim">Brak zdarze\u0144.</p>' : `
<table>
<thead><tr><th>Agent</th><th>Zdarzenie</th><th>Sygna\u0142</th><th>Szczeg\xF3\u0142y</th><th>Czas</th></tr></thead>
<tbody>
${events.map((e) => {
    const cls = /fail|disqualified|bad|rejected/.test(e.eventType) ? "bad" : /qualified|passed|approved|warehouse/.test(e.eventType) ? "ok" : /required|revised/.test(e.eventType) ? "warn" : "info";
    return `<tr>
  <td>${badge(e.agentId, "info")}</td>
  <td>${badge(e.eventType, cls)}</td>
  <td class="mono dim">${E(e.signalId ?? "\u2014")}</td>
  <td class="dim" style="font-size:12px">${E(e.detail)}</td>
  <td class="dim mono" style="font-size:11px">${E(e.timestamp.slice(11, 19))}</td>
</tr>`;
  }).join("")}
</tbody>
</table>`}`);
}
async function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      const params = {};
      if (body.startsWith("{")) {
        try {
          Object.assign(params, JSON.parse(body));
        } catch {
        }
      } else {
        for (const pair of body.split("&")) {
          const [k, v] = pair.split("=");
          if (k) params[decodeURIComponent(k)] = decodeURIComponent((v ?? "").replace(/\+/g, " "));
        }
      }
      resolve(params);
    });
  });
}
function html(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(body);
}
function redirect(res, to) {
  res.writeHead(302, { Location: to });
  res.end();
}
function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
var requestHandler = async (req, res) => {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";
  const state = store.snapshot();
  try {
    if (method === "GET") {
      if (url === "/" || url === "/factory") {
        return html(res, renderFactory(state));
      }
      if (url === "/leads") return html(res, renderLeads(state));
      if (url === "/warehouse") return html(res, renderWarehouse(state));
      if (url === "/trash") return html(res, renderTrash(state));
      if (url === "/events") return html(res, renderEvents(state));
      if (url === "/daily-review") return html(res, renderDailyReview(state));
      if (url === "/orders") return html(res, renderOrders(state));
      if (url === "/admin" || url === "/operator") return html(res, renderAdmin(state));
      if (url === "/factory-run") return html(res, renderFactoryRun(state));
      if (url === "/delivery") return html(res, renderDelivery(state));
      if (url === "/production-line") return html(res, renderProductionLine(state));
      if (url === "/api/admin/state") {
        const ops = deriveOps(state);
        return json(res, {
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          autopilotEnabled,
          lastCycleSummary,
          mode: ops.mode,
          standingStill: ops.standingStill,
          nextOperatorAction: { title: ops.nextActionTitle, detail: ops.nextActionDetail },
          waiting: ops.waiting,
          integrity: getIntegrityRecords(store),
          businessLoop: {
            servicesInCatalog: SERVICE_CATALOG.length,
            activeOrders: state.orders.filter((o) => o.status === "new" || o.status === "in_production").length,
            ordersReadyForReview: state.orders.filter((o) => o.status === "ready_for_review").length,
            deliveryPacks: {
              draft: state.deliveryPacks.filter((p) => p.status === "draft").length,
              approved: state.deliveryPacks.filter((p) => p.status === "approved").length,
              warehouseReady: state.deliveryPacks.filter((p) => p.status === "warehouse_ready").length
            },
            caseRecords: state.caseRecords.length,
            trainingToday: `${ops.trainingToday}/5`
          },
          counts: {
            orders: state.orders.length,
            dailyDigitals: state.dailyDigitals.length,
            trainingToday: `${ops.trainingToday}/5`,
            warehouseOffers: state.warehouse.length,
            warehouseAssets: state.dailyDigitals.filter((d) => d.location === "warehouse").length,
            trash: state.trash.length + state.dailyDigitals.filter((d) => d.location === "trash").length,
            events: state.events.length,
            workRuns: state.workRuns.length
          },
          orders: state.orders.map((o) => ({
            id: o.id,
            clientName: o.clientName,
            department: o.department,
            taskType: o.taskType,
            status: o.status,
            deliverableId: o.deliverableId,
            revisionCount: o.revisionCount,
            updatedAt: o.updatedAt
          })),
          latestWorkRun: state.workRuns[state.workRuns.length - 1] ?? null,
          workRunsSummary: [...state.workRuns].reverse().slice(0, 10).map((r) => ({
            id: r.id,
            mode: r.mode,
            status: r.status,
            trigger: r.trigger,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
            steps: r.steps.length,
            outputsCreated: r.outputsCreated,
            idleReason: r.idleReason,
            nextOperatorAction: r.nextOperatorAction
          }))
        });
      }
      if (url === "/api/work-runs") {
        return json(res, {
          total: state.workRuns.length,
          workRuns: [...state.workRuns].reverse().slice(0, 20)
        });
      }
      if (url === "/api/production-line") {
        return json(res, productionLineFor(state));
      }
      if (url === "/api/delivery-packs") {
        return json(res, {
          total: state.deliveryPacks.length,
          packs: [...state.deliveryPacks].reverse().slice(0, 20),
          caseRecords: [...state.caseRecords].reverse().slice(0, 20)
        });
      }
      return html(res, "<h1>404</h1>", 404);
    }
    if (method === "POST" && url === "/api/signal") {
      const params = await readBody(req);
      const raw = (params["raw"] ?? "").trim();
      if (!raw) {
        const errState = store.snapshot();
        return html(res, renderFactory(errState, "B\u0142\u0105d: wymagany jest tekst sygna\u0142u"));
      }
      let result;
      try {
        result = await runOfferAcquisitionForSignal(raw, store);
      } catch (err) {
        const errState = store.snapshot();
        return html(res, renderFactory(errState, `B\u0142\u0105d: ${String(err)}`));
      }
      const newState = store.snapshot();
      const flash = result.status === "awaiting_approval" ? `Pipeline zako\u0144czony \u2014 oferta czeka na Twoje zatwierdzenie (${result.approval?.id})` : result.status === "disqualified" ? `Sygna\u0142 zdyskwalifikowany \u2014 nie pasuje do ICP` : `Pipeline nie powi\xF3d\u0142 si\u0119 po ewaluacji`;
      return html(res, renderFactory(newState, flash));
    }
    if (method === "POST" && url === "/api/action") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const id = params["id"] ?? "";
      const item = store.getApprovalItem(id);
      const returnToAdmin = params["returnTo"] === "/admin";
      if (action === "approve" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "approved", decidedAt: (/* @__PURE__ */ new Date()).toISOString() });
        const updated = store.getApprovalItem(id);
        const warehouseItem = agentI(updated);
        store.addWarehouseItem(warehouseItem);
        store.addEvent({
          id: randomUUID8(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId: "I",
          eventType: "approval.granted",
          signalId: item.signalId,
          detail: `Operator approved ${id} \u2192 warehouse`
        });
      } else if (action === "reject" && item && item.status === "pending") {
        store.updateApprovalItem(id, { status: "rejected", decidedAt: (/* @__PURE__ */ new Date()).toISOString() });
        store.addTrashItem({
          id: `trash-rej-${id}`,
          signalId: item.signalId,
          reason: `Operator rejected offer ${id}`,
          trashedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        store.addEvent({
          id: randomUUID8(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          agentId: "H",
          eventType: "approval.rejected",
          signalId: item.signalId,
          detail: `Operator rejected ${id}`
        });
      }
      const accept = req.headers["accept"] ?? "";
      if (accept.includes("application/json")) {
        return json(res, { ok: true });
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), "Decyzja zatwierdzenia zarejestrowana."));
      }
      return redirect(res, "/");
    }
    if (method === "POST" && url === "/api/daily") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const id = params["id"] ?? "";
      const feedback = (params["feedback"] ?? "").trim();
      const date = params["date"] ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      const returnToPl = params["returnTo"] === "/production-line";
      const digitalBefore = store.getDailyDigital(id);
      const orderId = digitalBefore?.orderId;
      const respond = (flash) => returnToPl ? html(res, renderProductionLine(store.snapshot(), flash)) : returnToRun ? html(res, renderFactoryRun(store.snapshot(), flash)) : returnToAdmin ? html(res, renderAdmin(store.snapshot(), flash)) : orderId ? html(res, renderOrders(store.snapshot(), flash)) : html(res, renderDailyReview(store.snapshot(), flash));
      const syncOrder = (status, fb) => {
        if (!orderId) return;
        store.updateOrder(orderId, {
          status,
          ...fb ? { operatorFeedback: fb } : {},
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      };
      if (action === "run") {
        try {
          const result = await runAutonomousCycle(store, date, "daily_run");
          lastCycleSummary = `${modeLabel(result.mode)}: trening=${result.trainingCreated} zlecenia=${result.ordersProduced.length} poprawki=${result.reworksRegenerated.length}`;
          return respond(`Cykl zako\u0144czony \u2014 ${lastCycleSummary}`);
        } catch (err) {
          return respond(`B\u0142\u0105d: ${String(err)}`);
        }
      }
      if (action === "accept" && id) {
        acceptDigital(store, id);
        syncOrder("approved");
        return respond("Zaakceptowano.");
      }
      if (action === "rework" && id && feedback) {
        reworkDigital(store, id, feedback);
        syncOrder("in_production", feedback);
        return respond("Oznaczono do poprawki \u2014 autopilot odtworzy to z Twoim feedbackiem.");
      }
      if (action === "reject" && id && feedback) {
        rejectDigital(store, id, feedback);
        syncOrder("rejected", feedback);
        return respond("Odrzucono i przeniesiono do kosza.");
      }
      if (action === "warehouse" && id) {
        warehouseDigital(store, id);
        syncOrder("approved");
        return respond("Wys\u0142ano do magazynu.");
      }
      return respond("B\u0142\u0105d: nieznana akcja lub brak id/feedbacku.");
    }
    if (method === "POST" && url === "/api/order") {
      const params = await readBody(req);
      const clientName = (params["clientName"] ?? "").trim();
      const description = (params["description"] ?? "").trim();
      const contact = (params["contact"] ?? "").trim();
      const departmentRaw = (params["department"] ?? "delivery").trim();
      const serviceIdRaw = (params["serviceId"] ?? "").trim();
      const languageRaw = (params["language"] ?? "").trim().toUpperCase();
      const urgencyRaw = (params["urgency"] ?? "").trim();
      const operatorNotes = (params["operatorNotes"] ?? "").trim();
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      if (serviceIdRaw && !isValidServiceId(serviceIdRaw)) {
        return json(res, { error: "invalid service", received: serviceIdRaw, allowed: SERVICE_CATALOG.map((sv) => sv.id) }, 400);
      }
      if (!VALID_DEPARTMENTS.includes(departmentRaw)) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), `B\u0142\u0105d: nieprawid\u0142owy dzia\u0142 ${departmentRaw}`), 400);
        }
        return json(res, { error: "invalid department", received: departmentRaw, allowed: VALID_DEPARTMENTS }, 400);
      }
      const department = departmentRaw;
      if (!clientName || !description) {
        if (returnToAdmin) {
          return html(res, renderAdmin(store.snapshot(), "B\u0142\u0105d: wymagana jest nazwa klienta i opis"));
        }
        return html(res, renderOrders(store.snapshot(), "B\u0142\u0105d: wymagana jest nazwa klienta i opis"));
      }
      const order = createOrder(store, {
        clientName,
        description,
        department,
        ...contact ? { contact } : {},
        ...serviceIdRaw ? { serviceId: serviceIdRaw } : {},
        ...languageRaw === "PL" || languageRaw === "EN" ? { language: languageRaw } : {},
        ...urgencyRaw === "high" ? { urgency: "high" } : {},
        ...operatorNotes ? { operatorNotes } : {}
      });
      const result = await runAutonomousCycle(store, void 0, "order_created");
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`;
      if (returnToRun) {
        return html(res, renderFactoryRun(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj poni\u017Cej lub na /admin.`));
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj deliverable poni\u017Cej.`));
      }
      return html(res, renderOrders(store.snapshot(), `Zlecenie ${order.id} przyj\u0119te i wyprodukowane \u2014 przejrzyj deliverable poni\u017Cej.`));
    }
    if (method === "POST" && url === "/api/delivery") {
      const params = await readBody(req);
      const action = params["action"] ?? "";
      const returnToAdmin = params["returnTo"] === "/admin";
      const returnToRun = params["returnTo"] === "/factory-run";
      const respond = (flash) => returnToAdmin ? html(res, renderAdmin(store.snapshot(), flash)) : returnToRun ? html(res, renderFactoryRun(store.snapshot(), flash)) : html(res, renderDelivery(store.snapshot(), flash));
      if (action === "create") {
        const outputId = (params["outputId"] ?? "").trim();
        const digital = store.getDailyDigital(outputId);
        if (!digital?.orderId) return respond("B\u0142\u0105d: wyj\u015Bcie nie znalezione lub nie jest deliverablem zlecenia klienta.");
        if (digital.status === "draft_ready") {
          warehouseDigital(store, outputId);
          store.updateOrder(digital.orderId, { status: "approved", updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
        }
        const pack = createDeliveryPack(store, outputId);
        return respond(pack ? `Pakiet dostawy ${pack.id} utworzony (szkic) \u2014 przejrzyj go na /delivery.` : "B\u0142\u0105d: nie uda\u0142o si\u0119 utworzy\u0107 pakietu.");
      }
      if (action === "approve") {
        const pack = approveDeliveryPack(store, (params["id"] ?? "").trim());
        return respond(pack ? `Pakiet ${pack.id} zatwierdzony \u2014 zmagazynuj go, gdy b\u0119dzie gotowy.` : "B\u0142\u0105d: pakiet nie znaleziony lub nie jest w szkicu.");
      }
      if (action === "warehouse") {
        const record = warehouseDeliveryPack(store, (params["id"] ?? "").trim());
        return respond(record ? `Pakiet zmagazynowany \u2014 sprawa ${record.id} zarejestrowana. Operator dostarcza r\u0119cznie.` : "B\u0142\u0105d: pakiet nie znaleziony lub nie zatwierdzony.");
      }
      return respond("B\u0142\u0105d: nieznana akcja dostawy.");
    }
    if (method === "POST" && url === "/api/demo-order") {
      const params = await readBody(req);
      const returnTo = params["returnTo"] ?? "";
      const demo = DEMO_CLIENTS.find((d) => d.key === (params["demo"] ?? "").trim()) ?? DEMO_CLIENTS[0];
      const respond = (flash) => returnTo === "/admin" ? html(res, renderAdmin(store.snapshot(), flash)) : returnTo === "/production-line" ? html(res, renderProductionLine(store.snapshot(), flash)) : html(res, renderFactoryRun(store.snapshot(), flash));
      const existing = store.snapshot().orders.find(
        (o) => o.clientName === demo.clientName && (o.status === "new" || o.status === "in_production" || o.status === "ready_for_review")
      );
      if (existing) {
        return respond(`Demo zlecenie ${existing.id} dla ${demo.clientName} jest ju\u017C aktywne \u2014 przejrzyj je zamiast duplikowa\u0107.`);
      }
      const order = createOrder(store, {
        clientName: demo.clientName,
        department: "delivery",
        serviceId: demo.serviceId,
        language: demo.language,
        description: demo.description
      });
      const result = await runAutonomousCycle(store, void 0, "order_created");
      lastCycleSummary = `${modeLabel(result.mode)}: zlecenia=${result.ordersProduced.length}`;
      return respond(`Demo przebieg produkcyjny ${order.id} utworzony dla ${demo.clientName} (${demo.serviceId}) \u2014 tylko wewn\u0119trznie, nic nigdzie nie zosta\u0142o wys\u0142ane.`);
    }
    if (method === "POST" && url === "/api/integrity") {
      const params = await readBody(req);
      const agentIdRaw = (params["agentId"] ?? "").trim();
      if (!agentIdRaw) {
        return json(res, { error: "missing agentId" }, 400);
      }
      if (!PRODUCER_AGENTS.includes(agentIdRaw)) {
        return json(res, { error: "invalid agent", received: agentIdRaw, allowed: PRODUCER_AGENTS }, 400);
      }
      if ((params["action"] ?? "") !== "reset") {
        return json(res, { error: "unknown integrity action" }, 400);
      }
      const reasonRaw = (params["reason"] ?? "").trim();
      if (!reasonRaw) {
        return json(res, { error: "missing reason", allowed: INTEGRITY_RESET_REASONS }, 400);
      }
      if (!isValidResetReason(reasonRaw)) {
        return json(res, { error: "invalid reason", received: reasonRaw, allowed: INTEGRITY_RESET_REASONS }, 400);
      }
      const note = (params["note"] ?? "").trim();
      const updated = resetAgentIntegrity(store, agentIdRaw, reasonRaw, note || void 0);
      return html(res, renderAdmin(
        store.snapshot(),
        updated ? `Reset integralno\u015Bci dla ${agentIdRaw} (${reasonRaw}) \u2014 produkcja kliencka ponownie w\u0142\u0105czona (decyzja God Layer).` : `Nic do zresetowania dla ${agentIdRaw} \u2014 nos ju\u017C na 0.`
      ));
    }
    if (method === "POST" && url === "/api/autopilot") {
      const params = await readBody(req);
      const returnToAdmin = params["returnTo"] === "/admin";
      autopilotEnabled = params["action"] !== "off";
      store.setAutopilotEnabled(autopilotEnabled);
      store.addEvent({
        id: randomUUID8(),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        agentId: "N",
        eventType: autopilotEnabled ? "factory.autopilot_on" : "factory.autopilot_off",
        detail: `Operator turned autopilot ${autopilotEnabled ? "on" : "off"}`
      });
      if (params["returnTo"] === "/factory-run") {
        return html(res, renderFactoryRun(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
      }
      if (returnToAdmin) {
        return html(res, renderAdmin(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
      }
      return html(res, renderFactory(store.snapshot(), `Autopilot ${autopilotEnabled ? "wznowiony" : "wstrzymany"}.`));
    }
    html(res, "<h1>404</h1>", 404);
  } catch (err) {
    console.error(err);
    html(res, `<pre>500: ${E(String(err))}</pre>`, 500);
  }
};
var server = createServer(requestHandler);
var seeded = false;
async function ensureSeeded() {
  if (seeded) return;
  seeded = true;
  try {
    if (store.snapshot().workRuns.length === 0) {
      const r = await runAutonomousCycle(store, void 0, "startup");
      lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`;
    }
  } catch (err) {
    console.error("[seed] failed:", err);
  }
}
async function autopilotTick(trigger = "timer") {
  if (!autopilotEnabled) return;
  try {
    const r = await runAutonomousCycle(store, void 0, trigger);
    lastCycleSummary = `${modeLabel(r.mode)}: trening=${r.trainingCreated} zlecenia=${r.ordersProduced.length} poprawki=${r.reworksRegenerated.length}`;
    if (r.ordersProduced.length + r.reworksRegenerated.length + r.trainingCreated > 0) {
      console.log(`[autopilot] ${lastCycleSummary}`);
    }
  } catch (err) {
    console.error("[autopilot] cycle failed:", err);
  }
}
if (!ON_VERCEL) {
  setInterval(() => void autopilotTick("timer"), 6e4);
  server.listen(PORT, () => {
    console.log(`
Factory Core v0.2 \u2014 http://localhost:${PORT}`);
    console.log("  /admin        \u2014 boss/admin cockpit");
    console.log("  /operator     \u2014 admin cockpit alias");
    console.log("  /api/admin/state \u2014 read-only cockpit state (JSON)");
    console.log("  /api/work-runs   \u2014 read-only recent work runs (JSON)");
    console.log("  /factory-run  \u2014 run the whole business loop from one page");
    console.log("  /delivery     \u2014 delivery packs + case records");
    console.log("  /api/delivery-packs \u2014 read-only packs + cases (JSON)");
    console.log("  /production-line \u2014 agent production floor view");
    console.log("  /api/production-line \u2014 read-only production line (JSON)");
    console.log("  / or /factory  \u2014 pipeline overview + signal form + autopilot toggle");
    console.log("  /orders        \u2014 client orders: intake, production, review");
    console.log("  /leads         \u2014 qualified leads");
    console.log("  /warehouse     \u2014 approved offers + digital assets");
    console.log("  /trash         \u2014 disqualified / failed / rejected");
    console.log("  /events        \u2014 full event log");
    console.log("  /daily-review  \u2014 NO_CLIENT_TRAINING_MODE daily review");
    console.log("\nAutopilot: ON (60s cycle) \u2014 orders \u2192 reworks \u2192 5 random daily training missions.");
    console.log("Press Ctrl+C to stop.\n");
    void autopilotTick("startup");
  });
}

// scripts/vercel-entry.ts
async function handler(req, res) {
  await ensureSeeded();
  await requestHandler(req, res);
}
export {
  handler as default
};
