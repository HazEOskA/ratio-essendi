import http from "node:http"
import { renderLiveShell } from "./live-shell.js"
import type { LiveState } from "./types.js"
import type { ReportResult } from "./report.js"

export type DashboardServerOptions = {
  getState: () => LiveState
  onAction: (action: string, id: string) => Promise<void> | void
  onReport: () => Promise<ReportResult>
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ""
    req.on("data", (chunk) => {
      data += chunk
    })
    req.on("end", () => resolve(data))
    req.on("error", reject)
  })
}

function json(res: http.ServerResponse, code: number, body: unknown): void {
  res.writeHead(code, { "content-type": "application/json" })
  res.end(JSON.stringify(body))
}

/**
 * A tiny read/act dashboard server. Read-only views plus operator actions
 * (approve/reject/quarantine/succeed) and an on-demand LLM report. No external
 * action is ever taken — approving records the operator's decision only.
 */
export function createDashboardServer(opts: DashboardServerOptions): http.Server {
  return http.createServer((req, res) => {
    void (async () => {
      try {
        const url = req.url ?? "/"
        if (req.method === "GET" && (url === "/" || url === "/index.html")) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
          res.end(renderLiveShell())
          return
        }
        if (req.method === "GET" && url === "/api/state") {
          json(res, 200, opts.getState())
          return
        }
        if (req.method === "POST" && url === "/api/action") {
          const body = await readBody(req)
          const parsed = JSON.parse(body || "{}") as { action?: string; id?: string }
          if (!parsed.action) {
            json(res, 400, { error: "missing action" })
            return
          }
          await opts.onAction(parsed.action, parsed.id ?? "")
          json(res, 200, opts.getState())
          return
        }
        if (req.method === "POST" && url === "/api/report") {
          json(res, 200, await opts.onReport())
          return
        }
        json(res, 404, { error: "not found" })
      } catch (err) {
        json(res, 500, { error: err instanceof Error ? err.message : String(err) })
      }
    })()
  })
}
