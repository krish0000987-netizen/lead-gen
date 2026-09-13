import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const GET = withApiHandlers(async (_ctx, _req: NextRequest) => {
  return NextResponse.json({ data: { accounts: [], templates: [] } });
});

export const POST = withApiHandlers(async (_ctx, req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ data: { id: "email_new", ...body } }, { status: 201 });
});
