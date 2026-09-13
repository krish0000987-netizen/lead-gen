# Architecture

## Product

AI-native B2B prospecting, lead-intelligence, CRM and sales-engagement SaaS. Multi-tenant from day one; provider-backed data (never fabricated); every paid operation is transparent and confirmed.

## High-level

```
Web App (Next.js)      AI Agent (internal AgentExecutor)
        └──────────┬──────────┘
            API layer (server routes / server actions)
                   │
        Provider Abstraction Layer
     (DataProvider | AIProvider | EmailProvider | WhatsAppProvider)
        │                │                │
   Vibe (MCP)      Apollo / Hunter    Apify / REST / CSV / JSON / DB
        └──────────┬────────────────────┘
            Normalization → Deduplication
                   │
          Supabase PostgreSQL (RLS-enforced tenants)
                   │
        CRM │ Email │ WhatsApp outreach
```

Hard rules:

- Vibe Prospecting is **one provider**, never a hard dependency.
- The browser never sees provider secrets or the service-role key.
- Long/bulk/expensive work goes through the database-backed `JobQueue`, never a browser request.
- Raw provider payloads are decoupled from canonical models via the normalization layer (Provider DTO → canonical Company/Contact → Lead).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, React, Tailwind CSS |
| Backend | Next.js route handlers + server actions |
| Database | Supabase PostgreSQL, RLS on every tenant table |
| Auth | Supabase Auth (cookie-based via `@supabase/ssr`) |
| Jobs | `JobQueue` interface, initial impl: database-backed `jobs` table polled by a worker route |
| AI | `AIProvider` interface (Anthropic/OpenAI adapters, later) |
| Data | `DataProvider` interface (Vibe MCP, Apollo, Hunter, Apify, REST, CSV, JSON, DB) |

## Multi-tenancy

`users → organization_members → organizations → workspaces → workspace-scoped entities`.

Roles: OWNER, ADMIN, MANAGER, MEMBER, VIEWER. Isolation is enforced by RLS policies plus server-side authorization helpers (`requireWorkspaceContext`); the frontend never performs authorization.

Tenant context resolution: authenticated user → active membership (cookie `active_workspace`) → org/workspace pair used in every query.

## Request flow (search example)

1. ICP/filter builder produces a structured search.
2. Server validates scope, checks provider connection + policies + cost estimate.
3. If credits > threshold → user confirmation recorded in `audit_logs`.
4. Job enqueued; worker calls provider adapter (e.g. Vibe MCP client).
5. Response → Provider DTO → normalization → dedup → canonical records with provenance (`*_sources`, `*_field_values`).
6. Lead scoring, results visible in UI with source attribution.

## Directory layout

```
src/
  app/            routes (auth, dashboard, api/v1)
  components/     UI
  lib/
    supabase/     clients (browser, server, service), middleware helpers
    auth/         tenant context, guards
    providers/    DataProvider interface + adapters
    jobs/         JobQueue interface + SupabaseJobs
    scoring/      lead/website scoring engines (Phase 4)
supabase/
  migrations/     ordered SQL migrations
docs (root): ARCHITECTURE.md DATABASE.md PROVIDERS.md SECURITY.md ROADMAP.md
```

## Portability beyond Supabase free tier

All DB access goes through `src/lib/supabase/*` and repository helpers; jobs and provider calls sit behind interfaces (`JobQueue`, `DataProvider`). Swapping to Redis/BullMQ/Trigger.dev or a standalone Postgres is an implementation change, not a rewrite.
