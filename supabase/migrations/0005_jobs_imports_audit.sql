-- 0005_jobs_imports_audit: job queue, imports/exports, webhooks, notifications, audit, api keys

create type job_status as enum ('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED');
create type job_type as enum
  ('BULK_SEARCH','BULK_ENRICHMENT','WEBSITE_AUDIT','CSV_IMPORT','EXPORT',
   'AI_RESEARCH','CAMPAIGN_PROCESSING','SAVED_SEARCH_RUN');

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  job_type job_type not null,
  status job_status not null default 'QUEUED',
  payload jsonb not null default '{}'::jsonb,
  progress int not null default 0 check (progress between 0 and 100),
  record_count int,
  provider text,
  cost numeric,
  error text,
  retry_count int not null default 0,
  max_retries int not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz, locked_by text,
  created_by uuid references auth.users(id) on delete set null,
  started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_jobs_claim on public.jobs(status, run_after) where status = 'QUEUED';
create index idx_jobs_org on public.jobs(organization_id, created_at desc);

create table public.job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  level text not null default 'INFO' check (level in ('DEBUG','INFO','WARN','ERROR')),
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index idx_job_logs_job on public.job_logs(job_id, created_at);

-- claim next runnable job (worker loop)
create or replace function public.claim_next_job(worker_id text) returns public.jobs
language plpgsql security definer set search_path = public as $$
declare j public.jobs;
begin
  select * into j from public.jobs
   where status = 'QUEUED' and run_after <= now()
   order by created_at
   for update skip locked limit 1;
  if found then
    update public.jobs set status='RUNNING', locked_by=worker_id, locked_at=now(),
      started_at=coalesce(started_at, now()), updated_at=now()
     where id = j.id returning * into j;
  end if;
  return j;
end $$;

-- ============ imports / exports ============
create type import_status as enum ('PENDING','MAPPING','VALIDATING','IMPORTING','COMPLETED','FAILED');

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  file_name text not null,
  entity_type text not null default 'COMPANY' check (entity_type in ('COMPANY','CONTACT')),
  total_rows int, valid_rows int, invalid_rows int,
  duplicates int, created_count int, updated_count int, skipped_count int,
  status import_status not null default 'PENDING',
  field_mapping jsonb,
  error_report jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number int not null,
  raw jsonb not null,
  mapped jsonb,
  validation_errors jsonb,
  result text check (result in ('CREATED','UPDATED','SKIPPED','DUPLICATE','INVALID')),
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index idx_import_rows_import on public.import_rows(import_id);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  entity_type text not null,
  format text not null default 'CSV' check (format in ('CSV','JSON')),
  filters jsonb,
  record_count int,
  storage_path text,
  status text not null default 'PENDING' check (status in ('PENDING','RUNNING','COMPLETED','FAILED','REJECTED')),
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============ webhooks ============
create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  url text not null,
  secret_encrypted bytea,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid references public.webhook_endpoints(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  external_event_id text,
  provider text,
  event_type text,
  payload_hash text not null,
  payload jsonb,
  processing_status text not null default 'RECEIVED'
    check (processing_status in ('RECEIVED','PROCESSING','PROCESSED','FAILED','DUPLICATE')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

-- ============ notifications / audit / api keys ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'INFO',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, read_at);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text, entity_id uuid,
  provider text,
  cost numeric,
  result text,
  request_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_logs_org on public.audit_logs(organization_id, created_at desc);
create index idx_audit_logs_action on public.audit_logs(action);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  key_hash text not null,
  prefix text not null, -- shown to user: lg_live_ab12…
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index uq_api_keys_hash on public.api_keys(key_hash);

create table public.api_usage (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid not null references public.api_keys(id) on delete cascade,
  endpoint text, method text,
  status_code int,
  latency_ms int,
  request_id text,
  created_at timestamptz not null default now()
);
create index idx_api_usage_key_time on public.api_usage(api_key_id, created_at desc);

-- ============ triggers ============
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();
create trigger trg_imports_updated before update on public.imports
  for each row execute function public.set_updated_at();

-- ============ RLS ============
do $$
declare t text;
begin
  foreach t in array array['jobs','imports','exports','webhook_events','audit_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (is_org_member(organization_id))', t, t);
    execute format('create policy %I_insert on public.%I for insert with check (is_org_member(organization_id))', t, t);
    execute format('create policy %I_update on public.%I for update using (is_org_member(organization_id))', t, t);
  end loop;
end $$;

alter table public.job_logs enable row level security;
create policy job_logs_rw on public.job_logs for all using (
  exists (select 1 from public.jobs j where j.id = job_id and is_org_member(j.organization_id)))
  with check (
  exists (select 1 from public.jobs j where j.id = job_id and is_org_member(j.organization_id)));

alter table public.import_rows enable row level security;
create policy import_rows_rw on public.import_rows for all using (
  exists (select 1 from public.imports i where i.id = import_id and is_org_member(i.organization_id)))
  with check (
  exists (select 1 from public.imports i where i.id = import_id and is_org_member(i.organization_id)));

alter table public.webhook_endpoints enable row level security;
create policy webhook_endpoints_rw on public.webhook_endpoints for all
  using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

alter table public.notifications enable row level security;
create policy notifications_rw on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.api_keys enable row level security;
create policy api_keys_rw on public.api_keys for all
  using (is_org_admin(organization_id)) with check (is_org_admin(organization_id));

alter table public.api_usage enable row level security;
create policy api_usage_select on public.api_usage for select using (
  exists (select 1 from public.api_keys k
          where k.id = api_key_id and is_org_admin(k.organization_id)));
