-- ─── AIO Pulse — Supabase Schema ─────────────────────────────────────────────
-- Run this in your Supabase SQL editor to set up all tables.
-- Go to: https://app.supabase.com → your project → SQL Editor → New query

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- ─── BRANDS ───────────────────────────────────────────────────────────────────
create table if not exists brands (
  id           uuid primary key default uuid_generate_v4(),
  user_id      text not null,                          -- Supabase auth user id
  name         text not null,
  slug         text not null,
  description  text,
  domain       text,                                   -- primary domain
  aliases      text[] default '{}',                   -- brand name variants
  domains      text[] default '{}',                   -- all domains/subdomains
  competitors  text[] default '{}',                   -- competitor brand names
  industry     text,
  color        text default '#6366f1',                -- ui accent color
  logo_url     text,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists brands_user_id_idx on brands(user_id);
create index if not exists brands_slug_idx on brands(slug);

-- ─── PROMPTS ──────────────────────────────────────────────────────────────────
create table if not exists prompts (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid not null references brands(id) on delete cascade,
  user_id      text not null,
  text         text not null,                         -- the prompt/query to monitor
  language     text default 'en',
  market       text default 'global',
  category     text,                                  -- 'awareness' | 'comparison' | 'alternative' | 'custom'
  engines      text[] default '{chatgpt,gemini,perplexity}',
  is_active    boolean default true,
  run_frequency text default 'daily',                 -- 'hourly' | 'daily' | 'weekly'
  last_run_at  timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists prompts_brand_id_idx on prompts(brand_id);
create index if not exists prompts_user_id_idx on prompts(user_id);

-- ─── MONITORING RESULTS ───────────────────────────────────────────────────────
create table if not exists monitoring_results (
  id                uuid primary key default uuid_generate_v4(),
  prompt_id         uuid not null references prompts(id) on delete cascade,
  brand_id          uuid not null references brands(id) on delete cascade,
  user_id           text not null,
  engine            text not null,                    -- 'chatgpt' | 'gemini' | 'perplexity'
  prompt_text       text not null,                   -- snapshot of prompt at run time
  response_text     text not null,                   -- full AI response
  brand_mentioned   boolean default false,
  mention_position  int,                             -- 1 = first mention, null = not mentioned
  mention_count     int default 0,
  mention_type      text,                            -- 'direct' | 'indirect' | 'none'
  visibility_score  int default 0,                  -- 0-100
  sentiment         text,                            -- 'positive' | 'negative' | 'neutral'
  sentiment_score   float,                          -- -1.0 to 1.0
  cited_urls        text[] default '{}',
  competitor_mentions jsonb default '[]',            -- [{name, position, count}]
  has_hallucination boolean default false,
  hallucination_flags jsonb default '[]',            -- [{text, severity, type}]
  raw_response      jsonb,                          -- full API response for debugging
  created_at        timestamptz default now()
);

create index if not exists monitoring_results_brand_id_idx on monitoring_results(brand_id);
create index if not exists monitoring_results_prompt_id_idx on monitoring_results(prompt_id);
create index if not exists monitoring_results_engine_idx on monitoring_results(engine);
create index if not exists monitoring_results_created_at_idx on monitoring_results(created_at desc);
create index if not exists monitoring_results_user_id_idx on monitoring_results(user_id);

-- ─── ALERTS ───────────────────────────────────────────────────────────────────
create table if not exists alert_rules (
  id           uuid primary key default uuid_generate_v4(),
  brand_id     uuid not null references brands(id) on delete cascade,
  user_id      text not null,
  name         text not null,
  type         text not null,    -- 'mention_new' | 'sentiment_drop' | 'competitor_ahead' | 'hallucination' | 'visibility_change'
  condition    jsonb not null,   -- {threshold, operator, engine, etc.}
  channels     text[] default '{email}',
  email        text,
  webhook_url  text,
  is_active    boolean default true,
  last_fired_at timestamptz,
  created_at   timestamptz default now()
);

create index if not exists alert_rules_brand_id_idx on alert_rules(brand_id);
create index if not exists alert_rules_user_id_idx on alert_rules(user_id);

-- ─── ALERT EVENTS ─────────────────────────────────────────────────────────────
create table if not exists alert_events (
  id              uuid primary key default uuid_generate_v4(),
  alert_rule_id   uuid not null references alert_rules(id) on delete cascade,
  brand_id        uuid not null references brands(id) on delete cascade,
  user_id         text not null,
  type            text not null,
  title           text not null,
  message         text not null,
  data            jsonb default '{}',
  channels_sent   text[] default '{}',
  is_read         boolean default false,
  created_at      timestamptz default now()
);

create index if not exists alert_events_user_id_idx on alert_events(user_id);
create index if not exists alert_events_brand_id_idx on alert_events(brand_id);
create index if not exists alert_events_created_at_idx on alert_events(created_at desc);
create index if not exists alert_events_is_read_idx on alert_events(is_read);

-- ─── BRAND HEALTH SCORES (aggregated daily) ───────────────────────────────────
create table if not exists brand_health_scores (
  id                uuid primary key default uuid_generate_v4(),
  brand_id          uuid not null references brands(id) on delete cascade,
  user_id           text not null,
  date              date not null default current_date,
  visibility_score  float default 0,
  sentiment_score   float default 0,
  hallucination_rate float default 0,
  mention_count     int default 0,
  citation_count    int default 0,
  health_score      float default 0,  -- composite 0-100
  engine_breakdown  jsonb default '{}',
  created_at        timestamptz default now(),
  unique(brand_id, date)
);

create index if not exists brand_health_scores_brand_id_idx on brand_health_scores(brand_id);
create index if not exists brand_health_scores_date_idx on brand_health_scores(date desc);

-- ─── RLS POLICIES ─────────────────────────────────────────────────────────────
-- Enable Row Level Security (users only see their own data)
alter table brands enable row level security;
alter table prompts enable row level security;
alter table monitoring_results enable row level security;
alter table alert_rules enable row level security;
alter table alert_events enable row level security;
alter table brand_health_scores enable row level security;

-- Brands policies
create policy "users_own_brands" on brands
  using (user_id = auth.uid()::text);

create policy "users_insert_brands" on brands for insert
  with check (user_id = auth.uid()::text);

create policy "users_update_brands" on brands for update
  using (user_id = auth.uid()::text);

create policy "users_delete_brands" on brands for delete
  using (user_id = auth.uid()::text);

-- Prompts policies
create policy "users_own_prompts" on prompts
  using (user_id = auth.uid()::text);

create policy "users_insert_prompts" on prompts for insert
  with check (user_id = auth.uid()::text);

create policy "users_update_prompts" on prompts for update
  using (user_id = auth.uid()::text);

create policy "users_delete_prompts" on prompts for delete
  using (user_id = auth.uid()::text);

-- Monitoring results
create policy "users_own_monitoring" on monitoring_results
  using (user_id = auth.uid()::text);

create policy "users_insert_monitoring" on monitoring_results for insert
  with check (user_id = auth.uid()::text);

-- Alerts
create policy "users_own_alerts" on alert_rules
  using (user_id = auth.uid()::text);

create policy "users_insert_alerts" on alert_rules for insert
  with check (user_id = auth.uid()::text);

create policy "users_update_alerts" on alert_rules for update
  using (user_id = auth.uid()::text);

create policy "users_delete_alerts" on alert_rules for delete
  using (user_id = auth.uid()::text);

create policy "users_own_alert_events" on alert_events
  using (user_id = auth.uid()::text);

create policy "users_update_alert_events" on alert_events for update
  using (user_id = auth.uid()::text);

create policy "users_own_health_scores" on brand_health_scores
  using (user_id = auth.uid()::text);

-- ─── SERVICE ROLE POLICIES (for API routes using service key) ─────────────────
-- These allow your Next.js API routes (using SUPABASE_SERVICE_KEY) to bypass RLS
create policy "service_all_brands" on brands
  using (true) with check (true);

-- Note: In production, use proper service role with restricted access.
-- For development, you can also disable RLS temporarily:
-- alter table brands disable row level security;

-- ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brands_updated_at before update on brands
  for each row execute function update_updated_at();

create trigger prompts_updated_at before update on prompts
  for each row execute function update_updated_at();
