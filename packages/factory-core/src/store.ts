import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs"
import { join, dirname } from "node:path"
import type { FactoryState, Signal, QualifiedLead, ApprovalItem, WarehouseItem, TrashItem, FactoryEvent } from "./types.js"

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

export class FactoryStore {
  readonly #signals: JsonStore<Signal[]>
  readonly #leads: JsonStore<QualifiedLead[]>
  readonly #approval: JsonStore<ApprovalItem[]>
  readonly #warehouse: JsonStore<WarehouseItem[]>
  readonly #trash: JsonStore<TrashItem[]>
  readonly #events: JsonStore<FactoryEvent[]>

  constructor(dataDir: string) {
    const p = (name: string) => join(dataDir, `${name}.json`)
    this.#signals = new JsonStore(p("signals"), [])
    this.#leads = new JsonStore(p("leads"), [])
    this.#approval = new JsonStore(p("approval"), [])
    this.#warehouse = new JsonStore(p("warehouse"), [])
    this.#trash = new JsonStore(p("trash"), [])
    this.#events = new JsonStore(p("events"), [])
  }

  snapshot(): FactoryState {
    return {
      signals: this.#signals.read(),
      leads: this.#leads.read(),
      approvalQueue: this.#approval.read(),
      warehouse: this.#warehouse.read(),
      trash: this.#trash.read(),
      events: this.#events.read(),
    }
  }

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
}
