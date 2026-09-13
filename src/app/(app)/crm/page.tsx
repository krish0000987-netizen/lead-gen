import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function CRMShell() {
  return (
    <div className="space-y-4">
      <PageHeader title="CRM" subtitle="Pipelines, deals, and activities." />
      <EmptyState title="No pipelines yet" description="Create a pipeline to track deals and opportunities." action={{ label: "Create pipeline", href: "/crm" }} />
    </div>
  );
}
