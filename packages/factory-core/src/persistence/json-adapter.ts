import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { FactoryEvent, LeadThread } from "../types.js"
import type {
  OperatorAction,
  PersistencePort,
  PersistenceSnapshot,
} from "./persistence-port.js"

class AtomicJsonFile<T> {
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
    const tmp = `${this.#path}.tmp`
    writeFileSync(tmp, JSON.stringify(this.#data, null, 2), "utf-8")
    renameSync(tmp, this.#path)
  }
}

/**
 * Local/test adapter. It deliberately keeps the legacy filenames and embeds
 * messages inside lead-threads.json, so rollback to the pre-port code does not
 * lose local history. The port still exposes leadMessages as a logical stream.
 */
export class JsonPersistenceAdapter implements PersistencePort {
  readonly driver = "json" as const

  readonly #events: AtomicJsonFile<FactoryEvent[]>
  readonly #leadThreads: AtomicJsonFile<LeadThread[]>
  readonly #operatorActions: AtomicJsonFile<OperatorAction[]>

  constructor(dataDir: string) {
    this.#events = new AtomicJsonFile(join(dataDir, "events.json"), [])
    this.#leadThreads = new AtomicJsonFile(join(dataDir, "lead-threads.json"), [])
    this.#operatorActions = new AtomicJsonFile(join(dataDir, "operator-actions.json"), [])
  }

  async initialize(): Promise<void> {
    // Constructor hydration is synchronous by design for local tests and CLI.
  }

  snapshot(): PersistenceSnapshot {
    const leadThreads = this.#leadThreads.read()
    return {
      leadThreads,
      leadMessages: leadThreads.flatMap((thread) =>
        thread.messages.map((message) => ({ ...message, threadId: thread.id })),
      ),
      factoryEvents: this.#events.read(),
      operatorActions: this.#operatorActions.read(),
    }
  }

  addFactoryEvent(event: FactoryEvent): void {
    this.#events.update((events) => [...events, event])
  }

  addLeadThread(thread: LeadThread): void {
    this.#leadThreads.update((threads) => [...threads, thread])
  }

  updateLeadThread(id: string, patch: Partial<LeadThread>): void {
    this.#leadThreads.update((threads) =>
      threads.map((thread) => (thread.id === id ? { ...thread, ...patch } : thread)),
    )
  }

  addOperatorAction(action: OperatorAction): void {
    this.#operatorActions.update((actions) => [...actions, action])
  }

  async flush(): Promise<void> {
    // AtomicJsonFile persists each mutation immediately.
  }
}
