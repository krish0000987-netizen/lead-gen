import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function SequencesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Sequences" subtitle="Multi-channel outreach sequences." />
      <EmptyState title="No sequences" description="Create a sequence to automate outreach." action={{ label: "Create sequence", href: "/sequences" }} />
    </div>
  );
}
