import assert from "node:assert/strict"
import test from "node:test"
import { renderStitchUi, resolveRequestPath, shouldRenderStitchUi } from "../scripts/stitch-ui.js"

test("Stitch routes resolve through the Vercel catch-all", () => {
  assert.deepEqual(resolveRequestPath({ url: "/api/index?__path=/lead-engine" }), {
    path: "/lead-engine",
    legacy: false,
  })
  assert.equal(shouldRenderStitchUi({ method: "GET", url: "/admin" }), true)
  assert.equal(shouldRenderStitchUi({ method: "POST", url: "/admin" }), false)
  assert.equal(shouldRenderStitchUi({ method: "GET", url: "/admin?legacy=1" }), false)
})

test("Command Center includes locked shell and live client hooks", () => {
  const html = renderStitchUi({ method: "GET", url: "/admin" })
  assert.match(html, /RATIO ESSENDI/)
  assert.match(html, /START OPERATION/)
  assert.match(html, /SYSTEM IDENT/)
  assert.match(html, /data-screen="command"/)
  assert.match(html, /stitch|SYNCING LIVE FACTORY STATE/i)
})

test("Lead and operator routes render dedicated compositions", () => {
  const lead = renderStitchUi({ method: "GET", url: "/lead-engine" })
  const operator = renderStitchUi({ method: "GET", url: "/operator" })
  assert.match(lead, /data-screen="lead"/)
  assert.match(lead, /LEAD<br>ENGINE/)
  assert.match(operator, /data-screen="operator"/)
  assert.match(operator, /CONFIGURATION_SETTINGS/)
})
