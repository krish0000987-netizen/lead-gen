import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus } from "./types";

export class DatabaseProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "database", displayName: "User Database", category: "DATA" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "custom_query", description: "Query connected user database" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    const conn = this.connection?.connectionString;
    if (!conn) return { status: "disconnected" };
    return { status: "connected", lastCheckedAt: new Date().toISOString() };
  }
}
