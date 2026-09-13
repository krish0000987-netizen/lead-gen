-- 0003_leads_lists_search: leads, scoring, tags, lists, saved searches
create type lead_status as enum
  ('NEW','QUALIFIED','CONTACTED','REPLIED','MEETING','PROPOSAL','WON','LOST','DISQUALIFIED');

-- ============ leads ============
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  company_id uuid references public.companies(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  status lead_status not null default 'NEW',
  lead_score int,
  opportunity_score int,
  owner_id uuid references auth.users(id) on delete set null,
  source_provider text,
  dedup_key text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, company_id, contact_id)
);
create index idx_leads_org on public.leads(organization_id);
create index idx_leads_status on public.leads(organization_id, status);
create index idx_leads_score on public.leads(organization_id, lead_score desc);
create index idx_leads_workspace on public.leads(workspace_id);

-- explainable scoring history
create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  icp_fit int, website_opportunity int, company_fit int,
  buying_signal int, engagement int, total int,
  model text,
  scored_at timestamptz not null default now()
);
create table public.lead_score_factors (
  id uuid primary key default gen_random_uuid(),
  lead_score_id uuid not null references public.lead_scores(id) on delete cascade,
  factor text not null,
  points int not null,
  max_points int not null,
  reason text not null
);

create table public.lead_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (lead_id, tag)
);
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create type activity_type as enum
  ('NOTE','STATUS_CHANGE','EMAIL_SENT','EMAIL_REPLY','WHATSAPP_SENT','WHATSAPP_REPLY',
   'CALL','MEETING','TASK','ENRICHMENT','SCORE_UPDATE','IMPORT','EXPORT','AI_RESEARCH','OTHER');
create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  activity_type activity_type not null default 'OTHER',
  title text,
  payload jsonb,
  occurred_at timestamptz not null default now()
);
create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_provider text not null,
  source_record_id text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ============ lists ============
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  description text,
  list_type text not null default 'STATIC' check (list_type in ('STATIC','DYNAMIC')),
  criteria jsonb, -- dynamic list definition (structured filters)
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (list_id, lead_id)
);

-- ============ searches ============
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  entity_type text not null check (entity_type in ('company','contact')),
  filters jsonb not null,
  schedule text, -- cron, null = manual
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.search_runs (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid references public.saved_searches(id) on delete set null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text,
  requested_by uuid references auth.users(id) on delete set null,
  filters jsonb,
  result_count int,
  status text not null default 'COMPLETED',
  created_at timestamptz not null default now()
);
create table public.search_results (
  id uuid primary key default gen_random_uuid(),
  search_run_id uuid not null references public.search_runs(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  raw jsonb,
  created_at timestamptz not null default now()
);

-- ============ triggers ============
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();
create trigger trg_lists_updated before update on public.lists
  for each row execute function public.set_updated_at();
create trigger trg_saved_searches_updated before update on public.saved_searches
  for each row execute function public.set_updated_at();
create trigger trg_lead_notes_updated before update on public.lead_notes
  for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table public.leads enable row level security;
create policy leads_select on public.leads for select using (is_org_member(organization_id));
create policy leads_write on public.leads for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

do $$
declare t text; key text;
begin
  foreach t in array array['lead_tags','lead_notes','lead_activities','lead_sources'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (
      exists (select 1 from public.leads l where l.id = %I.lead_id and is_org_member(l.organization_id)))', t, t, t, t);
    execute format('create policy %I_write on public.%I for all using (
      exists (select 1 from public.leads l where l.id = %I.lead_id and is_org_member(l.organization_id)))
      with check (
      exists (select 1 from public.leads l where l.id = %I.lead_id and is_org_member(l.organization_id)))', t, t, t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['lists','saved_searches'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (is_org_member(organization_id))', t, t);
    execute format('create policy %I_write on public.%I for all using (is_org_member(organization_id))
      with check (is_org_member(organization_id))', t, t);
  end loop;
end $$;

alter table public.list_members enable row level security;
create policy list_members_rw on public.list_members for all using (
  exists (select 1 from public.lists l where l.id = list_id and is_org_member(l.organization_id)))
  with check (
  exists (select 1 from public.lists l where l.id = list_id and is_org_member(l.organization_id)));

alter table public.search_runs enable row level security;
create policy search_runs_rw on public.search_runs for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table public.search_results enable row level security;
create policy search_results_rw on public.search_results for all using (
  exists (select 1 from public.search_runs r
          where r.id = search_run_id and is_org_member(r.organization_id)))
  with check (
  exists (select 1 from public.search_runs r
          where r.id = search_run_id and is_org_member(r.organization_id)));

-- scoring history is reachable only through its lead
alter table public.lead_scores enable row level security;
create policy lead_scores_rw on public.lead_scores for all using (
  exists (select 1 from public.leads l where l.id = lead_id and is_org_member(l.organization_id)))
  with check (
  exists (select 1 from public.leads l where l.id = lead_id and is_org_member(l.organization_id)));

alter table public.lead_score_factors enable row level security;
create policy lead_score_factors_rw on public.lead_score_factors for all using (
  exists (select 1 from public.lead_scores s
          join public.leads l on l.id = s.lead_id
          where s.id = lead_score_id and is_org_member(l.organization_id)))
  with check (
  exists (select 1 from public.lead_scores s
          join public.leads l on l.id = s.lead_id
          where s.id = lead_score_id and is_org_member(l.organization_id)));

-- ============ indexes ============
create index idx_lead_tags_lead on public.lead_tags(lead_id);
create index idx_lead_notes_lead on public.lead_notes(lead_id);
create index idx_lead_activities_lead on public.lead_activities(lead_id, occurred_at desc);
create index idx_list_members_list on public.list_members(list_id);
create index idx_list_members_lead on public.list_members(lead_id);
create index idx_saved_searches_org on public.saved_searches(organization_id);
