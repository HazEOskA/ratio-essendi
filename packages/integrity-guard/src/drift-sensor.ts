/**
 * DriftSensor — the Analyst. Measures deviation of incoming data against a
 * baseline as a Z-score. It does not care what happens next (separation of
 * concerns: PinocchioNose judges, HRARProtocol executes).
 */

export function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stdDev(values: readonly number[]): number {
  const m = mean(values)
  return Math.sqrt(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / values.length)
}

export class DriftSensor {
  readonly baselineMean: number
  readonly baselineStd: number

  constructor(baselineData: readonly number[]) {
    if (baselineData.length === 0) {
      throw new Error("DriftSensor requires a non-empty baseline")
    }
    this.baselineMean = mean(baselineData)
    const std = stdDev(baselineData)
    // A flat baseline would divide by zero — fall back to 1, same as the spec.
    this.baselineStd = std === 0 ? 1 : std
  }

  /** Z-score of the current window against the baseline. 0 for an empty window. */
  calculateDrift(currentData: readonly number[]): number {
    if (currentData.length === 0) return 0
    return Math.abs(mean(currentData) - this.baselineMean) / this.baselineStd
  }
}
