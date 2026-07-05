/**
 * HarakiriProtocol — the Executor. When it receives the signal, it runs the
 * cleanup callback and reports what happened.
 *
 * IMPORTANT ADAPTATION vs the original spec: `process.exit(1)` is OPT-IN
 * (`exitProcess: true`), default OFF. Inside the factory server a hard exit
 * would kill the whole cockpit because ONE agent drifted — exactly the single
 * point of failure forbidden by decision 011 ("No Single Point of Failure").
 * In the factory, the cleanup callback quarantines the agent instead; the
 * process-kill mode remains available for standalone bots/CLIs where the
 * process IS the agent.
 */

export type HarakiriReport = {
  executedAt: string
  finalNoseLength: number
  cleanupRan: boolean
  cleanupError?: string
  processExitRequested: boolean
}

export class HarakiriProtocol {
  readonly #cleanup?: () => void | Promise<void>
  readonly #exitProcess: boolean

  constructor(opts: { cleanup?: () => void | Promise<void>; exitProcess?: boolean } = {}) {
    if (opts.cleanup) this.#cleanup = opts.cleanup
    this.#exitProcess = opts.exitProcess ?? false
  }

  async execute(finalNoseLength: number): Promise<HarakiriReport> {
    const report: HarakiriReport = {
      executedAt: new Date().toISOString(),
      finalNoseLength,
      cleanupRan: false,
      processExitRequested: this.#exitProcess,
    }
    if (this.#cleanup) {
      try {
        await this.#cleanup()
        report.cleanupRan = true
      } catch (err) {
        report.cleanupError = err instanceof Error ? err.message : String(err)
      }
    }
    if (this.#exitProcess) {
      // Standalone mode only. Never enabled inside the factory server.
      process.exit(1)
    }
    return report
  }
}
