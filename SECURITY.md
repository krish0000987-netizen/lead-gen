# Security

## Key handling

- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never imported into client components, never sent to the browser, never logged.
- Anon key is public and safe only because RLS protects every table.
- Provider credentials are stored encrypted at rest (`provider_credentials.encrypted_payload`, AES-256-GCM via app-held key) and displayed only masked ("Connected · last tested 2h ago"). Never shown in full.

## Tenant isolation

- RLS on every tenant table (`is_org_member` / `is_org_admin` helpers resolving membership from the JWT).
- Server-side authorization guards (`requireUser`, `requireOrgRole`, `requireWorkspaceContext`) on every route handler and server action.
- The frontend never makes authorization decisions.

## Auth

- Supabase Auth with httpOnly, secure cookies via `@supabase/ssr` middleware (session refresh included).
- OAuth flows validate `state`; redirect URIs are allow-listed.

## Input & API surface

- Zod validation on every route handler and server action input.
- API keys (Phase 8): hashed at rest, scoped, rate-limited, revocable.
- Rate limiting on public endpoints; request IDs + structured logging on every backend request (`request_id`, `user_id`, `org`, `workspace`, `provider`, `latency`, `status`, `error_type`).

## Webhooks

- Signature validation per provider; idempotent processing keyed on event ID + payload hash.

## Audit

`audit_logs` records user/org/workspace, action, entity, provider, cost, result, request ID for: provider connection, searches, enrichment, exports, campaign launches, bulk sends, API key creation, permission changes, cost confirmations.

## Secrets hygiene

`.env.local` is git-ignored. Secrets committed to the repo is a rotate-everything event. Provider secrets never travel to the browser.
