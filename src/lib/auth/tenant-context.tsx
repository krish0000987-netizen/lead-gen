"use client";

import { createContext, useContext } from "react";

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface TenantContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  workspaceId: string | null;
  role: OrgRole;
}

const TenantContextValue = createContext<TenantContext | null>(null);

export function TenantProvider({ value, children }: { value: TenantContext; children: React.ReactNode }) {
  return <TenantContextValue.Provider value={value}>{children}</TenantContextValue.Provider>;
}

export function useTenantContext(): TenantContext {
  const ctx = useContext(TenantContextValue);
  if (!ctx) throw new Error("useTenantContext must be used within TenantProvider");
  return ctx;
}
