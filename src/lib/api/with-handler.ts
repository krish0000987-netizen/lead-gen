import { NextRequest, NextResponse } from "next/server";
import { requireOrg, requireRole } from "@/lib/api/guards";
import { requestId } from "@/lib/api/request-id";

export type ApiEnv = "dev" | "staging" | "prod";
export const API_ENV: ApiEnv = (process.env.NEXT_PUBLIC_API_ENV as ApiEnv) ?? "dev";

export function withApiHandlers(handler: (ctx: any, req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const rid = requestId();
    const start = Date.now();
    try {
      const { context, supabase, error } = await requireOrg();
      if (error) return error;
      if (!context || !supabase) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const res = await handler(context, req);
      (res as any).headers ??= {};
      res.headers.set("x-request-id", rid);
      return res;
    } catch (err) {
      return NextResponse.json(
        { error: "Internal server error", request_id: rid },
        { status: 500 }
      );
    } finally {
      // hook for structured logging: request_id, latency, status, user/org/workspace/provider
    }
  };
}
