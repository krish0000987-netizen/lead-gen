import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const providerId = typeof body.providerId === "string" ? body.providerId : null;
  const filters = (body.filters && typeof body.filters === "object") ? body.filters : {};
  const count = typeof body.count === "number" ? Math.min(body.count, 100) : 25;
  if (!providerId) return NextResponse.json({ error: "providerId is required" }, { status: 400 });

  const result = { providerId, filters, count, preview: [], status: "queued" };
  return NextResponse.json({ data: result }, { status: 202 });
});
