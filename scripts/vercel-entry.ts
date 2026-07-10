/**
 * Vercel serverless entry SOURCE for the Ratio Essendi Boss Cockpit (PREVIEW).
 *
 * This file is NOT deployed directly. `npm run build:vercel` bundles it (and
 * every workspace package it reaches) into a single self-contained
 * `api/index.mjs`, which is what Vercel actually runs. That bundling step is
 * the fix for the FUNCTION_INVOCATION_FAILED crash: the workspace packages
 * (`@ratio-essendi/*`) point their `main` at TypeScript sources, which
 * Vercel's function builder does not compile or ship — so at runtime the
 * function could not resolve them. A pre-built bundle has no imports left to
 * resolve (only node:* builtins).
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
