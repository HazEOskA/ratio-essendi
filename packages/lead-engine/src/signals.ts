/**
 * Deterministyczna ekstrakcja sygnałów kwalifikacyjnych z wypowiedzi leada.
 *
 * Kwalifikacja (problem / budżet / decydent) musi być powtarzalna i testowalna
 * niezależnie od tego, czy szkice pisze żywy Claude czy szablon — dlatego
 * liczy ją ten moduł, nie model. Wzorce są celowo proste: łapią jawne
 * deklaracje, nie zgadują.
 */
import type { LeadChatMessage, LeadObjective, LeadQualification } from "./types.js"

const PAIN_PATTERNS: { category: string; re: RegExp }[] = [
  { category: "koszty", re: /koszt|drogo|wydatk|marż|oszczęd/i },
  { category: "czas", re: /czas|wolno|opóźni|termin|doba|godzin/i },
  { category: "ludzie", re: /ludzi|kadr|pracownik|rekrutac|braki|zespó/i },
  { category: "błędy", re: /błęd|błąd|pomyłk|reklamac|jakoś/i },
  { category: "ręczna praca", re: /ręczn|manualn|excel|kopiuj|wklej/i },
  { category: "skala", re: /skal|rośnie|wzrost|nie wyrabia|za dużo zgłoszeń/i },
]

// Kwota ma pierwszeństwo przed samym słowem-kluczem: "Budżet mamy 50 tys zł"
// ma zwrócić "50 tys", nie "Budżet" (alternacja w jednym regexie wygrywałaby
// wcześniejszą pozycją w tekście, nie kolejnością wariantów).
const BUDGET_AMOUNT_RE = /\d[\d\s.,]*\s*(?:zł|pln|k\b|tys)/i
const BUDGET_HINT_RE = /budżet|stać nas|inwestycj|wycen|ile to kosztuje|cennik/i

const DECISION_RE = /właściciel|prezes|ceo\b|zarząd|wspólnik|ja decyduję|sam decyduję|decyzja należy do mnie|dyrektor/i

/** Zdania leada, chronologicznie — tylko jego słowa liczą się do kwalifikacji. */
function leadTexts(history: LeadChatMessage[]): string[] {
  return history.filter((m) => m.role === "lead").map((m) => m.text)
}

/** Kategoria bólu z pierwszej wypowiedzi, w której ją zadeklarowano. */
export function detectPain(history: LeadChatMessage[]): { category: string; quote: string } | undefined {
  for (const text of leadTexts(history)) {
    for (const p of PAIN_PATTERNS) {
      if (p.re.test(text)) {
        return { category: p.category, quote: text.length > 140 ? `${text.slice(0, 140)}...` : text }
      }
    }
  }
  return undefined
}

export function detectBudget(history: LeadChatMessage[]): string | undefined {
  const texts = leadTexts(history)
  for (const text of texts) {
    const m = text.match(BUDGET_AMOUNT_RE)
    if (m) return m[0].trim()
  }
  for (const text of texts) {
    const m = text.match(BUDGET_HINT_RE)
    if (m) return m[0].trim()
  }
  return undefined
}

export function detectDecisionMaker(history: LeadChatMessage[]): string | undefined {
  for (const text of leadTexts(history)) {
    const m = text.match(DECISION_RE)
    if (m) return m[0].trim()
  }
  return undefined
}

/** Pełna kwalifikacja wyliczona z historii — idempotentna, bez stanu. */
export function extractQualification(history: LeadChatMessage[]): LeadQualification {
  const pain = detectPain(history)
  const budget = detectBudget(history)
  const decisionMaker = detectDecisionMaker(history)
  return {
    ...(pain ? { problem: pain.category } : {}),
    ...(budget ? { budget } : {}),
    ...(decisionMaker ? { decisionMaker } : {}),
  }
}

/** Kolejny cel rozmowy wg persony: problem → budżet → decydent → domknięcie. */
export function nextObjective(q: LeadQualification): LeadObjective {
  if (!q.problem) return "problem"
  if (!q.budget) return "budget"
  if (!q.decisionMaker) return "decision_maker"
  return "close"
}
