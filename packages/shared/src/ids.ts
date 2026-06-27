/**
 * Minimal runtime kernel for the shared package: deterministic, readable ids
 * and a single clock. Kept tiny on purpose — shared stays a kernel, not a lib.
 */

const counters = new Map<string, number>()

/** Sequential, human-readable id, e.g. `cell-1`, `agent-2`, `evt-7`. */
export function newId(prefix: string): string {
  const next = (counters.get(prefix) ?? 0) + 1
  counters.set(prefix, next)
  return `${prefix}-${next}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Reset id counters so a fresh run / test is reproducible. */
export function resetIds(): void {
  counters.clear()
}
