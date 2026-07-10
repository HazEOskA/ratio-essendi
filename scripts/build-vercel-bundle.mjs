/**
 * Bundles scripts/vercel-entry.ts into api/index.mjs — a single, self-contained
 * ESM file with zero external imports (only node:* builtins remain).
 *
 * Why: the workspace packages (@ratio-essendi/*) expose TypeScript sources as
 * their entry points. Vercel's function builder compiles the function file
 * itself but treats node_modules as plain JS and never ships those .ts files,
 * so an unbundled function crashes at runtime with ERR_MODULE_NOT_FOUND.
 *
 * Runs locally via `npm run build:vercel` (the bundle is committed) AND on
 * Vercel as the buildCommand, so a deploy always regenerates it from the
 * sources being deployed — a stale committed bundle cannot ship.
 *
 * The Vercel project currently expects a `public` output directory. This build
 * creates an inert placeholder there so the serverless-only preview passes the
 * output-directory validation without changing routing or serving a fake UI.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { build } from "esbuild"

mkdirSync("public", { recursive: true })
writeFileSync("public/.vercel-output-placeholder", "Ratio Essendi serverless preview\n")

const result = await build({
  entryPoints: ["scripts/vercel-entry.ts"],
  outfile: "api/index.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  banner: {
    js: "// GENERATED FILE — do not edit. Rebuild with: npm run build:vercel",
  },
  logLevel: "info",
})

if (result.errors.length > 0) process.exit(1)
