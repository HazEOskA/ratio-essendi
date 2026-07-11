/**
 * Lead Engine (LEA) — testy jednostkowe warstwy redagującej i integracja
 * z fabryką. Wszystko działa offline: integracja wymusza deterministyczny
 * stub przez setLeadDrafterForTests, więc żaden test nie dotyka sieci.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  BANNED_BOT_PHRASES,
  LEAD_ENGINE_PERSONA,
  StubLeadDrafter,
  extractQualification,
  nextObjective,
  type LeadChatMessage,
} from "@ratio-essendi/lead-engine"
import {
  FactoryStore,
  createLeadThread,
  recordIncomingLeadMessage,
  redraftLeadReply,
  draftLeadProposal,
  markLeadReplySent,
  setLeadThreadStatus,
  pendingDraftFor,
  setLeadDrafterForTests,
} from "@ratio-essendi/factory-core"

function tmpStore(): { store: FactoryStore; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "lea-test-"))
  const store = new FactoryStore(dir)
  return { store, cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

const msg = (role: "lead" | "operator", text: string): LeadChatMessage => ({ role, text })

function sentenceCount(text: string): number {
  return text.split(/[.?!]+\s|[.?!]+$/).filter((s) => s.trim().length > 0).length
}

// --- Sygnały kwalifikacyjne (deterministyczne) ---

test("signals: kwalifikacja wykrywa problem, budżet i decydenta z wypowiedzi leada", () => {
  const history = [
    msg("lead", "Koszty obsługi klienta rosną nam z miesiąca na miesiąc."),
    msg("operator", "Rozumiem, policzmy to."),
    msg("lead", "Budżet mamy około 50 tys zł, decyzję podejmuję ja jako właściciel."),
  ]
  const q = extractQualification(history)
  assert.equal(q.problem, "koszty")
  assert.ok(q.budget && /50/.test(q.budget), `budget should capture the amount, got: ${q.budget}`)
  assert.ok(q.decisionMaker && /właściciel/i.test(q.decisionMaker))
})

test("signals: wypowiedzi operatora NIE liczą się do kwalifikacji", () => {
  const history = [
    msg("operator", "Nasz budżet wdrożeniowy i koszty nie mają znaczenia."),
    msg("lead", "Dzień dobry, proszę o info."),
  ]
  const q = extractQualification(history)
  assert.equal(q.problem, undefined)
  assert.equal(q.budget, undefined)
})

test("signals: kolejność celów to problem → budżet → decydent → domknięcie", () => {
  assert.equal(nextObjective({}), "problem")
  assert.equal(nextObjective({ problem: "koszty" }), "budget")
  assert.equal(nextObjective({ problem: "koszty", budget: "50k" }), "decision_maker")
  assert.equal(nextObjective({ problem: "koszty", budget: "50k", decisionMaker: "właściciel" }), "close")
})

// --- Stub drafter: kontrakt stylu persony ---

test("stub drafter: szkic ma 2-4 zdania i kończy się pytaniem", async () => {
  const drafter = new StubLeadDrafter()
  const draft = await drafter.draft({
    leadName: "Jan Kowalski",
    history: [msg("lead", "Ręczna praca w Excelu zabija nasz zespół.")],
    qualification: { problem: "ręczna praca" },
    kind: "reply",
  })
  assert.ok(draft.text.trim().endsWith("?"), `draft must end with a question, got: ${draft.text}`)
  const n = sentenceCount(draft.text)
  assert.ok(n >= 2 && n <= 4, `expected 2-4 sentences, got ${n}: ${draft.text}`)
})

test("stub drafter: zakaz botowania — żaden zakazany zwrot nie występuje", async () => {
  const drafter = new StubLeadDrafter()
  const contexts = [
    { qualification: {}, history: [msg("lead", "Dzień dobry.")] },
    { qualification: { problem: "koszty" }, history: [msg("lead", "Koszty nas bolą.")] },
    {
      qualification: { problem: "czas", budget: "100 tys", decisionMaker: "prezes" },
      history: [msg("lead", "Wszystko trwa za długo, budżet 100 tys, jestem prezesem.")],
    },
  ]
  for (const ctx of contexts) {
    const draft = await drafter.draft({ leadName: "Anna Nowak", kind: "reply", ...ctx })
    const lower = draft.text.toLowerCase()
    for (const phrase of BANNED_BOT_PHRASES) {
      assert.ok(!lower.includes(phrase), `banned phrase "${phrase}" in draft: ${draft.text}`)
    }
  }
})

test("stub drafter: context recovery — ból z pierwszej wiadomości wraca w argumencie, choć ostatnia wiadomość jest wymijająca", async () => {
  const drafter = new StubLeadDrafter()
  const history = [
    msg("lead", "Największy problem to koszty operacyjne, rosną co kwartał."),
    msg("operator", "Policzmy to na liczbach."),
    msg("lead", "Muszę to jeszcze przemyśleć, odezwę się."),
  ]
  const draft = await drafter.draft({
    leadName: "Piotr",
    history,
    qualification: extractQualification(history),
    kind: "reply",
  })
  assert.ok(/koszt/i.test(draft.text), `draft should weaponise the earlier cost pain: ${draft.text}`)
})

test("stub drafter: cel szkicu podąża za brakami kwalifikacji", async () => {
  const drafter = new StubLeadDrafter()
  const d1 = await drafter.draft({ leadName: "X", history: [], qualification: {}, kind: "reply" })
  assert.equal(d1.objective, "problem")
  const d2 = await drafter.draft({ leadName: "X", history: [], qualification: { problem: "koszty" }, kind: "reply" })
  assert.equal(d2.objective, "budget")
  assert.ok(/inwestycj|budżet|rząd wielkości/i.test(d2.text), `budget question expected: ${d2.text}`)
  const d3 = await drafter.draft({
    leadName: "X", history: [],
    qualification: { problem: "koszty", budget: "50k", decisionMaker: "CEO" },
    kind: "reply",
  })
  assert.equal(d3.objective, "close")
  assert.ok(/wtorek|środa|20 minut/i.test(d3.text), `close question expected: ${d3.text}`)
})

test("stub drafter: feedback operatora wchodzi do przeredagowanego szkicu", async () => {
  const drafter = new StubLeadDrafter()
  const draft = await drafter.draft({
    leadName: "X",
    history: [msg("lead", "Koszty bolą.")],
    qualification: { problem: "koszty" },
    operatorFeedback: "wspomnij o wdrożeniu w 14 dni",
    kind: "reply",
  })
  assert.ok(draft.text.includes("wdrożeniu w 14 dni"), `feedback constraint missing: ${draft.text}`)
})

test("stub drafter: propozycja ma sekcje i jawnie mówi, że wysyła operator", async () => {
  const drafter = new StubLeadDrafter()
  const history = [msg("lead", "Koszty rosną, budżet 80 tys zł, decyduje zarząd.")]
  const draft = await drafter.draft({
    leadName: "Firma Y", company: "Y sp. z o.o.",
    history,
    qualification: extractQualification(history),
    kind: "proposal",
  })
  for (const section of ["Zdiagnozowany problem", "Proponowane rozwiązanie", "Rama budżetowa", "Decyzja", "Następny krok"]) {
    assert.ok(draft.text.includes(section), `proposal section missing: ${section}`)
  }
  assert.ok(/operator wysyła|nic nie wychodzi automatycznie/i.test(draft.text))
})

test("persona: system prompt zawiera bezwzględne zasady i zakaz samodzielnej wysyłki", () => {
  assert.ok(LEAD_ENGINE_PERSONA.includes("Zakaz botowania"))
  assert.ok(LEAD_ENGINE_PERSONA.includes("2-4 zdania"))
  assert.ok(LEAD_ENGINE_PERSONA.includes("NIE WYSYŁASZ"))
  assert.ok(/70%/.test(LEAD_ENGINE_PERSONA))
})

// --- Integracja z fabryką (stub wymuszony — zero sieci) ---

test("integracja: nowy wątek + wiadomość leada → kwalifikacja, status, szkic i komplet eventów", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Jan Kowalski", company: "HVAC TestCo", source: "LinkedIn" })
    assert.equal(thread.status, "cold")

    const updated = await recordIncomingLeadMessage(
      store, thread.id,
      "Koszty obsługi rosną nam dramatycznie, ręczna praca zjada marżę.",
    )
    assert.ok(updated)
    assert.equal(updated.qualification.problem, "koszty")
    assert.equal(updated.status, "warm", "one known field → warm")
    assert.equal(updated.messages.length, 2, "lead message + LEA draft")
    assert.equal(updated.messages[0]!.author, "lead")
    assert.equal(updated.messages[1]!.author, "lea_draft")
    assert.equal(updated.messages[1]!.draftMode, "stub")
    assert.ok(pendingDraftFor(updated), "draft awaits the operator")

    const events = store.snapshot().events.map((e) => e.eventType)
    for (const expected of ["lead.thread_created", "lead.message_received", "lead.qualified", "lead.status_changed", "lead.reply_drafted"]) {
      assert.ok(events.includes(expected), `missing event ${expected}, got: ${events.join(",")}`)
    }
    assert.ok(
      store.snapshot().events.every((e) => e.eventType.startsWith("lead.") ? e.agentId === "LEA" : true),
      "lead.* events are attributed to LEA",
    )
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})

test("integracja: pełna kwalifikacja w rozmowie podnosi status do qualified", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Anna" })
    await recordIncomingLeadMessage(store, thread.id, "Ręczna praca w Excelu nas zabija.")
    await recordIncomingLeadMessage(store, thread.id, "Budżet mamy do 120 tys zł.")
    const t = await recordIncomingLeadMessage(store, thread.id, "Decyzję podejmuję ja, jestem właścicielem.")
    assert.ok(t)
    assert.equal(t.status, "qualified")
    assert.ok(t.qualification.problem && t.qualification.budget && t.qualification.decisionMaker)
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})

test("integracja: redraft dokłada nowy szkic i podbija rewizję", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Piotr" })
    await recordIncomingLeadMessage(store, thread.id, "Koszty bolą.")
    const before = store.getLeadThread(thread.id)!
    const after = await redraftLeadReply(store, thread.id, "krócej i twardziej")
    assert.ok(after)
    assert.equal(after.draftRevision, before.draftRevision + 1)
    assert.equal(after.messages.length, before.messages.length + 1)
    assert.ok(store.snapshot().events.some((e) => e.eventType === "lead.reply_redrafted" && e.detail.includes("krócej i twardziej")))
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})

test("integracja: mark-sent księguje wysyłkę OPERATORA i czyści oczekujący szkic — fabryka nie wysyła", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Marek" })
    await recordIncomingLeadMessage(store, thread.id, "Za dużo zgłoszeń, nie wyrabiamy.")
    assert.ok(pendingDraftFor(store.getLeadThread(thread.id)!))

    const t = markLeadReplySent(store, thread.id, "Wysłałem własną, poprawioną wersję szkicu.")
    assert.ok(t)
    assert.equal(t.messages[t.messages.length - 1]!.author, "operator_sent")
    assert.equal(pendingDraftFor(t), undefined, "after operator send there is no pending draft")

    const evt = store.snapshot().events.find((e) => e.eventType === "lead.marked_sent")
    assert.ok(evt, "lead.marked_sent event must exist")
    assert.ok(evt.detail.includes("WŁASNYM kanałem"))
    assert.ok(evt.detail.includes("Fabryka nie wysłała niczego"))
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})

test("integracja: propozycja ląduje w wątku jako szkic (kind=proposal), nigdzie nie wychodzi", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Ewa", company: "E-Log" })
    await recordIncomingLeadMessage(store, thread.id, "Koszty logistyki rosną, budżet 200 tys, decyduje zarząd.")
    const t = await draftLeadProposal(store, thread.id)
    assert.ok(t)
    const proposal = t.messages[t.messages.length - 1]!
    assert.equal(proposal.kind, "proposal")
    assert.equal(proposal.author, "lea_draft")
    assert.ok(store.snapshot().events.some((e) => e.eventType === "lead.proposal_drafted"))
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})

test("integracja: won/lost tylko decyzją operatora, z eventem; nieznany wątek zwraca undefined", async () => {
  const { store, cleanup } = tmpStore()
  setLeadDrafterForTests(new StubLeadDrafter())
  try {
    const thread = createLeadThread(store, { leadName: "Tomasz" })
    const t = setLeadThreadStatus(store, thread.id, "won", "podpisany kontrakt")
    assert.ok(t)
    assert.equal(t.status, "won")
    assert.ok(store.snapshot().events.some((e) => e.eventType === "lead.status_changed" && e.detail.includes("podpisany kontrakt")))

    assert.equal(setLeadThreadStatus(store, "lt-nie-ma", "lost"), undefined)
    assert.equal(await recordIncomingLeadMessage(store, "lt-nie-ma", "halo"), undefined)
  } finally {
    setLeadDrafterForTests(undefined)
    cleanup()
  }
})
