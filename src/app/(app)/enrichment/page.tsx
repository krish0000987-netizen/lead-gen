import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function EnrichmentPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Enrichment" subtitle="Bulk enrich and verify records." actions={[{ label: "Import CSV", href: "/enrichment" }]} />
      <EmptyState title="No enrichment jobs" description="Connect providers and run enrichment." action={{ label: "Integrations", href: "/integrations" }} />
    </div>
  );
}
