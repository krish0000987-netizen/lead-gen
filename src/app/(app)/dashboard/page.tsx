import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership?.organization) return null;
  const org = membership.organization as unknown as { id: string; name: string };
  const organizationId = org.id;

  const [companiesRes, contactsRes, leadsRes, listsRes] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("leads").select("id, status, lead_score, opportunity_score, created_at").eq("organization_id", organizationId),
    supabase.from("lists").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
  ]);

  const initial = {
    organizationName: org.name,
    role: membership.role,
    companiesCount: companiesRes.count ?? 0,
    contactsCount: contactsRes.count ?? 0,
    leads: leadsRes.data ?? [],
    listsCount: listsRes.count ?? 0,
  };

  return <DashboardClient initial={initial} />;
}
