import Anthropic from "@anthropic-ai/sdk"
import type { OfferBrief, OfferProvider } from "./types.js"

export type AnthropicOfferOptions = {
  model?: string
  client?: Anthropic
}

/**
 * Real offer generation via Claude. The agent only drafts — it is instructed
 * (and structurally prevented downstream, docs/13) from contacting anyone.
 */
export class AnthropicOfferProvider implements OfferProvider {
  readonly #client: Anthropic
  readonly #model: string

  constructor(opts: AnthropicOfferOptions = {}) {
    this.#client = opts.client ?? new Anthropic()
    this.#model = opts.model ?? "claude-opus-4-8"
  }

  async generateOffer(brief: OfferBrief): Promise<string> {
    const system =
      "You are an offer-builder agent inside Ratio Essendi. Draft exactly ONE clear, " +
      "profitable B2B offer for the given ICP. You only draft — you must never contact, " +
      "email, or publish to anyone. Always include a defensible margin. Be concrete and concise.\n\n" +
      "Return ONLY the offer in this exact format, with these labels, and nothing else:\n" +
      "Offer: <one-line headline>\n" +
      "<2-4 sentence body>\n" +
      "Price: <price>\n" +
      "Margin: <one-line margin note>\n" +
      "Call to action: <one line>"

    const lines = [
      `ICP: ${brief.icp}`,
      `Product: ${brief.product}`,
      `Constraints: ${brief.constraints.join("; ")}`,
      `KPIs the offer must satisfy: ${brief.kpis.join(", ")}`,
    ]
    if (brief.emphasize && brief.emphasize.length > 0) {
      lines.push(`Fix these weaknesses from the prior attempt: ${brief.emphasize.join("; ")}`)
    }

    const response = await this.#client.messages.create({
      model: this.#model,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: lines.join("\n") }],
    })

    return response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim()
  }
}
