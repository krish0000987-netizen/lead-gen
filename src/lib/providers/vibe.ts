import { BaseProvider } from "./base";
import type {
  DataProvider,
  ProviderCapability,
  HealthStatus,
  CostEstimate,
  NormalizedCompany,
  NormalizedContact,
  CompanyResearch,
} from "./types";

export class VibeProspectingProvider extends BaseProvider {
  getProviderInfo() {
    return {
      id: "vibe_prospecting",
      displayName: "Vibe Prospecting",
      category: "MCP",
    };
  }

  getCapabilities(): ProviderCapability[] {
    return [
      { name: "company_search", description: "Find companies by filters" },
      { name: "contact_search", description: "Discover contacts within companies" },
      { name: "company_research", description: "Research a company" },
      { name: "contact_enrichment", description: "Enrich contact records" },
      { name: "events", description: "Company events and signals" },
      { name: "export", description: "Export datasets where supported" },
    ];
  }

  async healthCheck(): Promise<HealthStatus> {
    const token = this.connection?.accessToken;
    if (!token) {
      return { status: "pending_auth", message: "OAuth not connected. Click Connect to authenticate." };
    }
    try {
      const result = await this.callMCP("tools/list", {});
      if (result?.tools) {
        return { status: "connected", lastCheckedAt: new Date().toISOString(), message: `Connected · ${result.tools.length} tools available` };
      }
      return { status: "connected", lastCheckedAt: new Date().toISOString() };
    } catch (err) {
      return { status: "error", message: "Failed to reach Vibe MCP endpoint" };
    }
  }

  async estimateCost(operation: string, count = 100): Promise<CostEstimate | null> {
    if (operation === "company_search" || operation === "contact_search") {
      return { estimatedRecords: count, credits: count * 0.1 };
    }
    if (operation === "enrichment") {
      return { estimatedRecords: count, credits: count * 0.5 };
    }
    return null;
  }

  async searchCompanies(filters: Record<string, any>): Promise<NormalizedCompany[]> {
    const args: Record<string, any> = {};
    if (filters.industry) args.industry = filters.industry;
    if (filters.country) args.country = filters.country;
    if (filters.state) args.state = filters.state;
    if (filters.city) args.city = filters.city;
    if (filters.employeeMin || filters.employeeMax) args.employeeRange = `${filters.employeeMin ?? ""}-${filters.employeeMax ?? ""}`;
    if (filters.keywords) args.keywords = filters.keywords;
    if (filters.limit) args.limit = Math.min(filters.limit, 100);
    if (filters.query) args.query = filters.query;

    const result = await this.callMCP("tools/call", { name: "find_companies", arguments: args });
    const companies = this.extractCompanies(result);
    return companies.map((c) => this.normalizeCompany(c));
  }

  async searchContacts(filters: Record<string, any>): Promise<NormalizedContact[]> {
    const args: Record<string, any> = {};
    if (filters.companyDomain) args.companyDomain = filters.companyDomain;
    if (filters.jobTitles) args.jobTitles = Array.isArray(filters.jobTitles) ? filters.jobTitles : [filters.jobTitles];
    if (filters.country) args.country = filters.country;
    if (filters.limit) args.limit = Math.min(filters.limit, 100);

    const result = await this.callMCP("tools/call", { name: "find_contacts", arguments: args });
    const contacts = this.extractContacts(result);
    return contacts.map((c) => this.normalizeContact(c));
  }

  async enrichCompany(ref: { companyId?: string; domain?: string; name?: string }): Promise<NormalizedCompany | null> {
    if (!ref.domain && !ref.name) return null;
    const result = await this.callMCP("tools/call", { name: "enrich_company", arguments: { domain: ref.domain, name: ref.name } });
    const companies = this.extractCompanies(result);
    return companies.length > 0 ? this.normalizeCompany(companies[0]) : null;
  }

  async enrichContact(ref: { contactId?: string; email?: string; linkedinUrl?: string }): Promise<NormalizedContact | null> {
    if (!ref.email && !ref.linkedinUrl) return null;
    const result = await this.callMCP("tools/call", { name: "enrich_contact", arguments: { email: ref.email, linkedinUrl: ref.linkedinUrl } });
    const contacts = this.extractContacts(result);
    return contacts.length > 0 ? this.normalizeContact(contacts[0]) : null;
  }

  async researchCompany(ref: { companyId?: string; domain?: string; name?: string }): Promise<CompanyResearch | null> {
    if (!ref.domain && !ref.name) return null;
    const result = await this.callMCP("tools/call", { name: "research_company", arguments: { domain: ref.domain, name: ref.name } });
    return this.extractResearch(result);
  }

  async findEmails(ref: { domain?: string; companyName?: string; fullName?: string }): Promise<NormalizedContact[] | null> {
    if (!ref.domain) return null;
    const result = await this.callMCP("tools/call", { name: "find_emails", arguments: { domain: ref.domain, companyName: ref.companyName, fullName: ref.fullName } });
    const contacts = this.extractContacts(result);
    return contacts.map((c) => this.normalizeContact(c));
  }

