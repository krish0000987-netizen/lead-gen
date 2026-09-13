import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const GET = withApiHandlers(async (ctx, _req: NextRequest) => {
  const supabase = createServiceClient();
  const { data: connections } = await supabase
    .from("provider_connections")
    .select("*")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ data: { connections: connections ?? [] } });
});
