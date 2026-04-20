-- =================================================================
--  Supabase schema for rahulbk.com
--  Run this once in the Supabase SQL editor after creating the project.
-- =================================================================

create extension if not exists "pgcrypto";

-- ---------- contact_messages ----------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  company     text,
  message     text not null check (char_length(message) between 10 and 4000),
  ip          text,
  user_agent  text,
  referer     text,
  handled     boolean not null default false,
  notes       text
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

-- ---------- Row Level Security ----------
-- Anon & authenticated roles get NO direct access. Inserts go through
-- the /api/contact serverless function using the service_role key.
alter table public.contact_messages enable row level security;

-- No policies → default deny for anon. Service role bypasses RLS by design.

-- ---------- Optional: quiz submissions (build-together.html) ----------
-- Kept here for if you ever want to persist quiz funnel data. Disabled by
-- default (no table created). Uncomment to enable.
-- create table public.quiz_submissions (
--   id uuid primary key default gen_random_uuid(),
--   created_at timestamptz not null default now(),
--   domain text, stage text, constraint_ text, team text, intent text,
--   plan_text text, used_real_claude boolean default false,
--   ip text, user_agent text
-- );
-- alter table public.quiz_submissions enable row level security;

-- ---------- View: unread inbox ----------
create or replace view public.contact_messages_unread as
  select id, created_at, name, email, company, message
  from public.contact_messages
  where handled = false
  order by created_at desc;

-- Grant view read to authenticated role if you want a Supabase dashboard
-- query view; otherwise read directly as service_role.
grant select on public.contact_messages_unread to authenticated;

-- =================================================================
--  Maintenance commands (run as needed)
-- =================================================================
-- Mark a message as handled:
--   update public.contact_messages set handled = true where id = '...';
-- Purge spam older than 30 days:
--   delete from public.contact_messages
--   where created_at < now() - interval '30 days'
--   and message ~* '(crypto|bitcoin|seo expert|guest post)';
