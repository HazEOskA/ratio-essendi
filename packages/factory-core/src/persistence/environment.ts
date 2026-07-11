import type { PersistencePort } from "./persistence-port.js"
import { JsonPersistenceAdapter } from "./json-adapter.js"
import { SupabasePostgresPersistenceAdapter } from "./supabase-postgres-adapter.js"

/**
 * Production selection is explicit. Missing FACTORY_STORE_DRIVER always falls
 * back to JSON, so local/test behavior and rollback remain deterministic.
 */
export function createPersistenceFromEnvironment(
  dataDir: string,
  env: NodeJS.ProcessEnv = process.env,
): PersistencePort {
  const configured = (env["FACTORY_STORE_DRIVER"] ?? "json").trim().toLowerCase()
  if (configured === "json") return new JsonPersistenceAdapter(dataDir)
  if (configured === "postgres" || configured === "supabase") {
    return SupabasePostgresPersistenceAdapter.fromEnvironment(env)
  }
  throw new Error(
    `Unsupported FACTORY_STORE_DRIVER=${configured}. Allowed values: json, postgres`,
  )
}
