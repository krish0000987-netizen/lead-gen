import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Organization, workspace, and platform preferences." actions={[]} />
      <EmptyState title="Settings" description="Manage organization settings, members, providers, and security." />
    </div>
  );
}
