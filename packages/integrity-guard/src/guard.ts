/**
 * RatioEssendiGuard — the Facade. Wires Sensor → Nose → Harakiri into one
 * interface you can wrap around any agent action.
 *
 * Unlike the Python spec (which returns None and dies), the TS guard returns a
 * structured verdict, because in this architecture the caller — ultimately the
 * operator — stays in charge of what happens after a breach.
 */
import { DriftSensor } from "./drift-sensor.js"
import { PinocchioNose } from "./pinocchio-nose.js"
import { HarakiriProtocol, type HarakiriReport } from "./harakiri-protocol.js"

export type GuardVerdict<T> = {
  allowed: boolean
  driftScore: number
  noseLength: number
  result?: T
  harakiri?: HarakiriReport
}

export class RatioEssendiGuard {
  readonly sensor: DriftSensor
  readonly nose: PinocchioNose
  readonly harakiri: HarakiriProtocol

  constructor(opts: {
    baselineData: readonly number[]
    criticalNoseLimit?: number
    cleanup?: () => void | Promise<void>
    exitProcess?: boolean
  }) {
    this.sensor = new DriftSensor(opts.baselineData)
    this.nose = new PinocchioNose({ criticalLimit: opts.criticalNoseLimit ?? 80 })
    this.harakiri = new HarakiriProtocol({
      ...(opts.cleanup ? { cleanup: opts.cleanup } : {}),
      exitProcess: opts.exitProcess ?? false,
    })
  }

  /** Wrap any agent action: measure → judge → execute or allow. */
  async monitorAction<A extends unknown[], T>(
    currentData: readonly number[],
    action: (...args: A) => T | Promise<T>,
    ...args: A
  ): Promise<GuardVerdict<T>> {
    const driftScore = this.sensor.calculateDrift(currentData)
    const breached = this.nose.setFromDrift(driftScore)

    if (breached) {
      const harakiri = await this.harakiri.execute(this.nose.noseLength)
      return { allowed: false, driftScore, noseLength: this.nose.noseLength, harakiri }
    }
    const result = await action(...args)
    return { allowed: true, driftScore, noseLength: this.nose.noseLength, result }
  }
}
