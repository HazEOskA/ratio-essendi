/**
 * Vercel serverless entry for the Ratio Essendi Boss Cockpit (PREVIEW).
 *
 * It reuses the exact same request router as the local server — no fork, no
 * second implementation. There is no background autopilot timer on serverless;
 * `ensureSeeded()` runs one bounded cycle on cold start so the cockpit is not
 * empty. State lives in ephemeral /tmp and resets between cold starts. Nothing
 * external is ever sent — the safety model is unchanged.
 */
import type { IncomingMessage, ServerResponse } from "node:http"
import { requestHandler, ensureSeeded } from "../tests/factory-serve.js"

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensureSeeded()
  await requestHandler(req, res)
}
