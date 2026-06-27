import type { OfferBrief, OfferProvider } from "./types.js"

/**
 * Deterministic, offline offer generator. Used for tests and when no
 * ANTHROPIC_API_KEY is set, so the pipeline is demonstrable without network.
 * The output is clearly templated — it is not a real, model-authored offer.
 */
export class StubOfferProvider implements OfferProvider {
  async generateOffer(brief: OfferBrief): Promise<string> {
    return Promise.resolve(
      [
        `Offer: ${brief.product} for ${brief.icp}`,
        "",
        `A focused, ROI-first engagement tailored to ${brief.icp}, scoped to ` +
          `${brief.constraints.join(", ")}. Outcomes are measured, not promised.`,
        "",
        "Price: $4,000 fixed",
        "Margin: ~65% protected (no discounting below floor)",
        "Call to action: Book a 20-minute scoping demo this week.",
      ].join("\n"),
    )
  }
}
