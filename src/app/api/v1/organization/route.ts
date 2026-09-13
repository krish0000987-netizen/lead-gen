import { NextRequest, NextResponse } from "next/server";
import { withApiHandlers } from "@/lib/api/with-handler";
import { requireRole } from "@/lib/api/guards";

export const GET = withApiHandlers(async (ctx, _req: NextRequest) => {
  const forbidden = requireRole(["OWNER", "ADMIN"])(ctx);
  if (forbidden) return forbidden;

  return NextResponse.json({
    data: {
      organization: { id: ctx.organizationId, name: ctx.organizationName },
      role: ctx.role,
    },
  });
});

export const POST = withApiHandlers(async (ctx, req: NextRequest) => {
  const forbidden = requireRole(["OWNER", "ADMIN"])(ctx);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  return NextResponse.json({ data: { id: ctx.organizationId, name, updated: true } });
});
