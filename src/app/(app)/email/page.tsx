import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function EmailPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Email" subtitle="Accounts, templates, and campaigns." />
      <EmptyState title="No email accounts" description="Connect an email provider to send campaigns." action={{ label: "Connect email", href: "/integrations" }} />
    </div>
  );
}
