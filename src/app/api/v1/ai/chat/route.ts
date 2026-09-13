import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const POST = withApiHandlers(async (_ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  return NextResponse.json({ data: { message: "AI agent is not connected in this build.", prompt } });
});
