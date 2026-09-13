import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { createServiceClient } from "@/lib/supabase/server";

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const providerId = typeof body.providerId === "string" ? body.providerId : null;
  if (!providerId) return NextResponse.json({ error: "providerId is required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data: provider } = await supabase.from("data_providers").select("id, display_name, default_config").eq("id", providerId).maybeSingle();
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  return NextResponse.json({ data: { provider, capabilities: [] } });
});

export const GET = withApiHandlers(async (_ctx, _req: NextRequest) => {
  const supabase = createServiceClient();
  const { data: providers } = await supabase.from("data_providers").select("id, display_name, category, default_config, provider_policies").order("category");
  return NextResponse.json({ data: { providers: providers ?? [] } });
});
