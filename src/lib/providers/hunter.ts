import { BaseProvider } from "./base";
import type { DataProvider, ProviderCapability, HealthStatus, CostEstimate, NormalizedContact } from "./types";

export class HunterProvider extends BaseProvider {
  getProviderInfo() {
    return { id: "hunter", displayName: "Hunter", category: "ENRICHMENT" };
  }

  getCapabilities(): ProviderCapability[] {
    return [{ name: "email_search", description: "Find emails by domain/name" }, { name: "email_verification", description: "Verify email deliverability" }];
  }

  async healthCheck(): Promise<HealthStatus> {
    const key = this.connection?.apiKey;
    if (!key) return { status: "disconnected" };
    return { status: "connected", lastCheckedAt: new Date().toISOString() };
  }

  async findEmails(ref: { domain?: string; companyName?: string; fullName?: string }): Promise<NormalizedContact[] | null> {
    if (!ref.domain || !this.connection?.apiKey) return null;
    const res = await fetch(`https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(ref.domain)}&first_name=${encodeURIComponent(ref.fullName || "")}&api_key=${this.connection.apiKey}`);
    const data = await res.json();
    const email = data?.data?.email;
    if (!email) return null;
    return [{ fullName: ref.fullName || "", workEmail: email, status: "UNVERIFIED", sourceProvider: "hunter", sourceRecordId: email, confidence: 0.6, raw: data.data }];
  }

  async verifyEmail(email: string): Promise<{ valid: boolean; status?: string } | null> {
    if (!this.connection?.apiKey) return null;
    const res = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${this.connection.apiKey}`);
    const data = await res.json();
    const status = data?.data?.status;
    return { valid: status === "valid", status: status || "unknown" };
  }
}
