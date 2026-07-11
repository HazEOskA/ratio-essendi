import assert from "node:assert/strict"
import test from "node:test"
import { renderStitchUi, resolveRequestPath, shouldRenderStitchUi } from "../scripts/stitch-ui.js"

const PRODUCT_ROUTES = [
  ["/factory-run", "factory-run", /MISSION_CONTROL/],
  ["/production-line", "production-line", /LOGISTICS_FLOOR/],
  ["/orders", "orders", /CLIENT_ORDERS/],
  ["/delivery", "delivery", /DELIVERY_PACK_CENTER/],
  ["/warehouse", "warehouse", /INSTITUTIONAL_MEMORY/],
  ["/events", "events", /EVIDENCE_TIMELINE/],
  ["/daily-review", "daily-review", /DAILY_PRODUCTION_REVIEW/],
  ["/trash", "trash", /FAILED_WORK/],
] as const

test("Stitch routes resolve through the Vercel catch-all", () => {
  assert.deepEqual(resolveRequestPath({ url: "/api/index?__path=/lead-engine" }), {
    path: "/lead-engine",
    legacy: false,
  })
  assert.deepEqual(resolveRequestPath({ url: "/api/index?__path=/factory-run%3Flegacy%3D1" }), {
    path: "/factory-run?legacy=1",
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

test("remaining product routes use the integrated Stitch shell", () => {
  for (const [route, screen, productMarker] of PRODUCT_ROUTES) {
    assert.equal(shouldRenderStitchUi({ method: "GET", url: route }), true, route)
    assert.equal(shouldRenderStitchUi({ method: "GET", url: `${route}?legacy=1` }), false, `${route} rollback`)

    const html = renderStitchUi({ method: "GET", url: route })
    assert.match(html, new RegExp(`data-screen="${screen}"`), route)
    assert.match(html, productMarker, route)
    assert.match(html, /LEGACY ROLLBACK/, route)
    assert.match(html, /SYNCING LIVE FACTORY STATE/, route)
    assert.match(html, /operational-evidence/, route)
  }
})

test("product screens keep visible controls real or reversible", () => {
  const factoryRun = renderStitchUi({ method: "GET", url: "/factory-run" })
  const events = renderStitchUi({ method: "GET", url: "/events" })

  assert.match(factoryRun, /data-op="cycle"/)
  assert.match(factoryRun, /data-op="autopilot-off"/)
  assert.match(factoryRun, /\?legacy=1/)
  assert.doesNotMatch(factoryRun, /data-op="notify"/)
  assert.match(events, /data-op="export-json"/)
  assert.match(events, /data-op="export-csv"/)
  assert.match(events, /href="\/events" aria-label="Open notifications and audit events"/)
})
