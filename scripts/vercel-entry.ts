/**
 * Vercel serverless entry for the Ratio Essendi operator UI and API.
 * Persistence stays at the request boundary; the Stitch visual layer handles
 * only selected GET pages and delegates all state/actions to the existing API.
 */
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  flushRegisteredPersistence,
  initializeRegisteredPersistence,
} from "@ratio-essendi/factory-core"
import { requestHandler, ensureSeeded } from "../tests/factory-serve.js"
import { renderStitchUi, shouldRenderStitchUi } from "./stitch-ui.js"

let persistenceInitialized = false

async function ensurePersistenceInitialized(): Promise<void> {
  if (persistenceInitialized) return
  await initializeRegisteredPersistence()
  persistenceInitialized = true
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensurePersistenceInitialized()

  if ((process.env["FACTORY_STORE_DRIVER"] ?? "json").toLowerCase() === "json") {
    await ensureSeeded()
  }

  try {
    if (shouldRenderStitchUi(req)) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      })
      res.end(renderStitchUi(req))
      return
    }
    await requestHandler(req, res)
  } finally {
    await flushRegisteredPersistence()
  }
}
