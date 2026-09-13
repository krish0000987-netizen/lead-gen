import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function ListsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Lists" subtitle="Static and dynamic lead lists." actions={[{ label: "Create list", href: "/lists/new" }]} />
      <EmptyState title="No lists" description="Create a list from search results or saved searches." action={{ label: "New search", href: "/search" }} />
    </div>
  );
}
