import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const GET = withApiHandlers(async (ctx, _req: NextRequest) => {
  return NextResponse.json({ data: { user: { id: ctx.userId, email: ctx.email, role: ctx.role } } });
});
