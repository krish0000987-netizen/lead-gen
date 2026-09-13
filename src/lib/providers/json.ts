import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus } from "./types";

export class JSONProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "json", displayName: "JSON Import", category: "IMPORT" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "import", description: "Import JSON datasets" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    return { status: "connected" };
  }
}
