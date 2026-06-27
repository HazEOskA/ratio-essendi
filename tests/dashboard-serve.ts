import { createDashboardServer, selectReporter } from "@ratio-essendi/dashboard"
import { World } from "./world.js"

const world = new World()
const reporter = selectReporter()

const server = createDashboardServer({
  getState: () => world.state(),
  onAction: (action, id) => world.action(action, id),
  onReport: () => reporter(world.state()),
})

const PORT = Number(process.env["PORT"] ?? 7777)
const TICK_MS = Number(process.env["TICK_MS"] ?? 3500)

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Ratio Essendi — Live Ops → http://127.0.0.1:${PORT}`)
  console.log(`(sim tick every ${TICK_MS}ms; operator actions + LLM report are live)`)
})

const interval = setInterval(() => {
  void world.tick()
}, TICK_MS)

process.on("SIGINT", () => {
  clearInterval(interval)
  server.close()
  process.exit(0)
})
