# Database

PostgreSQL (Supabase). Migrations live in `supabase/migrations/`, applied in filename order.

## Conventions

- Every tenant table carries `organization_id uuid` (and `workspace_id` where workspace-scoped), `created_at`, `updated_at`.
- Every tenant table has RLS enabled with `USING` clauses rooted in membership helpers.
- Provenance: provider-sourced facts are also written to `company_sources` / `company_field_values` (and contact equivalents) so providers can disagree without destroying history.
- Freshness: `first_seen_at`, `last_seen_at`, `last_verified_at`, `source_created_at`, `source_updated_at` where applicable.

## Core helpers (migration 0001)

- `public.is_org_member(org uuid)` / `is_org_admin(org uuid)` — membership checks via JWT `sub`.
- `public.active_org_id()` — resolves membership from JWT claims/cookies server-side.
- Triggers: `set_updated_at()` on all tables with `updated_at`.

## Table groups

### Identity & tenancy (0001)
`profiles`, `organizations`, `organization_members` (role enum), `workspaces`, `workspace_members`, `custom_fields`.

### Companies & contacts (0002)
`companies` (+ `normalized_domain`, `normalized_name` for dedup), `company_domains`, `company_locations`, `company_technologies`, `company_funding`, `company_events`, `company_social_profiles`, `company_sources`, `company_field_values`.
`contacts` (status enum incl. `DO_NOT_CONTACT`, `UNSUBSCRIBED`), `contact_emails`, `contact_phones`, `contact_social_profiles`, `contact_experience`, `contact_sources`, `contact_field_values`.

### Leads & lists (0003)
`leads` (links company+contact, scores, owner), `lead_scores`, `lead_score_factors`, `lead_tags`, `lead_notes`, `lead_activities`, `lead_sources`, `lists` (static/dynamic), `list_members`, `saved_searches`, `search_runs`, `search_results`.

### Provider layer (0004)
`data_providers` (catalog), `provider_connections`, `provider_capabilities`, `provider_credentials` (encrypted payload, masked display), `provider_usage`, `provider_credit_balances`, `provider_cost_estimates`, `mcp_connections`.

### Jobs, import/export, audit (0005)
`jobs` (statuses queued/running/completed/failed/cancelled, progress, cost), `job_logs`, `imports`, `import_rows`, `exports`, `webhook_endpoints`, `webhook_events`, `notifications`, `audit_logs`, `api_keys`, `api_usage`.

Later phases add: enrichment, campaigns/sequences, email, WhatsApp, CRM pipelines/deals/tasks, website audits, AI research, automations. See ROADMAP.md.

## RLS pattern

```sql
alter table companies enable row level security;
create policy companies_select on companies for select
  using (is_org_member(organization_id));
create policy companies_write on companies for all
  using (is_org_member(organization_id))
  with check (is_org_member(organization_id));
```

Admin-only tables (e.g. `provider_credentials`) use `is_org_admin`.

## Deduplication keys

- Companies: `normalized_domain` (unique per org), fallback fuzzy on `normalized_name` + location.
- Contacts: normalized email (unique per org), `linkedin_url`, phone, name+company.
- Merges never destroy source rows; canonical values carry source + confidence + verified_at.

## Storage discipline (free tier)

Store normalized records, source IDs, and audit info. No raw HTML, no large scraped bodies, no duplicate provider payloads (retain raw response only when useful and permitted, capped).
