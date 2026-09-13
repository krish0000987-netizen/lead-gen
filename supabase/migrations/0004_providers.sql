-- 0004_providers: provider catalog, connections, credentials, usage, MCP
-- Provider credentials are admin-only and stored encrypted by the app.

create table public.data_providers (
  id text primary key, -- e.g. 'vibe_prospecting', 'apollo', 'hunter', 'apify', 'csv'
  display_name text not null,
  category text not null default 'DATA',
  default_config jsonb not null default '{}'::jsonb,
  provider_policies jsonb not null default '{}'::jsonb
    check (provider_policies ?& array[]::text[]), -- free-form: allow_export, retention_days, ...
  created_at timestamptz not null default now()
);

insert into public.data_providers (id, display_name, category, default_config, provider_policies) values
  ('vibe_prospecting','Vibe Prospecting','MCP',
   '{"endpoint":"https://vibeprospecting.explorium.ai/mcp","auth_type":"oauth"}'::jsonb,
   '{"attribution_required":true}'::jsonb),
  ('apollo','Apollo','DATA','{}'::jsonb,'{"attribution_required":true}'::jsonb),
  ('hunter','Hunter','ENRICHMENT','{}'::jsonb,'{"attribution_required":true}'::jsonb),
  ('apify','Apify','DATA','{}'::jsonb,'{"attribution_required":true}'::jsonb),
  ('csv','CSV Import','IMPORT','{}'::jsonb,'{}'::jsonb),
  ('json','JSON Import','IMPORT','{}'::jsonb,'{}'::jsonb),
  ('generic_rest','Custom REST API','DATA','{}'::jsonb,'{}'::jsonb);

create table public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  provider_id text not null references public.data_providers(id),
  name text,
  status text not null default 'DISCONNECTED'
    check (status in ('CONNECTED','DISCONNECTED','ERROR','PENDING_AUTH','RATE_LIMITED')),
  config jsonb not null default '{}'::jsonb, -- non-secret config (endpoint, base url, mapping)
  last_health_check timestamptz,
  health_status text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider_id, workspace_id)
);
create index idx_provider_connections_org on public.provider_connections(organization_id);

create table public.provider_capabilities (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.provider_connections(id) on delete cascade,
  capability text not null, -- company_search, contact_search, email_verification, ...
  discovered_at timestamptz not null default now(),
  metadata jsonb,
  unique (connection_id, capability)
);

-- Encrypted secrets: AES-256-GCM payload encrypted app-side; never rendered in full.
create table public.provider_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.provider_connections(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  credential_type text not null check (credential_type in ('api_key','bearer','basic','oauth2','encrypted_bundle')),
  encrypted_payload bytea not null,
  key_version int not null default 1,
  masked_hint text, -- e.g. 'sk-…f3a1'
  last_tested_at timestamptz,
  last_test_status text,
  created_at timestamptz not null default now()
);

create table public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid references public.provider_connections(id) on delete cascade,
  provider_id text not null,
  operation text not null, -- search_companies, enrich_contact, export...
  count int not null default 1,
  credits_used numeric,
  cost_estimate numeric,
  success boolean not null default true,
  occurred_at timestamptz not null default now()
);
create index idx_provider_usage_org_time on public.provider_usage(organization_id, occurred_at desc);

create table public.provider_credit_balances (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.provider_connections(id) on delete cascade,
  used numeric, remaining numeric, unit text,
  refreshed_at timestamptz
);

create table public.provider_cost_estimates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider_id text not null,
  operation text not null,
  requested_count int not null,
  estimated_credits numeric,
  estimated_cost numeric,
  currency text default 'USD',
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.mcp_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  endpoint text not null,
  auth_type text not null default 'OAUTH' check (auth_type in ('OAUTH','API_KEY','NONE')),
  status text not null default 'PENDING_AUTH' check (status in ('CONNECTED','PENDING_AUTH','DISCONNECTED','ERROR')),
  capabilities jsonb not null default '[]'::jsonb, -- discovered via tools/list
  metadata jsonb not null default '{}'::jsonb,
  last_health_check timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_provider_connections_updated before update on public.provider_connections
  for each row execute function public.set_updated_at();
create trigger trg_mcp_connections_updated before update on public.mcp_connections
  for each row execute function public.set_updated_at();

-- ============ RLS ============
-- catalog: readable by authenticated users, writable only by service role
alter table public.data_providers enable row level security;
create policy data_providers_select on public.data_providers
  for select to authenticated using (true);

alter table public.provider_connections enable row level security;
create policy provider_connections_rw on public.provider_connections for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

alter table public.provider_capabilities enable row level security;
create policy provider_capabilities_rw on public.provider_capabilities for all using (
  exists (select 1 from public.provider_connections c
          where c.id = connection_id and is_org_member(c.organization_id)))
  with check (
  exists (select 1 from public.provider_connections c
          where c.id = connection_id and is_org_member(c.organization_id)));

-- credentials: admin-only, and the app only ever reads them server-side
alter table public.provider_credentials enable row level security;
create policy provider_credentials_rw on public.provider_credentials for all
  using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

do $$
declare t text;
begin
  foreach t in array array['provider_usage','provider_cost_estimates','mcp_connections'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_rw on public.%I for all using (is_org_member(organization_id))
      with check (is_org_member(organization_id))', t, t);
  end loop;
end $$;

alter table public.provider_credit_balances enable row level security;
create policy provider_credit_balances_rw on public.provider_credit_balances for all using (
  exists (select 1 from public.provider_connections c
          where c.id = connection_id and is_org_member(c.organization_id)))
  with check (
  exists (select 1 from public.provider_connections c
          where c.id = connection_id and is_org_member(c.organization_id)));
