import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { FileStore } from "./store.js"
import { World, type WorldSnapshot } from "./world.js"

test("world state and log survive a restart via the file store", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ratio-persist-"))
  const file = join(dir, "world.json")
  const store = new FileStore<WorldSnapshot>(file)

  try {
    // --- session 1: create events + operator actions ---
    const w1 = new World({ store })
    await w1.spawnOffer()
    w1.injectDrift()

    const pending = w1.state().pending.filter((p) => p.status === "pending")
    assert.ok(pending.length >= 1)
    const offer = pending[0]
    assert.ok(offer)
    w1.approve(offer.id)

    const drifter = w1.state().snapshot.agents.find((a) => a.status === "succession_required")
    assert.ok(drifter)
    w1.quarantine(drifter.id)

    const before = w1.state()
    assert.ok(existsSync(file), "state file must exist on disk after mutations")

    // --- restart: reload purely from the persisted file ---
    const reloaded = store.load()
    assert.ok(reloaded, "snapshot must load from disk")
    const w2 = new World({ store, snapshot: reloaded })
    const after = w2.state()

    assert.equal(after.snapshot.events.length, before.snapshot.events.length, "events preserved")
    assert.equal(after.snapshot.agents.length, before.snapshot.agents.length, "agents preserved")
    assert.equal(after.snapshot.cells.length, before.snapshot.cells.length, "cells preserved")
    assert.equal(after.pending.length, before.pending.length, "pending preserved")
    assert.ok(after.snapshot.events.some((e) => e.eventType === "approval.granted"), "approval survived")
    assert.equal(
      after.snapshot.agents.find((a) => a.id === drifter.id)?.status,
      "disabled",
      "quarantine survived",
    )

    // --- determinism: restored world keeps minting unique ids ---
    const known = new Set(after.snapshot.agents.map((a) => a.id))
    await w2.spawnOffer()
    const minted = w2.state().snapshot.agents.filter((a) => !known.has(a.id))
    assert.equal(minted.length, 1, "exactly one new agent with a fresh, non-colliding id")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
