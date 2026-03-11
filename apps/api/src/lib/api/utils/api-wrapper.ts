import { type NextRequest, NextResponse } from "@/runtime/next-server";
import type { ZodType } from "zod";
import { log, recordApiRequest } from "@/lib/observability";
import {
  requireGym,
  requirePersonal,
  requireStudent,
} from "../middleware/auth.middleware";
import {
  completeIdempotencyKey,
  failIdempotencyKey,
  getReplayRecord,
  reserveIdempotencyKey,
} from "./idempotency-store";

type AuthStrategy = "gym" | "student" | "personal" | "none";

interface HandlerOptions<
  TBody = Record<string, string | number | boolean | object | null>,
  TQuery = Record<string, string | number | boolean | object | null>,
> {
  auth?: AuthStrategy;
  schema?: {
    body?: ZodType<TBody, object, object>;
    query?: ZodType<TQuery, object, object>;
    params?: ZodType<Record<string, string>, object, object>;
  };
}

interface AuthUser {
  id: string;
  role?: string;
  studentId?: string;
  student?: Record<string, unknown>;
  personalId?: string;
  personal?: Record<string, unknown>;
  activeGymId?: string;
  [key: string]: unknown;
}

type SafeHandlerContext<
  TBody = Record<string, string | number | boolean | object | null>,
  TQuery = Record<string, string | number | boolean | object | null>,
> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  gymContext?: {
    gymId: string;
    session: Record<string, unknown>;
    user: AuthUser;
  };
  studentContext?: {
    studentId: string;
    session: Record<string, unknown>;
    user: AuthUser;
    student: Record<string, unknown>;
  };
  personalContext?: {
    personalId: string;
    session: Record<string, unknown>;
    user: AuthUser;
    personal: Record<string, unknown>;
  };
  params?: Record<string, string>;
};

/**
 * Creates a safe API handler with built-in auth, validation, and error handling
 */
export function createSafeHandler<
  TBody = Record<string, string | number | boolean | object | null>,
  TQuery = Record<string, string | number | boolean | object | null>,
>(
  handler: (ctx: SafeHandlerContext<TBody, TQuery>) => Promise<NextResponse>,
  options: HandlerOptions<TBody, TQuery> = {},
) {
  return async (
    req: NextRequest,
    routeContext?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
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
      let personalContext: SafeHandlerContext["personalContext"];

      // 1. Auth check
      if (options.auth === "gym") {
        const result = await requireGym(req);
        if ("response" in result) return result.response;
        const sessionUser = result.session as { user?: AuthUser } | undefined;
        const resultWithGymId = result as { gymId?: string };
        const nextGymContext: NonNullable<SafeHandlerContext["gymContext"]> = {
          gymId: sessionUser?.user?.activeGymId || resultWithGymId.gymId || "",
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
        };
        // Ensure gymId is set (middleware should have it or user should have activeGymId)
        if (!nextGymContext.gymId) {
          const { getGymContext } = await import("@/lib/utils/gym/gym-context");
          const ctxResult = await getGymContext(req);
          if (ctxResult.ctx) nextGymContext.gymId = ctxResult.ctx.gymId;
        }
        gymContext = nextGymContext;
      } else if (options.auth === "student") {
        const result = await requireStudent(req);
        if ("response" in result) return result.response;
        studentContext = {
          studentId: String(result.user.studentId),
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
          student: (result.user.student || {}) as Record<string, unknown>,
        };
      } else if (options.auth === "personal") {
        const result = await requirePersonal(req);
        if ("response" in result) return result.response;
        personalContext = {
          personalId: String(result.user.personalId),
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
          personal: (result.user.personal || {}) as Record<string, unknown>,
        };
      }

      // 2. Validation
      let body: TBody = {} as TBody;
      if (options.schema?.body) {
        const rawBody = await req.json();
        body = options.schema.body.parse(rawBody);
      }

      let query: TQuery = {} as TQuery;
      if (options.schema?.query) {
        const { searchParams } = new URL(req.url);
        const queryObject = Object.fromEntries(searchParams.entries());
        query = options.schema.query.parse(queryObject);
      }

      let params: Record<string, string> = {};
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
        const response = await handler({
          req,
          body,
          query,
          gymContext,
          studentContext,
          personalContext,
          params,
        });
        const latencyMs = Date.now() - startedAt;
        response.headers.set("X-Response-Time-Ms", String(latencyMs));
        recordApiRequest({
          method: logMetaBase.method,
          path: logMetaBase.route,
          status: response.status,
          latencyMs,
          userId:
            gymContext?.user?.id ??
            studentContext?.user?.id ??
            personalContext?.user?.id,
          studentId: studentContext?.studentId,
          gymId: gymContext?.gymId,
        });
        return response;
      }

      const idemKey = req.headers.get("x-idempotency-key") as string;
      const replay = await getReplayRecord(idemKey);
      if (replay && replay.status === "completed" && replay.response_status) {
        try {
          const parsedBody = replay.response_body
            ? JSON.parse(replay.response_body)
            : null;
          const replayResponse = NextResponse.json(parsedBody, {
            status: replay.response_status,
          });
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          replayResponse.headers.set(
            "X-Response-Time-Ms",
            String(Date.now() - startedAt),
          );
          recordApiRequest({
            method: logMetaBase.method,
            path: logMetaBase.route,
            status: replay.response_status,
            latencyMs: Date.now() - startedAt,
          });
          return replayResponse;
        } catch {
          const replayResponse = NextResponse.json(
            { ok: true, replay: true },
            { status: replay.response_status },
          );
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          replayResponse.headers.set(
            "X-Response-Time-Ms",
            String(Date.now() - startedAt),
          );
          recordApiRequest({
            method: logMetaBase.method,
            path: logMetaBase.route,
            status: replay.response_status,
            latencyMs: Date.now() - startedAt,
          });
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
        body: body as Record<string, string | number | boolean | object | null>,
      });

      try {
        const response = await handler({
          req,
          body,
          query,
          gymContext,
          studentContext,
          personalContext,
          params,
        });
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        await completeIdempotencyKey({
          key: idemKey,
          statusCode: response.status,
          responseBody: responseText || "null",
        });
        const latencyMs = Date.now() - startedAt;
        response.headers.set("X-Response-Time-Ms", String(latencyMs));
        recordApiRequest({
          method: logMetaBase.method,
          path: logMetaBase.route,
          status: response.status,
          latencyMs,
          userId:
            gymContext?.user?.id ??
            studentContext?.user?.id ??
            personalContext?.user?.id,
          studentId: studentContext?.studentId,
          gymId: gymContext?.gymId,
        });
        return response;
      } catch (innerError) {
        await failIdempotencyKey(idemKey);
        throw innerError;
      }
    } catch (error) {
      const err = error as {
        name?: string;
        message?: string;
        errors?: Array<{ path?: string[]; message?: string }>;
      };
      const status = err?.name === "ZodError" ? 400 : 500;
      const latencyMs = Date.now() - startedAt;
      log.error("[SafeHandler] Error", { error: err?.message, ...logMetaBase });
      recordApiRequest({
        method: logMetaBase.method,
        path: logMetaBase.route,
        status,
        latencyMs,
        error: err?.message || "unknown",
      });

      if (err?.name === "ZodError") {
        return NextResponse.json(
          { error: "Erro de validação", details: err.errors },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: err?.message || "Erro interno do servidor" },
        { status: 500 },
      );
    }
  };
}
