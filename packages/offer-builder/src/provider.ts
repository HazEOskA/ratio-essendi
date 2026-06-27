import type { OfferProvider } from "./types.js"
import { AnthropicOfferProvider } from "./anthropic-provider.js"
import { StubOfferProvider } from "./stub-provider.js"

export type SelectedProvider = {
  provider: OfferProvider
  mode: "anthropic" | "stub"
}

/**
 * Use the real Claude provider when an API key is available; otherwise fall
 * back to the deterministic stub so the flow always runs.
 */
export function selectOfferProvider(): SelectedProvider {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return { provider: new AnthropicOfferProvider(), mode: "anthropic" }
  }
  return { provider: new StubOfferProvider(), mode: "stub" }
}
