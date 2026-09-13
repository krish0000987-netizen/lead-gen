# Roadmap

Status legend: ✅ done · 🚧 in progress · ⬜ not started

- **Phase 1 — Foundation** 🚧: project scaffold, Supabase migrations (tenancy, companies, contacts, leads, lists, search, jobs, imports/exports, audit, provider schema), auth, org/workspace creation, RLS everywhere, CSV import/export, dashboard shell, API v1 skeleton.
- **Phase 2 — Provider layer** ⬜: `DataProvider` interface, Vibe MCP adapter (OAuth, tool discovery, normalization), provider connection UI, usage tracking, provenance, dedup engine.
- **Phase 3 — More providers** ⬜: Apollo, Hunter, Apify, waterfall enrichment, generic REST connector, generic MCP connector.
- **Phase 4 — Intelligence** ⬜: website analyzer, lead/opportunity scoring with explainability, ICP builder, AI research, AI assistant, recommendation engine.
- **Phase 5 — CRM** ⬜: pipelines, deals, tasks, activities, kanban/table views.
- **Phase 6 — Email** ⬜: accounts (SMTP/Resend/SendGrid/Gmail/Microsoft), templates, sequences, reply/bounce processing, suppression.
- **Phase 7 — WhatsApp** ⬜: official Business API only — accounts, templates, conversations, campaigns, opt-out.
- **Phase 8 — Platform** ⬜: automation engine, webhooks, public API keys/scopes/rate limits, analytics.
- **Phase 9 — Scale** ⬜: agency mode, billing-ready plans, developer portal, lookalike engine.

## Current known limitations

- Phase 1 ships schema for providers/jobs but no live provider calls yet — no fake data is shown; provider pages render clean "not connected" states.
- Outreach tables (campaigns/sequences/email/WhatsApp) arrive with their phases; migrations are additive.
