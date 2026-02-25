import { NextRequest, NextResponse } from "next/server";
import { ZodType } from "zod";
import { requireGym, requireStudent } from "../middleware/auth.middleware";
import {
	completeIdempotencyKey,
	failIdempotencyKey,
	getReplayRecord,
	reserveIdempotencyKey,
} from "./idempotency-store";

type AuthStrategy = "gym" | "student" | "none";

interface HandlerOptions<TBody = any, TQuery = any> {
  auth?: AuthStrategy;
  schema?: {
    body?: ZodType<TBody, any, any>;
    query?: ZodType<TQuery, any, any>;
    params?: ZodType<any, any, any>;
  };
}

type SafeHandlerContext<TBody = any, TQuery = any> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  gymContext?: {
    gymId: string;
    session: any;
    user: any;
  };
  studentContext?: {
    studentId: string;
    session: any;
    user: any;
    student: any;
  };
  params?: any;
};

/**
 * Creates a safe API handler with built-in auth, validation, and error handling
 */
export function createSafeHandler<TBody = any, TQuery = any>(
  handler: (ctx: SafeHandlerContext<TBody, TQuery>) => Promise<NextResponse>,
  options: HandlerOptions<TBody, TQuery> = {}
) {
  return async (req: NextRequest, routeContext?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    const startedAt = Date.now();
    const pathname = req.nextUrl.pathname;
    const method = req.method.toUpperCase();
    const logMetaBase = {
      route: pathname,
      method,
      auth: options.auth || "none",
    };
    try {
      let gymContext: SafeHandlerContext["gymContext"];
      let studentContext: SafeHandlerContext["studentContext"];

      // 1. Auth check
      if (options.auth === "gym") {
        const result = await requireGym(req);
        if ("response" in result) return result.response;
        gymContext = {
          gymId: (result.session as any).user?.activeGymId || (result as any).gymId || "", // requireGym doesn't explicitly return gymId in the same way, need to check user
          session: result.session,
          user: result.user
        };
        // Ensure gymId is set (middleware should have it or user should have activeGymId)
        if (!gymContext.gymId) {
          const { getGymContext } = await import("@/lib/utils/gym-context");
          const ctxResult = await getGymContext();
          if (ctxResult.ctx) gymContext.gymId = ctxResult.ctx.gymId;
        }
      } else if (options.auth === "student") {
        const result = await requireStudent(req);
        if ("response" in result) return result.response;
        studentContext = {
          studentId: result.user.studentId,
          session: result.session,
          user: result.user,
          student: result.user.student
        };
      }

      // 2. Validation
      let body: any = {};
      if (options.schema?.body) {
        const rawBody = await req.json();
        body = options.schema.body.parse(rawBody);
      }

      let query: any = {};
      if (options.schema?.query) {
        const { searchParams } = new URL(req.url);
        const queryObject = Object.fromEntries(searchParams.entries());
        query = options.schema.query.parse(queryObject);
      }

      let params: any = {};
      if (options.schema?.params) {
        const rawParams = routeContext?.params
          ? await Promise.resolve(routeContext.params)
          : {};
        params = options.schema.params.parse(rawParams);
      } else if (routeContext?.params) {
        params = await Promise.resolve(routeContext.params);
      }

      // 3. Execute handler (idempotent for mutations when X-Idempotency-Key is present)
      const shouldUseIdempotency =
        (method === "POST" || method === "PATCH" || method === "DELETE") &&
        !!req.headers.get("x-idempotency-key");

      if (!shouldUseIdempotency) {
        const response = await handler({ req, body, query, gymContext, studentContext, params });
        const latencyMs = Date.now() - startedAt;
        response.headers.set("X-Response-Time-Ms", String(latencyMs));
        console.info(
          "[api-observability]",
          JSON.stringify({
            ...logMetaBase,
            status: response.status,
            latencyMs,
            idempotencyReplay: false,
          }),
        );
        return response;
      }

      const idemKey = req.headers.get("x-idempotency-key") as string;
      const replay = await getReplayRecord(idemKey);
      if (replay && replay.status === "completed" && replay.response_status) {
        try {
          const parsedBody = replay.response_body ? JSON.parse(replay.response_body) : null;
          const replayResponse = NextResponse.json(parsedBody, {
            status: replay.response_status,
          });
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          replayResponse.headers.set("X-Response-Time-Ms", String(Date.now() - startedAt));
          console.info(
            "[api-observability]",
            JSON.stringify({
              ...logMetaBase,
              status: replay.response_status,
              latencyMs: Date.now() - startedAt,
              idempotencyReplay: true,
            }),
          );
          return replayResponse;
        } catch {
          const replayResponse = NextResponse.json(
            { ok: true, replay: true },
            { status: replay.response_status },
          );
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          replayResponse.headers.set("X-Response-Time-Ms", String(Date.now() - startedAt));
          console.info(
            "[api-observability]",
            JSON.stringify({
              ...logMetaBase,
              status: replay.response_status,
              latencyMs: Date.now() - startedAt,
              idempotencyReplay: true,
            }),
          );
          return replayResponse;
        }
      }

      if (replay && replay.status === "processing") {
        return NextResponse.json(
          { error: "Requisição idempotente em processamento" },
          { status: 409 },
        );
      }

      await reserveIdempotencyKey({
        key: idemKey,
        route: req.nextUrl.pathname,
        method,
        body,
      });

      try {
        const response = await handler({ req, body, query, gymContext, studentContext, params });
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        await completeIdempotencyKey({
          key: idemKey,
          statusCode: response.status,
          responseBody: responseText || "null",
        });
        const latencyMs = Date.now() - startedAt;
        response.headers.set("X-Response-Time-Ms", String(latencyMs));
        console.info(
          "[api-observability]",
          JSON.stringify({
            ...logMetaBase,
            status: response.status,
            latencyMs,
            idempotencyReplay: false,
            idempotencyKey: idemKey,
          }),
        );
        return response;
      } catch (innerError) {
        await failIdempotencyKey(idemKey);
        throw innerError;
      }
    } catch (error: any) {
      console.error("[SafeHandler] Error:", error);
      console.error(
        "[api-observability]",
        JSON.stringify({
          ...logMetaBase,
          status: error?.name === "ZodError" ? 400 : 500,
          latencyMs: Date.now() - startedAt,
          error: error?.message || "unknown",
        }),
      );
      
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Erro de validação", details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Erro interno do servidor" },
        { status: 500 }
      );
    }
  };
}
