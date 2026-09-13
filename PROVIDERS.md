# Providers

Everything external sits behind interfaces. A provider advertises capabilities; the UI only shows supported actions.

## Interfaces (src/lib/providers/)

```ts
interface DataProvider {
  getProviderInfo(): ProviderInfo
  getCapabilities(): ProviderCapability[]
  searchCompanies(q: CompanySearchQuery): Promise<NormalizedCompany[]>
  searchContacts(q: ContactSearchQuery): Promise<NormalizedContact[]>
  enrichCompany(ref): Promise<NormalizedCompany | null>
  enrichContact(ref): Promise<NormalizedContact | null>
  researchCompany(ref): Promise<CompanyResearch | null>
  findEmails(ref) / findPhones(ref) / verifyEmail(email)
  estimateCost(op): Promise<CostEstimate | null>
  getUsage(): Promise<ProviderUsage | null>
  healthCheck(): Promise<HealthStatus>
}
```

Methods a provider doesn't support throw `CapabilityNotSupported` — never fake results.

## Adapters

| Adapter | Auth | Capabilities |
|---|---|---|
| `VibeProspectingProvider` | OAuth (browser-based, remote MCP) | company_search, contact_search, company_research, contact_enrichment, events, export |
| `ApolloProvider` | API key | company_search, contact_search, enrichment |
| `HunterProvider` | API key | email_search, email_verification |
| `ApifyProvider` | API key | web_scraping, website_data, company_discovery |
| `GenericRESTProvider` | api-key/bearer/basic/oauth2 | configured |
| `CSVProvider` / `JSONProvider` | none | import |
| `DatabaseProvider` | connection string | user-owned Postgres |

Also: `AIProvider` (Anthropic/OpenAI), `EmailProvider` (SMTP/Resend/SendGrid/SES/Gmail/Microsoft), `WhatsAppProvider` (official WhatsApp Business API only — no unofficial WhatsApp Web automation).

## Vibe Prospecting (remote MCP)

- Endpoint: `https://vibeprospecting.explorium.ai/mcp` (remote MCP server by Explorium).
- Authentication is **browser-based OAuth** per the upstream docs (`explorium-ai/vibeprospecting-mcp`). We must NOT invent an API-key flow.
- The adapter discovers tools via MCP `tools/list` at connect time and maps responses through the normalization pipeline. Tool names are discovered, never hard-coded from undocumented assumptions.
- The SaaS's backend talks to Vibe directly; it never depends on a local Hermes/Claude Code process. Those are developer/operator tools only.
- Unconnected states are first-class: "Connect Vibe Prospecting" / "Vibe Prospecting is not connected". No fake data ever.

## Normalization pipeline

```
MCP/REST response → parser → Provider DTO → normalize → dedupe → canonical Company/Contact → Lead → AI Opportunity Engine
```

## Waterfall enrichment

Configurable per workspace: e.g. Vibe (company) → Vibe (contact) → Hunter (email if missing) → Apollo (extra fields) → Apify (website). Rules: skip providers when data is sufficient, cache results, never re-enrich the same contact repeatedly, track usage/cost/provenance at each step.

## Cost control

Before any credit-consuming op the UI shows provider, operation, requested count, estimated credits/cost, expected fields, and requires confirmation above a threshold. Confirmations are recorded in `audit_logs`. Org admins set `max_operation_credits`.

## License/provenance rules

Provider data is not assumed resellable/exportable/storable-forever. `provider_policies` flags (`allow_export`, `allow_storage`, `allow_display`, `retention_days`, `attribution_required`) are enforced by the export engine; unsupported actions are rejected with a clear explanation.
