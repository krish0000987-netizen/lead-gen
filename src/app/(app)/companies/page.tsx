import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function CompaniesPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Companies" subtitle="Discover and manage company records." actions={[{ label: "Import CSV", href: "/enrichment" }]} />
      <EmptyState title="No companies" description="Run a search or import data to build your company records." action={{ label: "New search", href: "/search" }} />
    </div>
  );
}
