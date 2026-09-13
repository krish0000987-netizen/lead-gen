"use client";

import { useTenantContext } from "@/lib/auth/tenant-context";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AIAssistantPage() {
  const ctx = useTenantContext();
  return (
    <div className="space-y-4">
      <PageHeader title="AI Assistant" subtitle={`${ctx.organizationName} AI copilot`} />
      <EmptyState title="AI not configured" description="Connect an AI provider in Settings to enable the assistant." />
    </div>
  );
}
