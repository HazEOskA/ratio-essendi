/**
 * Deterministyczny szkicownik LEA — działa offline (testy, brak klucza API).
 *
 * Trzyma te same bezwzględne zasady persony co żywy model: 2-4 zdania,
 * zero frazesów botowych, koniec zawsze pytaniem pchającym kwalifikację
 * (problem → budżet → decydent → domknięcie), context recovery — argument
 * sprzedażowy budowany na bólu, który lead zadeklarował wcześniej w wątku.
 */
import { PRODUCT_FACTS } from "./persona.js"
import { detectPain, nextObjective } from "./signals.js"
import type { LeadDraft, LeadDraftContext, LeadDrafter, LeadObjective } from "./types.js"

const OBJECTIVE_QUESTIONS: Record<LeadObjective, string> = {
  problem: "Co dziś najbardziej blokuje Wam wynik — koszty, czas realizacji czy ręczna praca zespołu?",
  budget: "Jaki rząd wielkości inwestycji ma dla Was sens, żebyśmy rozmawiali o konkretach, a nie o teorii?",
  decision_maker: "Kto poza Tobą podpisuje się pod taką decyzją, żebym przygotował materiał od razu dla właściwych osób?",
  close: "Wtorek 10:00 czy środa 14:00 — kiedy robimy 20 minut na konkrety wdrożenia?",
}

function valueSentence(painCategory: string | undefined): string {
  switch (painCategory) {
    case "koszty":
      return `Dokładnie ten rodzaj wycieku zamykamy systemem agentów AI — ${PRODUCT_FACTS.costCut}, ${PRODUCT_FACTS.alwaysOn}.`
    case "czas":
      return `System agentów AI przejmuje te procesy od ręki — ${PRODUCT_FACTS.alwaysOn}, więc terminy przestają zależeć od dostępności ludzi.`
    case "ludzie":
      return `Agenci AI domykają braki kadrowe bez rekrutacji — ${PRODUCT_FACTS.alwaysOn} i ${PRODUCT_FACTS.costCut}.`
    case "błędy":
      return `Automatyzacja agentowa wycina błędy ręcznych procesów u źródła, a przy okazji daje ${PRODUCT_FACTS.costCut}.`
    case "ręczna praca":
      return `Ręczne klikanie to najdroższy proces w firmie — nasi agenci AI robią to samo ${PRODUCT_FACTS.alwaysOn.replace("praca ", "")} i bez zmęczenia.`
    case "skala":
      return `Skalowanie bez zatrudniania to dokładnie nasz teren — system agentów AI rośnie razem z wolumenem, ${PRODUCT_FACTS.alwaysOn}.`
    default:
      return `Wdrażamy systemy operacyjne agentów AI: ${PRODUCT_FACTS.costCut} i ${PRODUCT_FACTS.alwaysOn} — kupujesz ${PRODUCT_FACTS.outcome}.`
  }
}

function replyDraft(ctx: LeadDraftContext): string {
  const pain = detectPain(ctx.history)
  const objective = nextObjective(ctx.qualification)
  const sentences: string[] = []

  if (pain) {
    // Context recovery: obracamy zadeklarowany wcześniej ból w argument.
    sentences.push(`Wróćmy do tego, co sam nazwałeś problemem: ${pain.category}.`)
    sentences.push(valueSentence(pain.category))
  } else {
    sentences.push(`${ctx.leadName.split(" ")[0]}, przejdę od razu do rzeczy — szanuję Twój czas.`)
    sentences.push(valueSentence(undefined))
  }

  if (ctx.operatorFeedback) {
    // Twarde ograniczenie operatora przy przeredagowaniu.
    sentences.push(`Konkret, o który dopytujesz: ${ctx.operatorFeedback.trim().replace(/[.?!]+$/, "")}.`)
  }

  sentences.push(OBJECTIVE_QUESTIONS[objective])
  // Zasada nr 2: maksymalnie 4 zdania.
  return sentences.slice(-4).join(" ")
}

function proposalDraft(ctx: LeadDraftContext): string {
  const q = ctx.qualification
  const pain = detectPain(ctx.history)
  return [
    `# Propozycja wdrożenia — ${ctx.company ?? ctx.leadName}`,
    "",
    "## Zdiagnozowany problem",
    q.problem
      ? `Kluczowy ból: ${q.problem}.${pain ? ` Twoimi słowami: "${pain.quote}"` : ""}`
      : "Do potwierdzenia na rozmowie scopingowej.",
    "",
    "## Proponowane rozwiązanie",
    `System operacyjny agentów AI dopasowany do Waszych procesów: ${PRODUCT_FACTS.costCut}, ${PRODUCT_FACTS.alwaysOn}.`,
    "",
    "## Rama budżetowa",
    q.budget ? `Punkt odniesienia z rozmowy: ${q.budget}. Finalna wycena po scopingu.` : "Do ustalenia — wycena po 20-minutowym scopingu.",
    "",
    "## Decyzja",
    q.decisionMaker ? `Po stronie klienta: ${q.decisionMaker}.` : "Do potwierdzenia: kto podpisuje decyzję.",
    "",
    "## Następny krok",
    "20-minutowa rozmowa scopingowa w tym tygodniu. Operator wysyła tę propozycję własnym kanałem — nic nie wychodzi automatycznie.",
  ].join("\n")
}

export class StubLeadDrafter implements LeadDrafter {
  async draft(ctx: LeadDraftContext): Promise<LeadDraft> {
    const objective = nextObjective(ctx.qualification)
    const text = ctx.kind === "proposal" ? proposalDraft(ctx) : replyDraft(ctx)
    return Promise.resolve({ text, mode: "stub", objective })
  }
}
