import Anthropic from "@anthropic-ai/sdk"
import type { Verdict } from "./evaluation-engine.js"

export type JudgeVerdict = {
  /** Quality score in [0, 1]. */
  score: number
  verdict: Verdict
  passed: boolean
  reasons: string[]
}

export type JudgeInput = {
  output: string
  context?: string
}

/** Anything that can grade an output's quality (LLM or heuristic). */
export interface JudgeProvider {
  judge(input: JudgeInput): Promise<JudgeVerdict>
}

function toVerdict(score: number): Verdict {
  if (score >= 0.8) return "pass"
  if (score >= 0.5) return "weak"
  return "fail"
}

const CRITERIA: { name: string; test: (s: string) => boolean }[] = [
  {
    name: "concrete price",
    test: (s) => /\$\s?\d|\d+\s?(usd|eur|pln|k\b|\/mo|per month)/i.test(s) || /price[:\s].*\d/i.test(s),
  },
  { name: "defensible margin", test: (s) => /margin/i.test(s) },
  {
    name: "clear call to action",
    test: (s) => /\b(book|schedule|reply|call|demo|get started|sign up|reach out)\b/i.test(s),
  },
  { name: "on-topic / not spam", test: (s) => !/\b(off-topic|spam|blast|generic|no targeting)\b/i.test(s) },
  { name: "enough substance", test: (s) => s.trim().length >= 80 },
]

/**
 * Deterministic, offline quality judge. Unlike KPI-presence checking, it grades
 * the hallmarks of a real offer (price, margin, CTA, on-topic, substance) so a
 * label-only draft does not pass. Used for tests and when no API key is set.
 */
export class HeuristicJudge implements JudgeProvider {
  async judge(input: JudgeInput): Promise<JudgeVerdict> {
    const failed = CRITERIA.filter((c) => !c.test(input.output))
    const score = Math.round(((CRITERIA.length - failed.length) / CRITERIA.length) * 100) / 100
    const verdict = toVerdict(score)
    return Promise.resolve({
      score,
      verdict,
      passed: verdict === "pass",
      reasons: failed.map((c) => `missing or weak: ${c.name}`),
    })
  }
}

export type AnthropicJudgeOptions = { model?: string; client?: Anthropic }

/** LLM quality judge via Claude — clarity, ICP-fit, defensible margin, concrete CTA. */
export class AnthropicJudge implements JudgeProvider {
  readonly #client: Anthropic
  readonly #model: string

  constructor(opts: AnthropicJudgeOptions = {}) {
    this.#client = opts.client ?? new Anthropic()
    this.#model = opts.model ?? "claude-opus-4-8"
  }

  async judge(input: JudgeInput): Promise<JudgeVerdict> {
    const system =
      "You are a strict B2B sales-offer quality judge. Grade the offer on clarity, fit to " +
      "the stated ICP, a defensible margin, and a concrete call to action. Return ONLY a JSON " +
      'object, no prose: {"score": <number 0..1>, "verdict": "pass"|"weak"|"fail", "reasons": ' +
      '[<short strings>]}. Use "pass" only when the offer is genuinely strong.'
    const user = (input.context ? `Context: ${input.context}\n\n` : "") + `Offer:\n${input.output}`

    const response = await this.#client.messages.create({
      model: this.#model,
      max_tokens: 600,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: user }],
    })
    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim()
    return parseJudge(text)
  }
}

function parseJudge(text: string): JudgeVerdict {
  const match = /\{[\s\S]*\}/.exec(text)
  try {
    const obj = JSON.parse(match ? match[0] : text) as {
      score?: number
      verdict?: string
      reasons?: string[]
    }
    const score = Math.max(0, Math.min(1, typeof obj.score === "number" ? obj.score : 0))
    const verdict: Verdict =
      obj.verdict === "pass" || obj.verdict === "weak" || obj.verdict === "fail"
        ? obj.verdict
        : toVerdict(score)
    return {
      score,
      verdict,
      passed: verdict === "pass",
      reasons: Array.isArray(obj.reasons) ? obj.reasons.map((r) => String(r)) : [],
    }
  } catch {
    return { score: 0, verdict: "fail", passed: false, reasons: ["judge returned unparseable output"] }
  }
}

/** Use Claude when a key is present; otherwise the deterministic heuristic judge. */
export function selectJudge(): { judge: JudgeProvider; mode: "anthropic" | "heuristic" } {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return { judge: new AnthropicJudge(), mode: "anthropic" }
  }
  return { judge: new HeuristicJudge(), mode: "heuristic" }
}
