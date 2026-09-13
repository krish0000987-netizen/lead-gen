import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function AutomationsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Automations" subtitle="Workflows, triggers, and actions." />
      <EmptyState title="No automations" description="Create an automation workflow to save time." action={{ label: "Create workflow", href: "/automations" }} />
    </div>
  );
}
