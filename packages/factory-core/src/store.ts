import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs"
import { join, dirname } from "node:path"
import type {
  FactoryState,
  Signal,
  QualifiedLead,
  ApprovalItem,
  WarehouseItem,
  TrashItem,
  FactoryEvent,
  DailyDigital,
  DailyDigitalDepartment,
  DailyMission,
  FeedbackEvent,
  ClientOrder,
  FactoryWorkRun,
  DeliveryPack,
  CaseRecord,
} from "./types.js"

export class JsonStore<T> {
  readonly #path: string
  #data: T

  constructor(path: string, initial: T) {
    this.#path = path
    const dir = dirname(path)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    if (existsSync(path)) {
      this.#data = JSON.parse(readFileSync(path, "utf-8")) as T
    } else {
      this.#data = initial
      this.#write()
    }
  }

  read(): T {
    return this.#data
  }

  update(fn: (data: T) => T): void {
    this.#data = fn(this.#data)
    this.#write()
  }

  #write(): void {
    const tmp = this.#path + ".tmp"
    writeFileSync(tmp, JSON.stringify(this.#data, null, 2), "utf-8")
    renameSync(tmp, this.#path)
  }
}

/** Operator-controlled runtime settings that must survive a restart. */
type FactorySettings = { autopilotEnabled: boolean }

export class FactoryStore {
  readonly #signals: JsonStore<Signal[]>
  readonly #leads: JsonStore<QualifiedLead[]>
  readonly #approval: JsonStore<ApprovalItem[]>
  readonly #warehouse: JsonStore<WarehouseItem[]>
  readonly #trash: JsonStore<TrashItem[]>
  readonly #events: JsonStore<FactoryEvent[]>
  readonly #dailyDigitals: JsonStore<DailyDigital[]>
  readonly #dailyMissions: JsonStore<DailyMission[]>
  readonly #feedbackEvents: JsonStore<FeedbackEvent[]>
  readonly #orders: JsonStore<ClientOrder[]>
  readonly #settings: JsonStore<FactorySettings>
  readonly #workRuns: JsonStore<FactoryWorkRun[]>
  readonly #deliveryPacks: JsonStore<DeliveryPack[]>
  readonly #caseRecords: JsonStore<CaseRecord[]>

  constructor(dataDir: string) {
    const p = (name: string) => join(dataDir, `${name}.json`)
    this.#signals = new JsonStore(p("signals"), [])
    this.#leads = new JsonStore(p("leads"), [])
    this.#approval = new JsonStore(p("approval"), [])
    this.#warehouse = new JsonStore(p("warehouse"), [])
    this.#trash = new JsonStore(p("trash"), [])
    this.#events = new JsonStore(p("events"), [])
    this.#dailyDigitals = new JsonStore(p("daily-digitals"), [])
    this.#dailyMissions = new JsonStore(p("daily-missions"), [])
    this.#feedbackEvents = new JsonStore(p("feedback-events"), [])
    this.#orders = new JsonStore(p("orders"), [])
    this.#settings = new JsonStore(p("settings"), { autopilotEnabled: true })
    this.#workRuns = new JsonStore(p("work-runs"), [])
    this.#deliveryPacks = new JsonStore(p("delivery-packs"), [])
    this.#caseRecords = new JsonStore(p("case-records"), [])
  }

  snapshot(): FactoryState {
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
    }
  }

  // --- Pipeline ---

  addSignal(s: Signal): void {
    this.#signals.update((arr) => [...arr, s])
  }

  updateSignal(id: string, patch: Partial<Signal>): void {
    this.#signals.update((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  addLead(l: QualifiedLead): void {
    this.#leads.update((arr) => [...arr, l])
  }

  addApprovalItem(item: ApprovalItem): void {
    this.#approval.update((arr) => [...arr, item])
  }

  updateApprovalItem(id: string, patch: Partial<ApprovalItem>): void {
    this.#approval.update((arr) => arr.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  addWarehouseItem(item: WarehouseItem): void {
    this.#warehouse.update((arr) => [...arr, item])
  }

  addTrashItem(item: TrashItem): void {
    this.#trash.update((arr) => [...arr, item])
  }

  addEvent(e: FactoryEvent): void {
    this.#events.update((arr) => [...arr, e])
  }

  getApprovalItem(id: string): ApprovalItem | undefined {
    return this.#approval.read().find((a) => a.id === id)
  }

  // --- Daily Missions ---

  addDailyDigital(d: DailyDigital): void {
    this.#dailyDigitals.update((arr) => [...arr, d])
  }

  updateDailyDigital(id: string, patch: Partial<DailyDigital>): void {
    this.#dailyDigitals.update((arr) => arr.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  getDailyDigital(id: string): DailyDigital | undefined {
    return this.#dailyDigitals.read().find((d) => d.id === id)
  }

  getDailyDigitalsForDate(date: string): DailyDigital[] {
    return this.#dailyDigitals.read().filter((d) => d.date === date)
  }

  addDailyMission(m: DailyMission): void {
    this.#dailyMissions.update((arr) => [...arr, m])
  }

  addFeedbackEvent(e: FeedbackEvent): void {
    this.#feedbackEvents.update((arr) => [...arr, e])
  }

  /** Digitals flagged needs_rework — the autopilot regenerates these. */
  getDigitalsNeedingRework(): DailyDigital[] {
    return this.#dailyDigitals.read().filter((d) => d.status === "needs_rework")
  }

  // --- Client orders ---

  addOrder(o: ClientOrder): void {
    this.#orders.update((arr) => [...arr, o])
  }

  updateOrder(id: string, patch: Partial<ClientOrder>): void {
    this.#orders.update((arr) => arr.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  getOrder(id: string): ClientOrder | undefined {
    return this.#orders.read().find((o) => o.id === id)
  }

  /** Orders the factory still has to produce for (client work in progress). */
  getOpenOrders(): ClientOrder[] {
    return this.#orders.read().filter((o) => o.status === "new" || o.status === "in_production")
  }

  // --- Delivery packs + case records ---

  addDeliveryPack(p: DeliveryPack): void {
    this.#deliveryPacks.update((arr) => [...arr, p])
  }

  updateDeliveryPack(id: string, patch: Partial<DeliveryPack>): void {
    this.#deliveryPacks.update((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  getDeliveryPack(id: string): DeliveryPack | undefined {
    return this.#deliveryPacks.read().find((p) => p.id === id)
  }

  addCaseRecord(c: CaseRecord): void {
    this.#caseRecords.update((arr) => [...arr, c])
  }

  // --- Settings (survive restarts) ---

  getAutopilotEnabled(): boolean {
    return this.#settings.read().autopilotEnabled
  }

  setAutopilotEnabled(value: boolean): void {
    this.#settings.update((s) => ({ ...s, autopilotEnabled: value }))
  }

  // --- Work run ledger ---

  addWorkRun(run: FactoryWorkRun): void {
    this.#workRuns.update((arr) => [...arr, run])
  }

  getRecentWorkRuns(limit = 10): FactoryWorkRun[] {
    return [...this.#workRuns.read()].reverse().slice(0, limit)
  }

  getLastWorkRun(): FactoryWorkRun | undefined {
    const runs = this.#workRuns.read()
    return runs[runs.length - 1]
  }

  /** Returns recent operator feedback text grouped by department, from needs_rework and rejected items. */
  getRecentFeedbackConstraints(days: number): Record<DailyDigitalDepartment, string[]> {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    const result: Record<DailyDigitalDepartment, string[]> = {
      marketing: [],
      sales: [],
      delivery: [],
      research: [],
      qa: [],
    }
    const events = this.#feedbackEvents
      .read()
      .filter(
        (e) =>
          e.timestamp >= cutoff &&
          e.feedback &&
          (e.action === "needs_rework" || e.action === "rejected"),
      )
    for (const ev of events) {
      if (ev.feedback) result[ev.department].push(ev.feedback)
    }
    return result
  }
}
