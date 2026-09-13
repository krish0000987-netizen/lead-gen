import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Leads" subtitle="Scored, qualified prospects." actions={[{ label: "New search", href: "/search" }]} />
      <EmptyState title="No leads" description="Search prospects and save them as leads." action={{ label: "New search", href: "/search" }} />
    </div>
  );
}
