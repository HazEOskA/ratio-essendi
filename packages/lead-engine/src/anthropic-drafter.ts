/**
 * Żywy mózg LEA — Claude przez oficjalny SDK (ten sam wzorzec co
 * AnthropicOfferProvider w offer-builder).
 *
 * Cała rozmowa idzie w jednym user-turnie jako ustrukturyzowany transkrypt
 * (pełne context recovery bez pilnowania naprzemienności ról), persona jako
 * system prompt. Timeout jest krótki (25 s, 1 retry), bo funkcja na Vercelu
 * ma limit 30 s — po przekroczeniu wołający ma zrobić fallback na stub,
 * a nie ubić żądanie HTTP.
 */
import Anthropic from "@anthropic-ai/sdk"
import { LEAD_ENGINE_PERSONA } from "./persona.js"
import { detectPain, nextObjective } from "./signals.js"
import type { LeadDraft, LeadDraftContext, LeadDrafter } from "./types.js"

export type AnthropicLeadDrafterOptions = {
  model?: string
  client?: Anthropic
}

const OBJECTIVE_LABELS: Record<string, string> = {
  problem: "ustal PROBLEM leada (co go boli biznesowo)",
  budget: "ustal BUDŻET (rząd wielkości inwestycji)",
  decision_maker: "ustal DECYDENTA (kto podpisuje decyzję)",
  close: "DOMKNIJ następny krok (zaproponuj konkretny termin 20-minutowej rozmowy)",
}

export class AnthropicLeadDrafter implements LeadDrafter {
  readonly #client: Anthropic
  readonly #model: string

  constructor(opts: AnthropicLeadDrafterOptions = {}) {
    this.#client = opts.client ?? new Anthropic({ timeout: 25_000, maxRetries: 1 })
    this.#model = opts.model ?? "claude-opus-4-8"
  }

  async draft(ctx: LeadDraftContext): Promise<LeadDraft> {
    const objective = nextObjective(ctx.qualification)
    const pain = detectPain(ctx.history)

    const transcript = ctx.history
      .map((m) => `${m.role === "lead" ? "LEAD" : "MY (wysłane)"}: ${m.text}`)
      .join("\n")

    const task = ctx.kind === "proposal"
      ? "ZADANIE: przygotuj zwięzłą, oficjalną propozycję biznesową (markdown, sekcje: Zdiagnozowany problem, Proponowane rozwiązanie, Rama budżetowa, Decyzja, Następny krok). Wypełnij ją zebranymi danymi kwalifikacyjnymi; braki oznacz jako do potwierdzenia. To SZKIC dla operatora — nie sugeruj, że cokolwiek zostało wysłane."
      : `ZADANIE: napisz kolejną wiadomość do leada (2-4 zdania, zakończone pytaniem). Cel tej wiadomości: ${OBJECTIVE_LABELS[objective]}.`

    const lines = [
      `Lead: ${ctx.leadName}${ctx.company ? ` (${ctx.company})` : ""}`,
      `Kwalifikacja: problem=${ctx.qualification.problem ?? "NIEZNANY"}; budżet=${ctx.qualification.budget ?? "NIEZNANY"}; decydent=${ctx.qualification.decisionMaker ?? "NIEZNANY"}`,
      pain ? `Context recovery — ból zadeklarowany wcześniej w wątku: ${pain.category} ("${pain.quote}"). Obróć go w argument.` : "",
      ctx.operatorFeedback ? `TWARDE OGRANICZENIE OD OPERATORA (przeredagowanie): ${ctx.operatorFeedback}` : "",
      "",
      "HISTORIA ROZMOWY:",
      transcript || "(brak wiadomości — to otwarcie rozmowy)",
      "",
      task,
    ].filter((l) => l !== "")

    const response = await this.#client.messages.create({
      model: this.#model,
      max_tokens: ctx.kind === "proposal" ? 2000 : 1024,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: LEAD_ENGINE_PERSONA,
      messages: [{ role: "user", content: lines.join("\n") }],
    })

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim()

    if (!text) throw new Error("empty draft from model")
    return { text, mode: "anthropic", objective }
  }
}
