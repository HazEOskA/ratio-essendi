import Anthropic from "@anthropic-ai/sdk"
import type { LiveState } from "./types.js"

export type ReportResult = { report: string; mode: "anthropic" | "local" }

const ATTENTION_STATUSES = ["succession_required", "degraded", "under_review", "warning"]

/** Deterministic, offline operator briefing built straight from state. */
export function localReport(state: LiveState): string {
  const agents = state.snapshot.agents
  const active = agents.filter((a) => a.status === "active").length
  const replaced = agents.filter((a) => a.status === "replaced").length
  const attention = agents.filter((a) => ATTENTION_STATUSES.includes(a.status))
  const pending = state.pending.filter((p) => p.status === "pending")
  const recentFailures = state.snapshot.events
    .filter((e) => /fail|drift|conflict|quarantined/.test(e.eventType))
    .slice(-5)

  const lines = [
    "Ratio Essendi — operator report (local summary)",
    "",
    `Agents: ${agents.length} total · ${active} active · ${replaced} replaced.`,
    `Decisions logged: ${state.snapshot.events.length}.`,
    "",
    `Pending your approval: ${pending.length}`,
    ...pending.map((p) => `  • ${p.agentName} (${p.agentId}) — offer ready, score ${p.score}. Approve or reject.`),
    "",
    `Needs attention (drift / weak): ${attention.length}`,
    ...attention.map((a) => `  • ${a.name} (${a.id}) — ${a.status}. Quarantine or force succession.`),
    "",
    "Recent failures / drift:",
    ...recentFailures.map((e) => `  • ${e.eventType} ${e.entityId} — ${e.reason ?? ""}`),
    "",
    pending.length === 0 && attention.length === 0
      ? "All clear. No operator action needed right now."
      : "Action recommended above.",
  ]
  return lines.join("\n")
}

export type AnthropicReportOptions = { model?: string; client?: Anthropic }

/** LLM operator briefing via Claude, grounded in the deterministic facts. */
export async function anthropicReport(
  state: LiveState,
  opts: AnthropicReportOptions = {},
): Promise<string> {
  const client = opts.client ?? new Anthropic()
  const model = opts.model ?? "claude-opus-4-8"
  const facts = localReport(state)
  const system =
    "You are the chief of staff for Ratio Essendi, an autonomous product factory. " +
    "Write a crisp operator briefing: what the agents did, what needs the operator's " +
    "decision now, and one clear recommendation. Be decisive and concise. " +
    "Operational facts only — no metaphysical language."
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    system,
    messages: [
      { role: "user", content: `Current system state:\n\n${facts}\n\nWrite the operator briefing.` },
    ],
  })
  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim()
}

/** Use Claude when a key is present; otherwise the deterministic local report. */
export function selectReporter(): (state: LiveState) => Promise<ReportResult> {
  if (process.env["ANTHROPIC_API_KEY"]) {
    return async (state) => ({ report: await anthropicReport(state), mode: "anthropic" })
  }
  return async (state) => ({ report: localReport(state), mode: "local" })
}
