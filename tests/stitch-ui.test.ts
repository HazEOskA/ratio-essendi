import assert from "node:assert/strict"
import test from "node:test"
import { renderStitchUi, resolveRequestPath, shouldRenderStitchUi } from "../scripts/stitch-ui.js"

const PRODUCT_ROUTES = [
  ["/factory-run", "factory-run", /CENTRUM_MISJI/],
  ["/production-line", "production-line", /HALA_LOGISTYCZNA/],
  ["/orders", "orders", /ZLECENIA_KLIENTÓW/],
  ["/delivery", "delivery", /CENTRUM_PAKIETÓW_DOSTAWY/],
  ["/warehouse", "warehouse", /PAMIĘĆ_INSTYTUCJONALNA/],
  ["/events", "events", /OŚ_DOWODÓW/],
  ["/daily-review", "daily-review", /DZIENNY_PRZEGLĄD_PRODUKCJI/],
  ["/trash", "trash", /BŁĘDNE_PRACE/],
] as const

test("Trasy Stitch przechodzą przez catch-all Vercela", () => {
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

test("Kokpit zawiera polski shell i aktywne zaczepy klienta", () => {
  const html = renderStitchUi({ method: "GET", url: "/admin" })
  assert.match(html, /RATIO ESSENDI/)
  assert.match(html, /URUCHOM OPERACJĘ/)
  assert.match(html, /IDENTYFIKATOR SYSTEMU/)
  assert.match(html, /data-screen="command"/)
  assert.match(html, /SYNCHRONIZACJA STANU FABRYKI/i)
  assert.match(html, /Twoja firma działa/)
})

test("Leady i rdzeń systemu mają osobne polskie kompozycje", () => {
  const lead = renderStitchUi({ method: "GET", url: "/lead-engine" })
  const operator = renderStitchUi({ method: "GET", url: "/operator" })
  assert.match(lead, /data-screen="lead"/)
  assert.match(lead, /SILNIK<br>LEADÓW/)
  assert.match(lead, /UTWÓRZ WĄTEK LEADA/)
  assert.match(operator, /data-screen="operator"/)
  assert.match(operator, /USTAWIENIA_KONFIGURACJI/)
  assert.match(operator, /DZIENNIK_ZDROWIA_SYSTEMU/)
})

test("Pozostałe trasy produktowe używają polskiego zintegrowanego shellu", () => {
  for (const [route, screen, productMarker] of PRODUCT_ROUTES) {
    assert.equal(shouldRenderStitchUi({ method: "GET", url: route }), true, route)
    assert.equal(shouldRenderStitchUi({ method: "GET", url: `${route}?legacy=1` }), false, `${route} rollback`)

    const html = renderStitchUi({ method: "GET", url: route })
    assert.match(html, new RegExp(`data-screen="${screen}"`), route)
    assert.match(html, productMarker, route)
    assert.match(html, /WIDOK AWARYJNY/, route)
    assert.match(html, /SYNCHRONIZACJA STANU FABRYKI/, route)
    assert.match(html, /operational-evidence/, route)
  }
})

test("Widoczne kontrolki są prawdziwe, odwracalne i opisane po polsku", () => {
  const factoryRun = renderStitchUi({ method: "GET", url: "/factory-run" })
  const events = renderStitchUi({ method: "GET", url: "/events" })

  assert.match(factoryRun, /data-op="cycle"/)
  assert.match(factoryRun, /data-op="autopilot-off"/)
  assert.match(factoryRun, /\?legacy=1/)
  assert.doesNotMatch(factoryRun, /data-op="notify"/)
  assert.match(factoryRun, /URUCHOM KONTROLOWANY CYKL/)
  assert.match(events, /data-op="export-json"/)
  assert.match(events, /data-op="export-csv"/)
  assert.match(events, /EKSPORTUJ JSON/)
  assert.match(events, /href="\/events" aria-label="Otwórz powiadomienia i zdarzenia audytowe"/)
})

test("Interfejs nie zawiera głównych angielskich komunikatów użytkowych", () => {
  const pages = ["/admin", "/lead-engine", "/operator", ...PRODUCT_ROUTES.map(([route]) => route)]
  const forbidden = [
    /START OPERATION/,
    /Your company is operational/,
    /OPEN LEGACY UI/,
    /REVIEW ALL DRAFTS/,
    /CURRENT MODE/,
    /OPERATOR GATE/,
    /NO WORK RUN/,
    /DELIVERY PACK CENTER/,
  ]

  for (const route of pages) {
    const html = renderStitchUi({ method: "GET", url: route })
    for (const phrase of forbidden) assert.doesNotMatch(html, phrase, `${route}: ${phrase}`)
  }
})