  async verifyEmail(email: string): Promise<{ valid: boolean; status?: string } | null> {
    const result = await this.callMCP("tools/call", { name: "verify_email", arguments: { email } });
    const content = this.extractText(result);
    const valid = content ? !content.toLowerCase().includes("invalid") && !content.toLowerCase().includes("undeliverable") : undefined;
    return { valid: valid ?? false, status: valid === true ? "valid" : "invalid" };
  }

  private async callMCP(method: string, params: Record<string, any>): Promise<any> {
    const endpoint = this.connection?.endpoint || process.env.NEXT_PUBLIC_VIBE_MCP_ENDPOINT || "https://vibeprospecting.explorium.ai/mcp";
    const accessToken = this.connection?.accessToken;
    if (!accessToken) {
      throw new Error("Vibe Prospecting OAuth token missing. Please reconnect.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
      // Use server-side env for timeout control
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("Vibe Prospecting authentication expired. Reconnect required.");
      throw new Error(`Vibe MCP error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message || "MCP error");
    }
    return json.result;
  }

  private extractCompanies(result: any): any[] {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.content)) return result.content;
    if (result?.items) return result.items;
    if (result?.companies) return result.companies;
    if (typeof result?.content === "string") {
      try {
        const parsed = JSON.parse(result.content);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  private extractContacts(result: any): any[] {
    if (!result) return [];
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.content)) return result.content;
    if (result?.contacts) return result.contacts;
    if (typeof result?.content === "string") {
      try {
        const parsed = JSON.parse(result.content);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  private extractResearch(result: any): CompanyResearch | null {
    if (!result) return null;
    const text = typeof result === "string" ? result : result?.content || result?.text || "";
    if (!text) return null;
    return {
      overview: text.slice(0, 400),
      websiteWeaknesses: [],
    };
  }

  private extractText(result: any): string {
    if (!result) return "";
    if (typeof result === "string") return result;
    if (typeof result.content === "string") return result.content;
    if (Array.isArray(result.content)) return result.content.map((c: any) => c.text || "").join("\n");
    return JSON.stringify(result);
  }

  private normalizeCompany(raw: any): NormalizedCompany {
    const name = raw.name || raw.company_name || raw.legalName || "";
    const domain = raw.domain || raw.website_domain || "";
    const normalizedName = name.toLowerCase().replace(/\s+/g, " ").trim();
    const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");
    return {
      name,
      normalizedName,
      domain,
      normalizedDomain: normalizedDomain || undefined,
      website: raw.website || raw.url,
      description: raw.description || raw.about,
      industry: raw.industry || raw.category,
      subIndustry: raw.subIndustry || raw.sub_industry,
      employeeCount: raw.employeeCount || raw.employees,
      employeeRange: raw.employeeRange || raw.size || raw.employee_range,
      revenueRange: raw.revenueRange || raw.revenue,
      country: raw.country || raw.address?.country,
      state: raw.state || raw.address?.state,
      city: raw.city || raw.address?.city,
      postalCode: raw.postalCode || raw.address?.postalCode,
      address: raw.address?.street || raw.address,
      phone: raw.phone || raw.primaryPhone,
      foundedYear: raw.foundedYear || raw.founded_year,
      linkedinUrl: raw.linkedinUrl || raw.linkedin_url,
      technologies: Array.isArray(raw.technologies) ? raw.technologies : raw.tech ? [raw.tech] : [],
      keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
      hiringSignals: Array.isArray(raw.hiringSignals) ? raw.hiringSignals : [],
      growthSignals: Array.isArray(raw.growthSignals) ? raw.growthSignals : [],
      recentEvents: Array.isArray(raw.recentEvents) ? raw.recentEvents : [],
      sourceProvider: "vibe_prospecting",
      sourceRecordId: raw.id || raw.externalId || raw.recordId,
      confidence: raw.confidence ?? 0.8,
      raw,
    };
  }

  private normalizeContact(raw: any): NormalizedContact {
    const fullName = raw.fullName || raw.full_name || [raw.firstName, raw.lastName].filter(Boolean).join(" ") || raw.name || "";
    const email = raw.email || raw.workEmail;
    return {
      firstName: raw.firstName || raw.first_name,
      lastName: raw.lastName || raw.last_name,
      fullName,
      jobTitle: raw.jobTitle || raw.title || raw.position,
      department: raw.department,
      seniority: raw.seniority || raw.level,
      companyName: raw.companyName || raw.company?.name,
      workEmail: email,
      phone: raw.phone || raw.primaryPhone,
      mobilePhone: raw.mobilePhone || raw.mobile,
      linkedinUrl: raw.linkedinUrl || raw.linkedin_url,
      location: raw.location || [raw.city, raw.country].filter(Boolean).join(", "),
      country: raw.country,
      previousCompanies: Array.isArray(raw.previousCompanies) ? raw.previousCompanies : [],
      experience: Array.isArray(raw.experience) ? raw.experience : [],
      status: email ? "VERIFIED" : "NEW",
      sourceProvider: "vibe_prospecting",
      sourceRecordId: raw.id || raw.externalId || raw.recordId,
      confidence: raw.confidence ?? 0.8,
      raw,
    };
  }
}
