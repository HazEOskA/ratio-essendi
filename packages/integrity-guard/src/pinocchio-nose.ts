/**
 * PinocchioNose — the Integrity Keeper. Holds the nose length (0–100 cm) and
 * decides when accumulated "lying" crosses the moral limit.
 *
 * Two usage modes, both honest:
 * - setFromDrift(): stateless mapping drift → length (the original spec:
 *   nose = min(100, drift × 20), replacing the previous value)
 * - grow()/shrink(): cumulative mode used by the factory, where discrete
 *   operator signals (rejected, rework, accepted) move the nose over time.
 */

const clamp = (v: number): number => Math.max(0, Math.min(100, Math.round(v)))

export class PinocchioNose {
  #noseLength: number
  readonly criticalLimit: number

  constructor(opts: { criticalLimit?: number; initialLength?: number } = {}) {
    this.criticalLimit = Math.max(1, Math.min(100, opts.criticalLimit ?? 80))
    this.#noseLength = clamp(opts.initialLength ?? 0)
  }

  get noseLength(): number {
    return this.#noseLength
  }

  /** Spec mode: nose = min(100, round(drift × 20)). Returns true when breached. */
  setFromDrift(driftScore: number): boolean {
    this.#noseLength = clamp(driftScore * 20)
    return this.isBreached()
  }

  /** Cumulative mode: add centimeters. Returns true when breached. */
  grow(cm: number): boolean {
    this.#noseLength = clamp(this.#noseLength + Math.abs(cm))
    return this.isBreached()
  }

  /** Truth heals: shrink the nose (never below 0). */
  shrink(cm: number): void {
    this.#noseLength = clamp(this.#noseLength - Math.abs(cm))
  }

  isBreached(): boolean {
    return this.#noseLength >= this.criticalLimit
  }
}
