import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const targetIds = Array.isArray(body.targetIds) ? body.targetIds : [];
  const providerId = typeof body.providerId === "string" ? body.providerId : null;
  if (!providerId) return NextResponse.json({ error: "providerId is required" }, { status: 400 });
  if (!targetIds.length) return NextResponse.json({ error: "targetIds required" }, { status: 400 });

  return NextResponse.json({ data: { jobId: "job_new", status: "queued", providerId, count: targetIds.length } }, { status: 202 });
});
