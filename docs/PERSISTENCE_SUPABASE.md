# PersistencePort + Supabase Postgres

## Locked scope

Only these logical streams move behind `PersistencePort`:

1. `leadThreads`
2. `leadMessages`
3. `factoryEvents`
4. `operatorActions`

Signals, approval queue, warehouse, trash, daily production, orders, delivery packs,
case records, integrity state, work runs and settings remain on `JsonStore` in this
iteration. This is deliberate anti-sprawl.

The safety invariant is unchanged: LEA drafts; the operator sends. The database
adds durable memory and an operator audit trail. It does not add an external send
path, cron or autonomous action authority.

## Architecture

```text
FactoryStore (synchronous domain API)
  -> PersistencePort (cached state + queued durable writes)
       -> JsonPersistenceAdapter               local/test/rollback
       -> SupabasePostgresPersistenceAdapter   Vercel production
```

The Supabase adapter hydrates its cache at cold start. Domain mutations stay
synchronous and enqueue idempotent upserts. `scripts/vercel-entry.ts` flushes the
queue before the serverless request returns.

## Database setup

Apply:

```text
supabase/migrations/001_factory_persistence.sql
```

The migration creates:

- `ratio_lead_threads`
- `ratio_lead_messages`
- `ratio_factory_events`
- `ratio_operator_actions`

RLS is enabled. `anon` and `authenticated` have no table privileges. Only the
server-side service role is granted access.

## Vercel environment

```env
FACTORY_STORE_DRIVER=postgres
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` as a public or browser variable.

When `FACTORY_STORE_DRIVER` is missing, the runtime uses JSON. Production does
not silently switch to Postgres based on deployment environment.

## Validation

```bash
npm run typecheck
npm test
npm run build:vercel
```

Smoke test after setting Vercel variables:

1. Open `/lead-engine`.
2. Create one lead thread.
3. Paste one incoming message and let LEA draft a reply.
4. Mark the manually sent reply as sent.
5. Trigger a fresh deployment or cold start.
6. Confirm the thread, messages and events are still present.
7. Confirm `ratio_operator_actions` contains the explicit operator actions.
8. Confirm no email, LinkedIn message or other external action was sent by the factory.

## Rollback

Set:

```env
FACTORY_STORE_DRIVER=json
```

The code returns to the legacy local files:

- `events.json`
- `lead-threads.json`
- `operator-actions.json`

The JSON adapter deliberately keeps messages embedded in `lead-threads.json`, so
older local code can still read the history. The Postgres migration is additive;
rollback does not drop tables or delete production data.

## Current concurrency boundary

Message and audit rows are immutable and protected by stable primary keys, so
retries are idempotent. Thread metadata is upserted with last-write-wins semantics.
That is acceptable for the current single-operator workflow. Multi-operator mode
requires optimistic versioning before it is enabled.
