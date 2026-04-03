import type { NextRequest } from "../../runtime/next-server";
import { NextResponse } from "../../runtime/next-server";
import { auditLog } from "./audit-log";

type DevelopmentOnlyRouteInput = {
  request: Pick<NextRequest, "headers" | "nextUrl">;
  actorId?: string | null;
  targetId?: string | null;
};

export async function blockProductionDevelopmentRoute(
  input: DevelopmentOnlyRouteInput,
) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  await auditLog({
    action: "SECURITY:FORBIDDEN",
    actorId: input.actorId ?? null,
    targetId: input.targetId ?? null,
    request: input.request,
    result: "FAILURE",
    payload: {
      route: input.request.nextUrl.pathname,
      reason: "development_only_route",
    },
  });

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
