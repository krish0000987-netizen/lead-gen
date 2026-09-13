-- 0002_companies_contacts: canonical company/contact objects with provenance
create type contact_status as enum
  ('NEW','VERIFIED','UNVERIFIED','BOUNCED','INVALID','DO_NOT_CONTACT','UNSUBSCRIBED');

-- ============ companies ============
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  normalized_name text not null,
  legal_name text,
  domain text,
  normalized_domain text,
  website text,
  description text,
  industry text,
  sub_industry text,
  employee_count int,
  employee_range text,
  revenue_range text,
  country text, state text, city text, postal_code text, address text, phone text,
  founded_year int,
  linkedin_url text, facebook_url text, instagram_url text, x_url text,
  keywords text[],
  website_score int,
  opportunity_score int,
  confidence_score numeric(3,2),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.companies.normalized_domain is
  'lowercased, www-stripped domain used as primary dedup key (unique per org)';

create unique index uq_companies_org_domain on public.companies (organization_id, normalized_domain)
  where normalized_domain is not null;
create index idx_companies_org_name on public.companies(organization_id, normalized_name);
create index idx_companies_workspace on public.companies(workspace_id);
create index idx_companies_industry on public.companies(organization_id, industry);

create table public.company_domains (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  domain text not null,
  is_primary boolean not null default false,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  country text, state text, city text, postal_code text, address text,
  is_hq boolean not null default false,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.company_technologies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  technology text not null,
  category text,
  first_detected_at timestamptz, last_detected_at timestamptz,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.company_funding (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  round_type text, amount numeric, currency text default 'USD',
  announced_on date,
  investors text[],
  source_provider text, source_record_id text,
  created_at timestamptz not null default now()
);
create table public.company_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  event_type text not null,
  title text,
  occurred_on date,
  payload jsonb,
  source_provider text, source_record_id text,
  created_at timestamptz not null default now()
);
create table public.company_social_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  platform text not null,
  url text not null,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.company_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_provider text not null,
  source_record_id text,
  raw_ref jsonb,
  retrieved_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now()
);
-- provenance: multiple providers may disagree without destroying history
create table public.company_field_values (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  source_provider text not null,
  source_record_id text,
  confidence numeric(3,2),
  retrieved_at timestamptz not null default now(),
  verified_at timestamptz
);

-- ============ contacts ============
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  first_name text, last_name text, full_name text,
  job_title text, department text, seniority text,
  work_email text,
  normalized_email text,
  phone text, mobile_phone text,
  linkedin_url text,
  location text, country text,
  status contact_status not null default 'NEW',
  source_provider text, source_record_id text,
  confidence numeric(3,2),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_contacts_org_email on public.contacts (organization_id, normalized_email)
  where normalized_email is not null;
create unique index uq_contacts_org_linkedin on public.contacts (organization_id, linkedin_url)
  where linkedin_url is not null;
create index idx_contacts_org_company on public.contacts(organization_id, company_id);
create index idx_contacts_workspace on public.contacts(workspace_id);
create index idx_contacts_status on public.contacts(organization_id, status);

create table public.contact_emails (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  email text not null,
  normalized_email text not null,
  is_primary boolean not null default false,
  verification_status text check (verification_status in ('unknown','valid','invalid','risky','catch_all')),
  source_provider text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.contact_phones (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  phone text not null,
  phone_type text,
  is_primary boolean not null default false,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.contact_social_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  platform text not null,
  url text not null,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.contact_experience (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  company_name text, title text,
  started_on date, ended_on date,
  is_current boolean not null default false,
  source_provider text,
  created_at timestamptz not null default now()
);
create table public.contact_sources (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_provider text not null,
  source_record_id text,
  raw_ref jsonb,
  retrieved_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now()
);
create table public.contact_field_values (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  field_name text not null,
  value jsonb not null,
  source_provider text not null,
  source_record_id text,
  confidence numeric(3,2),
  retrieved_at timestamptz not null default now(),
  verified_at timestamptz
);

-- ============ triggers ============
create trigger trg_companies_updated before update on public.companies
  for each row execute function public.set_updated_at();
create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();

-- ============ RLS (uniform org-member policy) ============
alter table public.companies enable row level security;
create policy companies_select on public.companies
  for select using (is_org_member(organization_id));
create policy companies_write on public.companies for all
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array[
    'company_domains','company_locations','company_technologies',
    'company_funding','company_events','company_social_profiles','company_sources',
    'company_field_values'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (
      exists (select 1 from public.companies c where c.id = %I.company_id and is_org_member(c.organization_id)))', t, t, t);
    execute format('create policy %I_write on public.%I for all using (
      exists (select 1 from public.companies c where c.id = %I.company_id and is_org_member(c.organization_id)))
      with check (
      exists (select 1 from public.companies c where c.id = %I.company_id and is_org_member(c.organization_id)))', t, t, t, t);
  end loop;
end $$;

alter table public.contacts enable row level security;
create policy contacts_select on public.contacts
  for select using (is_org_member(organization_id));
create policy contacts_write on public.contacts
  for all using (is_org_member(organization_id)) with check (is_org_member(organization_id));

do $$
declare t text;
begin
  foreach t in array array[
    'contact_emails','contact_phones','contact_social_profiles',
    'contact_experience','contact_sources','contact_field_values'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I_select on public.%I for select using (
      exists (select 1 from public.contacts c where c.id = %I.contact_id and is_org_member(c.organization_id)))', t, t, t);
    execute format('create policy %I_write on public.%I for all using (
      exists (select 1 from public.contacts c where c.id = %I.contact_id and is_org_member(c.organization_id)))
      with check (
      exists (select 1 from public.contacts c where c.id = %I.contact_id and is_org_member(c.organization_id)))', t, t, t, t);
  end loop;
end $$;

create index idx_company_children_company on public.company_domains(company_id);
create index idx_company_tech_company on public.company_technologies(company_id);
create index idx_contact_children_contact on public.contact_emails(contact_id);
