export type {
  ProspectProfile,
  QualificationResult,
  LeadBrief,
  ProspectAgentResult,
  ProspectEvidence,
  VerifiedEmailChannel,
  AcquisitionProspectStatus,
  AcquisitionProspect,
  AcquisitionProspectInput,
  OutreachMessage,
  OutreachSendResult,
  OutreachSender,
} from "./types.js"
export { HeuristicQualifier, type QualifierProvider } from "./qualifier.js"
export { runProspectAgent } from "./run-prospect-agent.js"
export { PROSPECT_POOL } from "./prospects.js"
export {
  normalizeProspectDomain,
  normalizePublicHttpUrl,
  isValidEmail,
  scoreRecruitmentAgencyProspect,
  createAcquisitionProspect,
  buildRecruitmentAuditOutreach,
} from "./acquisition.js"
