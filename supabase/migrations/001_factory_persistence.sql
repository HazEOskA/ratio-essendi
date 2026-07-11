-- Ratio Essendi PersistencePort v0.1
-- Scope is intentionally narrow: lead threads, lead messages, factory events,
-- and explicit operator actions. All other factory state remains on JsonStore.

create table if not exists public.ratio_lead_threads (
  id text primary key,
  lead_name text not null,
  company text,
  source text,
  status text not null check (status in ('cold', 'warm', 'hot', 'qualified', 'won', 'lost')),
  qualification jsonb not null default '{}'::jsonb,
  draft_revision integer not null default 0 check (draft_revision >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.ratio_lead_messages (
  id text primary key,
  thread_id text not null references public.ratio_lead_threads(id) on delete cascade,
  author text not null check (author in ('lead', 'lea_draft', 'operator_sent')),
  kind text not null check (kind in ('message', 'reply', 'proposal')),
  text text not null,
  at timestamptz not null,
  draft_mode text check (draft_mode is null or draft_mode in ('anthropic', 'stub')),
  objective text
);

create table if not exists public.ratio_factory_events (
  id text primary key,
  timestamp timestamptz not null,
  agent_id text not null,
  event_type text not null,
  signal_id text,
  detail text not null
);

create table if not exists public.ratio_operator_actions (
  id text primary key,
  timestamp timestamptz not null,
  actor text not null default 'operator' check (actor = 'operator'),
  action text not null,
  target_type text not null check (
    target_type in (
      'lead_thread', 'approval', 'daily_digital', 'order',
      'delivery_pack', 'integrity', 'factory', 'other'
    )
  ),
  target_id text,
  detail text not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists ratio_lead_threads_status_updated_idx
  on public.ratio_lead_threads (status, updated_at desc);
create index if not exists ratio_lead_messages_thread_at_idx
  on public.ratio_lead_messages (thread_id, at asc);
create index if not exists ratio_factory_events_timestamp_idx
  on public.ratio_factory_events (timestamp desc);
create index if not exists ratio_factory_events_type_idx
  on public.ratio_factory_events (event_type, timestamp desc);
create index if not exists ratio_operator_actions_target_idx
  on public.ratio_operator_actions (target_type, target_id, timestamp desc);

-- Server-only access. The service-role key bypasses RLS; browser roles receive
-- no direct table privileges and no policy is created for them.
alter table public.ratio_lead_threads enable row level security;
alter table public.ratio_lead_messages enable row level security;
alter table public.ratio_factory_events enable row level security;
alter table public.ratio_operator_actions enable row level security;

revoke all on public.ratio_lead_threads from anon, authenticated;
revoke all on public.ratio_lead_messages from anon, authenticated;
revoke all on public.ratio_factory_events from anon, authenticated;
revoke all on public.ratio_operator_actions from anon, authenticated;

grant all on public.ratio_lead_threads to service_role;
grant all on public.ratio_lead_messages to service_role;
grant all on public.ratio_factory_events to service_role;
grant all on public.ratio_operator_actions to service_role;
