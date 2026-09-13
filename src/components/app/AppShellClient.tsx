"use client";

import { TenantProvider } from "@/lib/auth/tenant-context";
import AppShell from "./AppShell";

export default function AppShellClient({
  children,
  ...ctx
}: {
  children: React.ReactNode;
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: string;
  workspaceId?: string | null;
}) {
  return (
    <TenantProvider
      value={{
        userId: ctx.userId,
        email: ctx.email,
        organizationId: ctx.organizationId,
        organizationName: ctx.organizationName,
        workspaceId: ctx.workspaceId ?? null,
        role: ctx.role as "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER",
      }}
    >
      <AppShell
        organizationId={ctx.organizationId}
        organizationName={ctx.organizationName}
        email={ctx.email}
      >
        {children}
      </AppShell>
    </TenantProvider>
  );
}
