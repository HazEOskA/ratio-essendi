import type { DashboardSnapshot } from "./snapshot.js"

export type PendingOffer = {
  id: string
  agentId: string
  agentName: string
  offer: string
  score: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

/** Everything the live dashboard needs in one JSON payload. */
export type LiveState = {
  snapshot: DashboardSnapshot
  pending: PendingOffer[]
  paused: boolean
  generatedAt: string
}
