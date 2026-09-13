import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const GET = withApiHandlers(async (ctx, _req: NextRequest) => {
  const supabase = createServiceClient();
  const { data: pipelines } = await supabase.from("pipelines").select("id, name, stages").eq("organization_id", ctx.organizationId).limit(20);
  return NextResponse.json({ data: { pipelines: pipelines ?? [] } });
});

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : null;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const supabase = createServiceClient();
  const { data: pipeline } = await supabase.from("pipelines").insert({ organization_id: ctx.organizationId, name, stages: body.stages ?? ["New", "Qualified", "Contacted", "Replied", "Meeting", "Proposal", "Won", "Lost"] }).select("*").single();
  return NextResponse.json({ data: pipeline }, { status: 201 });
});
