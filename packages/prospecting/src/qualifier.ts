import type { ProspectProfile, QualificationResult } from "./types.js"

export interface QualifierProvider {
  qualify(prospect: ProspectProfile, icp: string): Promise<QualificationResult>
}

const ICP_INDUSTRY_KEYWORDS = ["saas", "software", "tech", "b2b", "platform"]
const ICP_SIZE_KEYWORDS = ["seed", "startup", "early", "10-50", "10–50", "15-", "20-", "25-", "30-", "35-", "40-", "45-"]
const ICP_ROLE_KEYWORDS = ["founder", "ceo", "co-founder", "cofounder", "owner", "gm"]
const ICP_PAIN_KEYWORDS = ["revenue", "sales", "pipeline", "ops", "revops", "growth", "churn", "closing", "deals", "quota"]

function keywordScore(value: string, keywords: string[]): boolean {
  const v = value.toLowerCase()
  return keywords.some((k) => v.includes(k))
}

function painScore(points: string[], keywords: string[]): boolean {
  return points.some((p) => keywords.some((k) => p.toLowerCase().includes(k)))
}

/**
 * Offline ICP qualifier. Checks four dimensions against the target ICP:
 * industry (SaaS/tech), team size (seed/10-50), role (founder/CEO), and
 * pain points (revenue/sales ops). Qualified if ≥3 of 4 dimensions match.
 */
export class HeuristicQualifier implements QualifierProvider {
  async qualify(prospect: ProspectProfile, _icp: string): Promise<QualificationResult> {
    const checks = {
      industry: keywordScore(prospect.industry, ICP_INDUSTRY_KEYWORDS),
      size: keywordScore(prospect.companySize, ICP_SIZE_KEYWORDS),
      role: keywordScore(prospect.role, ICP_ROLE_KEYWORDS),
      pain: painScore(prospect.painPoints, ICP_PAIN_KEYWORDS),
    }

    const matched = Object.values(checks).filter(Boolean).length
    const fitScore = matched / 4

    const reasons: string[] = []
    if (!checks.industry) reasons.push(`industry '${prospect.industry}' is outside SaaS/tech ICP`)
    if (!checks.size) reasons.push(`company size '${prospect.companySize}' is outside seed-stage range`)
    if (!checks.role) reasons.push(`role '${prospect.role}' is not a founder/CEO decision-maker`)
    if (!checks.pain) reasons.push("no sales/revenue pain detected")

    return {
      qualified: fitScore >= 0.75,
      fitScore,
      reasons,
    }
  }
}
