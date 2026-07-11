export { LEAD_ENGINE_PERSONA, BANNED_BOT_PHRASES, PRODUCT_FACTS } from "./persona.js"
export {
  detectPain,
  detectBudget,
  detectDecisionMaker,
  extractQualification,
  nextObjective,
} from "./signals.js"
export { StubLeadDrafter } from "./stub-drafter.js"
export { AnthropicLeadDrafter } from "./anthropic-drafter.js"
export { selectLeadDrafter, ResilientLeadDrafter } from "./drafter.js"
export type {
  LeadChatMessage,
  LeadChatRole,
  LeadDraft,
  LeadDraftContext,
  LeadDraftKind,
  LeadDrafter,
  LeadObjective,
  LeadQualification,
} from "./types.js"
export type { SelectedLeadDrafter } from "./drafter.js"
