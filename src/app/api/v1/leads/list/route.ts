import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const GET = withApiHandlers(async (ctx, req: NextRequest) => {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Number(url.searchParams.get("limit") || "20");
  const cursor = url.searchParams.get("cursor");

  const supabase = createServiceClient();
  let query = supabase.from("leads").select("id, company_id, contact_id, status, lead_score, opportunity_score, created_at").eq("organization_id", ctx.organizationId).order("created_at", { ascending: false }).limit(limit);

  if (status) query = query.eq("status", status);
  if (cursor) query = query.lt("created_at", cursor);

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: { leads: leads ?? [] } });
});
