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

/** Snapshot the id counters (for persistence). */
export function exportIdState(): Record<string, number> {
  return Object.fromEntries(counters)
}

/** Restore id counters so minted ids continue without collision after a restart. */
export function importIdState(state: Record<string, number>): void {
  counters.clear()
  for (const [prefix, value] of Object.entries(state)) {
    counters.set(prefix, value)
  }
}
