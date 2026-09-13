import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const companyIds = Array.isArray(body.companyIds) ? body.companyIds : [];
  const contactIds = Array.isArray(body.contactIds) ? body.contactIds : [];
  if (!companyIds.length && !contactIds.length) return NextResponse.json({ error: "companyIds or contactIds required" }, { status: 400 });

  const supabase = createServiceClient();
  const leads: any[] = [];
  for (const companyId of companyIds) {
    const { data: existing } = await supabase.from("leads").select("id").eq("organization_id", ctx.organizationId).eq("company_id", companyId).maybeSingle();
    if (!existing) {
      const { data: lead } = await supabase.from("leads").insert({ organization_id: ctx.organizationId, company_id: companyId, status: "NEW", lead_score: null, opportunity_score: null }).select("*").single();
      if (lead) leads.push(lead);
    }
  }
  for (const contactId of contactIds) {
    const { data: existing } = await supabase.from("leads").select("id").eq("organization_id", ctx.organizationId).eq("contact_id", contactId).maybeSingle();
    if (!existing) {
      const { data: lead } = await supabase.from("leads").insert({ organization_id: ctx.organizationId, contact_id: contactId, status: "NEW", lead_score: null, opportunity_score: null }).select("*").single();
      if (lead) leads.push(lead);
    }
  }
  return NextResponse.json({ data: { leads } }, { status: 201 });
});
