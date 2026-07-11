// Lead Engine (LEA) — typy warstwy redagowania.
//
// Ten pakiet NICZEGO nie wysyła. Produkuje szkice odpowiedzi w personie
// "Dyrektora Wzrostu"; wysyłka jest zawsze ręcznym aktem operatora
// (ten sam model bezpieczeństwa co Delivery Pack — FC-021).

export type LeadChatRole = "lead" | "operator"

export type LeadChatMessage = {
  role: LeadChatRole
  text: string
}

export type LeadQualification = {
  problem?: string
  budget?: string
  decisionMaker?: string
}

/** Kolejny cel kwalifikacji wg persony: problem → budżet → decydent → domknięcie. */
export type LeadObjective = "problem" | "budget" | "decision_maker" | "close"

export type LeadDraftKind = "reply" | "proposal"

export type LeadDraftContext = {
  leadName: string
  company?: string
  /** Pełna historia rozmowy, chronologicznie (context recovery). */
  history: LeadChatMessage[]
  qualification: LeadQualification
  /** Feedback operatora przy przeredagowaniu — twarde ograniczenie. */
  operatorFeedback?: string
  kind: LeadDraftKind
}

export type LeadDraft = {
  text: string
  /** Który mózg wygenerował szkic: żywy Claude czy deterministyczny szablon. */
  mode: "anthropic" | "stub"
  objective: LeadObjective
}

export interface LeadDrafter {
  draft(ctx: LeadDraftContext): Promise<LeadDraft>
}
