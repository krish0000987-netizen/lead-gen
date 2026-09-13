import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShellClient from "@/components/app/AppShellClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership?.organization) redirect("/onboarding");

  const org = membership.organization as unknown as { id: string; name: string };

  return (
    <AppShellClient
      userId={user.id}
      email={user.email ?? ""}
      organizationId={org.id}
      organizationName={org.name}
      role={membership.role as "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER"}
    >
      {children}
    </AppShellClient>
  );
}
