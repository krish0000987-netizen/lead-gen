"use client";

import { useTenantContext } from "@/lib/auth/tenant-context";
import PageHeader from "@/components/ui/PageHeader";
import MetricCard from "@/components/ui/MetricCard";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import { useMemo } from "react";

export default function DashboardClient({ initial }: { initial: any }) {
  const ctx = useTenantContext();
  const metrics = useMemo(() => {
    const companies = initial.companiesCount ?? 0;
    const contacts = initial.contactsCount ?? 0;
    const leads = initial.leads ?? [];
    const leadsCount = leads.length;
    const qualified = leads.filter((l: any) =>
      ["QUALIFIED", "CONTACTED", "REPLIED", "MEETING", "PROPOSAL", "WON"].includes(l.status)
    ).length;
    const newLeads = leads.filter((l: any) => l.status === "NEW").length;
    const lists = initial.listsCount ?? 0;
    const recent = leads
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);
    return { companies, contacts, leadsCount, qualified, newLeads, lists, recent };
  }, [initial]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={ctx.organizationName}
        actions={[
          { label: "New search", href: "/search" },
          { label: "Import CSV", href: "/enrichment" },
          { label: "Connect provider", href: "/integrations" },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Companies" value={metrics.companies} />
        <MetricCard label="Contacts" value={metrics.contacts} />
        <MetricCard label="Leads" value={metrics.leadsCount} sub={`${metrics.qualified} qualified`} />
        <MetricCard label="Lists" value={metrics.lists} sub={`${metrics.newLeads} new leads`} />
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold">Recent leads</h2>
        </div>
        {metrics.recent.length === 0 ? (
          <EmptyState
            title="No leads yet"
            description="Run a search or import data to create leads."
            action={{ label: "New search", href: "/search" }}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="px-5 py-2 font-medium">Lead</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Lead score</th>
                <th className="px-5 py-2 font-medium">Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recent.map((lead: any) => (
                <tr key={lead.id} className="border-t border-gray-100 dark:border-gray-900">
                  <td className="px-5 py-2">{lead.id.slice(0, 8)}</td>
                  <td className="px-5 py-2">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-2">{lead.lead_score ?? "—"}</td>
                  <td className="px-5 py-2">{lead.opportunity_score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
