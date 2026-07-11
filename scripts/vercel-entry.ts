/**
 * Vercel serverless entry SOURCE for the Ratio Essendi Boss Cockpit.
 *
 * This file is NOT deployed directly. `npm run build:vercel` bundles it (and
 * every workspace package it reaches) into a single self-contained
 * `api/index.mjs`, which is what Vercel actually runs.
 *
 * Persistence lifecycle is owned here, at the request boundary:
 * 1. initialize the selected adapter once per warm instance,
 * 2. run the existing router,
 * 3. flush queued Postgres writes before the function returns.
 */
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  flushRegisteredPersistence,
  initializeRegisteredPersistence,
} from "@ratio-essendi/factory-core"
import { requestHandler, ensureSeeded } from "../tests/factory-serve.js"

let persistenceInitialized = false

async function ensurePersistenceInitialized(): Promise<void> {
  if (persistenceInitialized) return
  await initializeRegisteredPersistence()
  persistenceInitialized = true
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensurePersistenceInitialized()

  // The old preview seed writes non-durable demo/training state to /tmp. Keep it
  // only for the JSON preview. A Postgres production runtime must never create
  // fake work or duplicate persistent events merely because a cold start occurred.
  if ((process.env["FACTORY_STORE_DRIVER"] ?? "json").toLowerCase() === "json") {
    await ensureSeeded()
  }

  try {
    await requestHandler(req, res)
  } finally {
    await flushRegisteredPersistence()
  }
}
