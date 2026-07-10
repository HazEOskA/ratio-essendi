import { randomUUID } from "node:crypto"
import type {
  AcquisitionProspect,
  AcquisitionProspectInput,
  OutreachMessage,
} from "./types.js"

const RECRUITMENT_TERMS = [
  "recruit", "staffing", "talent", "employment", "hr", "uitzend", "werving", "selectie",
]
const NL_TERMS = ["nl", "netherlands", "nederland", "dutch"]

const includesAny = (value: string, terms: readonly string[]): boolean => {
  const normalized = value.toLowerCase()
  return terms.some((term) => normalized.includes(term))
}

export function normalizeProspectDomain(value: string): string {
  const url = new URL(normalizePublicHttpUrl(value, "website"))
  return url.hostname.toLowerCase().replace(/^www\./, "")
}

export function normalizePublicHttpUrl(value: string, field = "url"): string {
  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const url = new URL(withProtocol)
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`${field} must use HTTP(S)`)
  if (url.username || url.password) throw new Error(`${field} must not contain credentials`)
  const host = url.hostname.toLowerCase()
  const privateIp = /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1"
  if (host === "localhost" || host.endsWith(".local") || privateIp) throw new Error(`${field} must be public`)
  return url.toString()
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function scoreRecruitmentAgencyProspect(
  input: AcquisitionProspectInput,
): { fitScore: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  if (includesAny(input.segment, RECRUITMENT_TERMS)) {
    score += 0.35
    reasons.push("recruitment/HR segment confirmed")
  } else {
    reasons.push("segment is outside recruitment/HR ICP")
  }

  if (includesAny(input.country, NL_TERMS)) {
    score += 0.15
    reasons.push("Netherlands market confirmed")
  } else {
    reasons.push("outside Netherlands market")
  }

  if (input.painSignals.some((signal) => signal.trim().length >= 8)) {
    score += 0.25
    reasons.push("specific workflow pain observed")
  } else {
    reasons.push("no specific workflow pain")
  }

  if (input.evidence.some((item) => item.url.trim() && item.summary.trim().length >= 8)) {
    score += 0.15
    reasons.push("public evidence attached")
  } else {
    reasons.push("no public evidence")
  }

  if (input.email && input.emailSourceUrl && isValidEmail(input.email)) {
    score += 0.1
    reasons.push("public email channel verified")
  } else {
    reasons.push("no verified email channel")
  }

  return { fitScore: Math.round(score * 100) / 100, reasons }
}

export function createAcquisitionProspect(
  input: AcquisitionProspectInput,
  now = new Date().toISOString(),
): AcquisitionProspect {
  const company = input.company.trim()
  if (!company) throw new Error("company is required")
  const website = normalizeProspectDomain(input.website)
  const normalizedEvidence = input.evidence
    .filter((item) => item.url.trim() && item.summary.trim())
    .map((item) => ({
      ...item,
      url: normalizePublicHttpUrl(item.url, "evidence url"),
      summary: item.summary.trim(),
      observedAt: now,
    }))
  const emailSourceUrl = input.emailSourceUrl
    ? normalizePublicHttpUrl(input.emailSourceUrl, "email source url")
    : undefined
  const { fitScore, reasons } = scoreRecruitmentAgencyProspect(input)
  const hasVerifiedEmail = Boolean(input.email && emailSourceUrl && isValidEmail(input.email))

  return {
    id: input.id ?? `prospect-${randomUUID().slice(0, 8)}`,
    company,
    website,
    country: input.country.trim(),
    segment: input.segment.trim(),
    ...(input.contactName?.trim() ? { contactName: input.contactName.trim() } : {}),
    ...(input.contactRole?.trim() ? { contactRole: input.contactRole.trim() } : {}),
    ...(hasVerifiedEmail ? {
      channel: {
        type: "email" as const,
        address: input.email!.trim().toLowerCase(),
        sourceUrl: emailSourceUrl!,
        verifiedAt: now,
      },
    } : {}),
    painSignals: input.painSignals.map((item) => item.trim()).filter(Boolean),
    evidence: normalizedEvidence,
    fitScore,
    qualificationReasons: reasons,
    status: fitScore >= 0.75 ? (hasVerifiedEmail ? "outreach_ready" : "qualified") : "researched",
    createdAt: now,
    updatedAt: now,
  }
}

export function buildRecruitmentAuditOutreach(prospect: AcquisitionProspect): OutreachMessage {
  if (prospect.status !== "outreach_ready") throw new Error("prospect is not outreach_ready")
  if (!prospect.channel) throw new Error("verified email channel is required")
  const greeting = prospect.contactName ? `Hi ${prospect.contactName},` : "Hi," 
  const pain = prospect.painSignals[0] ?? "manual recruitment workflows"
  const evidence = prospect.evidence[0]?.summary ?? "your current recruitment operation"
  return {
    to: prospect.channel.address,
    subject: `Quick workflow idea for ${prospect.company}`,
    body: `${greeting}\n\nI looked at ${prospect.company} and noticed ${evidence}. That often creates friction around ${pain}.\n\nI build small AI workflow audits for recruitment teams: one concrete bottleneck map plus a mini demo of the improved flow. No platform migration and no long implementation project.\n\nWould a short, no-obligation example based on your current process be useful?\n\nBest,\nBartosz Osiński\nOsaTechGPT\n\nIf this is not relevant, reply \"no\" and I will not follow up.`,
  }
}
