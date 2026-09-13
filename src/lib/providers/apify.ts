import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus, CostEstimate, NormalizedCompany } from "./types";

export class ApifyProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "apify", displayName: "Apify", category: "DATA" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "web_scraping", description: "Scrape websites" }, { name: "website_data", description: "Extract website metadata" }, { name: "company_discovery", description: "Discover companies from web sources" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    const key = this.connection?.apiKey;
    if (!key) return { status: "disconnected" };
    return { status: "connected", lastCheckedAt: new Date().toISOString() };
  }

  async searchCompanies(filters: Record<string, any>): Promise<NormalizedCompany[]> {
    if (!this.connection?.apiKey) throw new Error("Apify API key missing");
    return [];
  }
}
