import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const providerId = typeof body.providerId === "string" ? body.providerId : null;
  if (!providerId) return NextResponse.json({ error: "providerId is required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: connection, error } = await supabase
    .from("provider_connections")
    .upsert({
      organization_id: ctx.organizationId,
      provider_id: providerId,
      status: "PENDING_AUTH",
      config: body.config ?? {},
      created_by: ctx.userId,
    }, { onConflict: "organization_id,provider_id,workspace_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: connection }, { status: 201 });
});
