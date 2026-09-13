import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus, CostEstimate, NormalizedCompany, NormalizedContact } from "./types";

export class ApolloProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "apollo", displayName: "Apollo", category: "DATA" };
  }

  getCapabilities(): ProviderCapability[] {
    return [
      { name: "company_search", description: "Search companies" },
      { name: "contact_search", description: "Search contacts" },
      { name: "enrichment", description: "Enrich company and contact records" },
    ];
  }

  async healthCheck(): Promise<HealthStatus> {
    const key = this.connection?.apiKey;
    if (!key) return { status: "disconnected" };
    return { status: "connected", lastCheckedAt: new Date().toISOString() };
  }

  async searchCompanies(filters: Record<string, any>): Promise<NormalizedCompany[]> {
    if (!this.connection?.apiKey) throw new Error("Apollo API key missing");
    const res = await fetch("https://api.apollo.io/v1/organizations/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.connection.apiKey}` },
      body: JSON.stringify({ q_org_domains: filters.domains, q_org_name: filters.query, page: 1, per_page: filters.limit || 25 }),
    });
    const data = await res.json();
    const orgs = data?.organizations || [];
    return orgs.map((o: any) => ({
      name: o.name, normalizedName: (o.name || "").toLowerCase(), domain: o.primary_domain, normalizedDomain: o.primary_domain?.toLowerCase(), website: o.website_url, industry: o.industry, employeeCount: o.estimated_num_employees, country: o.country, city: o.city, linkedinUrl: o.linkedin_url, sourceProvider: "apollo", sourceRecordId: o.id, confidence: 0.75, raw: o,
    }));
  }

  async searchContacts(filters: Record<string, any>): Promise<NormalizedContact[]> {
    if (!this.connection?.apiKey) throw new Error("Apollo API key missing");
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.connection.apiKey}` },
      body: JSON.stringify({ q_organization_domains: filters.companyDomains, q_titles: filters.jobTitles, page: 1, per_page: filters.limit || 25 }),
    });
    const data = await res.json();
    const people = data?.people || [];
    return people.map((p: any) => ({
      firstName: p.first_name, lastName: p.last_name, fullName: p.name, jobTitle: p.title, companyName: p.organization?.name, workEmail: p.email, phone: p.phone, linkedinUrl: p.linkedin_url, location: [p.city, p.country].filter(Boolean).join(", "), country: p.country, status: p.email ? "VERIFIED" : "NEW", sourceProvider: "apollo", sourceRecordId: p.id, confidence: 0.7, raw: p,
    }));
  }

  async enrichCompany(ref: { companyId?: string; domain?: string; name?: string }): Promise<NormalizedCompany | null> {
    if (!ref.domain && !ref.name) return null;
    const companies = await this.searchCompanies({ domains: ref.domain ? [ref.domain] : undefined, query: ref.name, limit: 1 });
    return companies[0] ?? null;
  }

  async enrichContact(ref: { contactId?: string; email?: string; linkedinUrl?: string }): Promise<NormalizedContact | null> {
    if (!ref.email && !ref.linkedinUrl) return null;
    const contacts = await this.searchContacts({ emails: [ref.email], limit: 1 });
    return contacts[0] ?? null;
  }
}
