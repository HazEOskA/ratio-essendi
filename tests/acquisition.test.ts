import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  FactoryStore,
  registerAcquisitionProspect,
  sendAcquisitionOutreach,
  recordAcquisitionReply,
  acquireClientFromProspect,
  ACQUISITION_DAILY_SEND_LIMIT,
} from "@ratio-essendi/factory-core"
import type { AcquisitionProspectInput, OutreachSender } from "@ratio-essendi/prospecting"

const NOW = "2026-07-10T17:30:00.000Z"

function input(n = 1): AcquisitionProspectInput {
  return {
    id: `prospect-real-${n}`,
    company: `Recruitment Agency ${n}`,
    website: `agency-${n}.nl`,
    country: "Netherlands",
    segment: "Recruitment agency",
    contactName: "Alex",
    contactRole: "Managing Director",
    email: `hello${n}@agency-${n}.nl`,
    emailSourceUrl: `https://agency-${n}.nl/contact`,
    painSignals: ["Multiple open roles and manual candidate follow-up"],
    evidence: [{
      url: `https://agency-${n}.nl/vacatures`,
      summary: "The public vacancy page shows several active recruitment workflows.",
    }],
  }
}

function withStore(run: (store: FactoryStore) => void | Promise<void>): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), "acquisition-test-"))
  const store = new FactoryStore(dir)
  return Promise.resolve(run(store)).finally(() => rmSync(dir, { recursive: true, force: true }))
}

function sender(): OutreachSender {
  let count = 0
  return {
    async send(message) {
      assert.match(message.to, /@agency-/)
      assert.match(message.body, /AI workflow audits for recruitment teams/)
      count++
      return { providerMessageId: `msg-${count}`, sentAt: NOW }
    },
  }
}

test("client acquisition: verified NL recruitment prospect becomes outreach_ready", async () => {
  await withStore((store) => {
    const prospect = registerAcquisitionProspect(store, input())
    assert.equal(prospect.status, "outreach_ready")
    assert.equal(prospect.fitScore, 1)
    assert.equal(prospect.website, "agency-1.nl")
    assert.equal(store.snapshot().acquisitionProspects.length, 1)
  })
})

test("client acquisition: duplicate domain or email is rejected before a second record", async () => {
  await withStore((store) => {
    registerAcquisitionProspect(store, input())
    assert.throws(() => registerAcquisitionProspect(store, { ...input(2), website: "https://www.agency-1.nl" }), /duplicate prospect/)
    assert.equal(store.snapshot().acquisitionProspects.length, 1)
  })
})

test("client acquisition: unsafe or private evidence URLs are rejected before persistence", async () => {
  await withStore((store) => {
    assert.throws(() => registerAcquisitionProspect(store, {
      ...input(),
      evidence: [{ url: "javascript:alert(1)", summary: "A malicious evidence link." }],
    }), /evidence url must be public|Invalid URL/)
    assert.throws(() => registerAcquisitionProspect(store, {
      ...input(),
      id: "private-url",
      website: "private-agency.nl",
      email: "hello@private-agency.nl",
      emailSourceUrl: "http://127.0.0.1/contact",
    }), /email source url must be public/)
    assert.equal(store.snapshot().acquisitionProspects.length, 0)
  })
})

test("client acquisition: outreach is sent once, persisted and audited", async () => {
  await withStore(async (store) => {
    const prospect = registerAcquisitionProspect(store, input())
    const sent = await sendAcquisitionOutreach(store, prospect.id, sender(), NOW)
    assert.equal(sent.status, "contacted")
    assert.equal(sent.providerMessageId, "msg-1")
    assert.equal(sent.firstContactAt, NOW)
    await assert.rejects(() => sendAcquisitionOutreach(store, prospect.id, sender(), NOW), /cannot be contacted/)
    assert.ok(store.snapshot().events.some((event) => event.eventType === "acquisition.outreach_sent"))
  })
})

test("client acquisition: bounded sender enforces the daily contact limit", async () => {
  await withStore(async (store) => {
    const fakeSender = sender()
    for (let n = 1; n <= ACQUISITION_DAILY_SEND_LIMIT; n++) {
      const prospect = registerAcquisitionProspect(store, input(n))
      await sendAcquisitionOutreach(store, prospect.id, fakeSender, NOW)
    }
    const overflow = registerAcquisitionProspect(store, input(99))
    await assert.rejects(
      () => sendAcquisitionOutreach(store, overflow.id, fakeSender, NOW),
      /daily outreach limit reached/,
    )
    assert.equal(store.getAcquisitionProspect(overflow.id)?.status, "outreach_ready")
  })
})

test("client acquisition: concurrent sends cannot race past the daily limit", async () => {
  await withStore(async (store) => {
    const fakeSender: OutreachSender = {
      async send(message) {
        await new Promise((resolve) => setTimeout(resolve, 5))
        return { providerMessageId: `msg-${message.to}`, sentAt: NOW }
      },
    }
    const prospects = [1, 2, 3, 4].map((n) => registerAcquisitionProspect(store, input(n)))
    const results = await Promise.allSettled(
      prospects.map((prospect) => sendAcquisitionOutreach(store, prospect.id, fakeSender, NOW)),
    )
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 3)
    assert.equal(results.filter((result) => result.status === "rejected").length, 1)
    assert.equal(store.snapshot().acquisitionProspects.filter((item) => item.status === "contacted").length, 3)
  })
})

test("client acquisition: only an interested reply with proof creates a client order", async () => {
  await withStore(async (store) => {
    const prospect = registerAcquisitionProspect(store, input())
    await sendAcquisitionOutreach(store, prospect.id, sender(), NOW)
    assert.throws(() => acquireClientFromProspect(store, prospect.id, "paid"), /interested reply/)
    recordAcquisitionReply(store, prospect.id, "interested", "Asked for a short workflow audit call.")
    assert.throws(() => acquireClientFromProspect(store, prospect.id, "yes"), /client proof is required/)
    const acquired = acquireClientFromProspect(store, prospect.id, "Confirmed paid pilot by email.")
    assert.equal(acquired.status, "client_acquired")
    assert.ok(acquired.clientOrderId)
    assert.equal(store.snapshot().orders.length, 1)
    assert.ok(store.snapshot().events.some((event) => event.eventType === "acquisition.client_acquired"))
  })
})
