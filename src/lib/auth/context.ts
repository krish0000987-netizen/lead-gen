"use client";

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface TenantContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  workspaceId: string | null;
  role: OrgRole;
}

export function useTenantContext(initial: TenantContext) {
  return initial;
}
