import { createDashboardServer, selectReporter } from "@ratio-essendi/dashboard"
import { FileStore } from "./store.js"
import { World, type WorldSnapshot } from "./world.js"

const STATE_FILE = process.env["STATE_FILE"] ?? ".data/world.json"
const store = new FileStore<WorldSnapshot>(STATE_FILE)

const persisted = store.load()
const world = persisted ? new World({ store, snapshot: persisted }) : new World({ store })

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
  if (persisted) {
    console.log(
      `Restored from ${STATE_FILE}: ${persisted.agents.length} agent(s), ` +
        `${persisted.events.length} decision(s), ${persisted.pending.length} offer(s).`,
    )
  } else {
    console.log(`Fresh world (will persist to ${STATE_FILE}).`)
  }
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
