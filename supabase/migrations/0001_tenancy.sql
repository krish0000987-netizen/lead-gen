-- 0001_tenancy: extensions, helpers, identity & tenancy
create extension if not exists "pgcrypto";

-- ============ enums ============
create type org_role as enum ('OWNER','ADMIN','MANAGER','MEMBER','VIEWER');

-- ============ helper functions ============
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ identity & tenancy ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Organization-defined custom fields
create table public.custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity text not null check (entity in ('company','contact','lead','deal')),
  name text not null,
  field_type text not null check (field_type in ('text','number','boolean','date','select','multi_select','url')),
  options jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, entity, name)
);

-- Membership helpers resolve from the JWT of the calling session.
-- (defined after organization_members exists)
create or replace function public.is_org_member(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org and m.user_id = auth.uid()
      and m.role in ('OWNER','ADMIN')
  );
$$;

-- auto-create profile + default org/membership on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));

  insert into public.organizations (name, slug, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'organization', split_part(new.email,'@',1) || '''s Org'),
    'org-' || substr(replace(new.id::text,'-',''),1,12),
    new.id
  ) returning id into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org, new.id, 'OWNER');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ triggers ============
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger trg_workspaces_updated before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.custom_fields enable row level security;

create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy orgs_select on public.organizations
  for select using (is_org_member(id));
create policy orgs_write on public.organizations
  for all using (is_org_admin(id)) with check (is_org_admin(id));

create policy org_members_select on public.organization_members
  for select using (user_id = auth.uid() or is_org_member(organization_id));
create policy org_members_write on public.organization_members
  for all using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));

create policy workspaces_select on public.workspaces
  for select using (is_org_member(organization_id));
create policy workspaces_write on public.workspaces
  for all using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));

create policy ws_members_select on public.workspace_members
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.workspaces w
               where w.id = workspace_id and is_org_member(w.organization_id))
  );
create policy ws_members_write on public.workspace_members
  for all using (
    exists (select 1 from public.workspaces w
            where w.id = workspace_id and is_org_admin(w.organization_id))
  )
  with check (
    exists (select 1 from public.workspaces w
            where w.id = workspace_id and is_org_admin(w.organization_id))
  );

create policy custom_fields_select on public.custom_fields
  for select using (is_org_member(organization_id));
create policy custom_fields_write on public.custom_fields
  for all using (is_org_admin(organization_id))
  with check (is_org_admin(organization_id));

-- ============ indexes ============
create index idx_org_members_org on public.organization_members(organization_id);
create index idx_org_members_user on public.organization_members(user_id);
create index idx_workspaces_org on public.workspaces(organization_id);
create index idx_ws_members_ws on public.workspace_members(workspace_id);
create index idx_ws_members_user on public.workspace_members(user_id);
