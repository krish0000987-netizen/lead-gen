export type ProviderId = "vibe_prospecting" | "apollo" | "hunter" | "apify" | "generic_rest" | "csv" | "json" | "database";

export interface ProviderCapability {
  name: string;
  description?: string;
}

export interface CostEstimate {
  credits?: number;
  cost?: number;
  currency?: string;
  estimatedRecords?: number;
}

export interface ProviderUsage {
  operation: string;
  count: number;
  creditsUsed?: number;
  costEstimate?: number;
}

export interface HealthStatus {
  status: "connected" | "disconnected" | "error" | "pending_auth" | "rate_limited";
  lastCheckedAt?: string;
  message?: string;
}

export interface NormalizedCompany {
  name: string;
  normalizedName: string;
  domain?: string;
  normalizedDomain?: string;
  website?: string;
  description?: string;
  industry?: string;
  subIndustry?: string;
  employeeCount?: number;
  employeeRange?: string;
  revenueRange?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  foundedYear?: number;
  linkedinUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  technologies?: string[];
  funding?: string;
  keywords?: string[];
  hiringSignals?: string[];
  growthSignals?: string[];
  recentEvents?: string[];
  sourceProvider: string;
  sourceRecordId?: string;
  confidence?: number;
  raw?: any;
}

export interface NormalizedContact {
  firstName?: string;
  lastName?: string;
  fullName: string;
  jobTitle?: string;
  department?: string;
  seniority?: string;
  companyId?: string;
  companyName?: string;
  workEmail?: string;
  phone?: string;
  mobilePhone?: string;
  linkedinUrl?: string;
  location?: string;
  country?: string;
  previousCompanies?: string[];
  experience?: any[];
  status?: "NEW" | "VERIFIED" | "UNVERIFIED" | "BOUNCED" | "INVALID" | "DO_NOT_CONTACT" | "UNSUBSCRIBED";
  sourceProvider: string;
  sourceRecordId?: string;
  confidence?: number;
  raw?: any;
}

export interface CompanyResearch {
  overview?: string;
  products?: string[];
  industry?: string;
  businessModel?: string;
  technology?: string[];
  funding?: string;
  competitors?: string[];
  hiring?: string[];
  events?: string[];
  websiteWeaknesses?: string[];
  growthSignals?: string[];
  challenges?: string[];
  recommendedDecisionMaker?: string;
  recommendedChannel?: string;
  recommendedAngle?: string;
}

export interface DataProvider {
  getProviderInfo(): { id: string; displayName: string; category: string };
  getCapabilities(): ProviderCapability[];
  healthCheck(): Promise<HealthStatus>;
  estimateCost(operation: string, count?: number): Promise<CostEstimate | null>;
  getUsage?(timeRange?: { from?: string; to?: string }): Promise<ProviderUsage[] | null>;
  searchCompanies?(filters: Record<string, any>): Promise<NormalizedCompany[]>;
  searchContacts?(filters: Record<string, any>): Promise<NormalizedContact[]>;
  enrichCompany?(ref: { companyId?: string; domain?: string; name?: string }): Promise<NormalizedCompany | null>;
  enrichContact?(ref: { contactId?: string; email?: string; linkedinUrl?: string }): Promise<NormalizedContact | null>;
  researchCompany?(ref: { companyId?: string; domain?: string; name?: string }): Promise<CompanyResearch | null>;
  findEmails?(ref: { domain?: string; companyName?: string; fullName?: string }): Promise<NormalizedContact[] | null>;
  verifyEmail?(email: string): Promise<{ valid: boolean; status?: string } | null>;
  export?(filters: Record<string, any>, format: "csv" | "json"): Promise<{ data: string; filename: string } | null>;
}

export type DataProviderConstructor = new (connection: any) => DataProvider;
