import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface TenantContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationName: string;
  workspaceId: string | null;
  role: OrgRole;
}

export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { context: null as TenantContext | null, supabase: null as ReturnType<typeof createServerSupabaseClient> | null };
  }
  return { context: { userId: user.id, email: user.email ?? "" } as TenantContext, supabase };
}

export async function requireOrg() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!membership?.organization) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const org = membership.organization as unknown as { id: string; name: string };
  const ctx: TenantContext = {
    userId: user.id,
    email: user.email ?? "",
    organizationId: org.id,
    organizationName: org.name,
    workspaceId: null,
    role: membership.role as OrgRole,
  };

  return { context: ctx, supabase, error: null as NextResponse | null };
}

export function requireRole(allowed: OrgRole[]) {
  return (ctx: TenantContext) => {
    if (!allowed.includes(ctx.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
  };
}
