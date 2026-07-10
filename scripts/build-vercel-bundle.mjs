/**
 * Bundles scripts/vercel-entry.ts into api/index.mjs — a single, self-contained
 * ESM file with zero external imports (only node:* builtins remain).
 *
 * Why: the workspace packages (@ratio-essendi/*) expose TypeScript sources as
 * their entry points. Vercel's function builder compiles the function file
 * itself but treats node_modules as plain JS and never ships those .ts files,
 * so an unbundled function crashes at runtime with ERR_MODULE_NOT_FOUND.
 *
 * The Vercel project is also configured with `public` as its static output
 * directory. This repository is function-first, but the directory still has
 * to exist after the build or Vercel rejects the deployment before packaging
 * the serverless function.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { build } from "esbuild"

await mkdir("public", { recursive: true })
await writeFile("public/.vercel-output", "Ratio Essendi serverless preview\n", "utf8")

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
