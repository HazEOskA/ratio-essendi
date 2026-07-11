import { AnthropicLeadDrafter } from "./anthropic-drafter.js"
import { StubLeadDrafter } from "./stub-drafter.js"
import type { LeadDraft, LeadDraftContext, LeadDrafter } from "./types.js"

export type SelectedLeadDrafter = {
  drafter: LeadDrafter
  mode: "anthropic" | "stub"
}

/**
 * Żywy Claude gdy jest klucz API, deterministyczny stub gdy go nie ma —
 * ten sam kontrakt co selectOfferProvider() w offer-builder. Wariant żywy
 * jest opakowany w fallback: błąd API (timeout, 429, refusal, sieć) NIE
 * wywraca żądania operatora — szkic powstaje ze stubu, z uczciwie
 * oznaczonym trybem "stub".
 */
export function selectLeadDrafter(): SelectedLeadDrafter {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return { drafter: new ResilientLeadDrafter(new AnthropicLeadDrafter()), mode: "anthropic" }
  }
  return { drafter: new StubLeadDrafter(), mode: "stub" }
}

export class ResilientLeadDrafter implements LeadDrafter {
  readonly #primary: LeadDrafter
  readonly #fallback: LeadDrafter

  constructor(primary: LeadDrafter, fallback: LeadDrafter = new StubLeadDrafter()) {
    this.#primary = primary
    this.#fallback = fallback
  }

  async draft(ctx: LeadDraftContext): Promise<LeadDraft> {
    try {
      return await this.#primary.draft(ctx)
    } catch (err) {
      console.error("[lead-engine] live drafter failed, falling back to stub:", err)
      return this.#fallback.draft(ctx)
    }
  }
}
