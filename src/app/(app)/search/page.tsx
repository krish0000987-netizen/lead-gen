import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Search" subtitle="Find companies and contacts." actions={[]} />
      <EmptyState title="Connect a provider" description="Connect Vibe Prospecting or another provider to start searching." action={{ label: "Integrations", href: "/integrations" }} />
    </div>
  );
}
