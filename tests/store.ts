import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

/**
 * Minimal JSON file store. Atomic save (write temp + rename) so a crash mid-write
 * never leaves a half-written state file. No database — a plain local file.
 */
export class FileStore<T> {
  readonly #path: string

  constructor(path: string) {
    this.#path = path
  }

  get path(): string {
    return this.#path
  }

  load(): T | null {
    if (!existsSync(this.#path)) return null
    try {
      return JSON.parse(readFileSync(this.#path, "utf8")) as T
    } catch {
      return null
    }
  }

  save(value: T): void {
    mkdirSync(dirname(this.#path), { recursive: true })
    const tmp = `${this.#path}.tmp`
    writeFileSync(tmp, JSON.stringify(value, null, 2))
    renameSync(tmp, this.#path)
  }
}
