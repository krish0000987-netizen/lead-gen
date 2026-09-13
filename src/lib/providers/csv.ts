import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus, NormalizedCompany, NormalizedContact } from "./types";

export class CSVProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "csv", displayName: "CSV Import", category: "IMPORT" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "import", description: "Import CSV datasets" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    return { status: "connected" };
  }
}
