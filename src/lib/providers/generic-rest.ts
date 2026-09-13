import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus, NormalizedCompany, NormalizedContact } from "./types";

export class GenericRESTProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "generic_rest", displayName: "Custom REST API", category: "DATA" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "custom", description: "User-configured REST endpoints" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    const url = this.connection?.baseUrl;
    if (!url) return { status: "disconnected" };
    try {
      await fetch(url, { method: "HEAD", headers: this.connection?.headers ?? {} });
      return { status: "connected", lastCheckedAt: new Date().toISOString() };
    } catch {
      return { status: "error", message: "Unable to reach endpoint" };
    }
  }

  async searchCompanies(_filters: Record<string, any>): Promise<NormalizedCompany[]> {
    throw new Error("Configure company search endpoint in connection settings");
  }

  async searchContacts(_filters: Record<string, any>): Promise<NormalizedContact[]> {
    throw new Error("Configure contact search endpoint in connection settings");
  }
}
