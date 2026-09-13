import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function ContactsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Contacts" subtitle="Decision-makers and contacts in your pipeline." actions={[{ label: "Import CSV", href: "/enrichment" }]} />
      <EmptyState title="No contacts" description="Enrich company records or import contacts to get started." action={{ label: "Enrich", href: "/enrichment" }} />
    </div>
  );
}
