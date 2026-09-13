import { DataProvider, HealthStatus, CostEstimate, ProviderCapability, NormalizedCompany, NormalizedContact, CompanyResearch } from "./types";

export abstract class BaseProvider implements DataProvider {
  protected connection: any;

  constructor(connection: any) {
    this.connection = connection ?? {};
  }

  abstract getProviderInfo(): { id: string; displayName: string; category: string };

  getCapabilities(): ProviderCapability[] {
    return [];
  }

  async healthCheck(): Promise<HealthStatus> {
    return { status: "disconnected", message: "Provider not configured" };
  }

  async estimateCost(_operation: string, _count?: number): Promise<CostEstimate | null> {
    return null;
  }

  async getUsage(_timeRange?: { from?: string; to?: string }): Promise<any[] | null> {
    return null;
  }

  async searchCompanies(_filters: Record<string, any>): Promise<NormalizedCompany[]> {
    throw new Error("searchCompanies not supported by this provider");
  }

  async searchContacts(_filters: Record<string, any>): Promise<NormalizedContact[]> {
    throw new Error("searchContacts not supported by this provider");
  }

  async enrichCompany(_ref: { companyId?: string; domain?: string; name?: string }): Promise<NormalizedCompany | null> {
    return null;
  }

  async enrichContact(_ref: { contactId?: string; email?: string; linkedinUrl?: string }): Promise<NormalizedContact | null> {
    return null;
  }

  async researchCompany(_ref: { companyId?: string; domain?: string; name?: string }): Promise<CompanyResearch | null> {
    return null;
  }

  async findEmails(_ref: { domain?: string; companyName?: string; fullName?: string }): Promise<NormalizedContact[] | null> {
    return null;
  }

  async verifyEmail(_email: string): Promise<{ valid: boolean; status?: string } | null> {
    return null;
  }

  async export(_filters: Record<string, any>, _format: "csv" | "json"): Promise<{ data: string; filename: string } | null> {
    return null;
  }
}
