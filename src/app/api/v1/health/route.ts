import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";

export const GET = withApiHandlers(async (_ctx, _req: NextRequest) => {
  return NextResponse.json({ data: { health: "ok" } });
});
