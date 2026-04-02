import type { ZodType } from "zod";
import { log, recordApiRequest } from "@/lib/observability";
import {
  getRequestId,
  recordAuthTime,
  recordHandlerTime,
  recordResponseTime,
} from "@/lib/runtime/request-context";
import { enforceSubjectRateLimit } from "@/lib/security/rate-limiter";
import { parseJsonSafe } from "@/lib/utils/json";
import { type NextRequest, NextResponse } from "@/runtime/next-server";
import {
  requireAdmin,
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

type AuthStrategy = "gym" | "student" | "personal" | "admin" | "none";

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
  adminContext?: {
    session: Record<string, unknown>;
    user: AuthUser;
  };
  params?: Record<string, string>;
};

async function parseRequestBody(
  req: NextRequest,
): Promise<Record<string, unknown>> {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return {};
  }

  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  try {
    const parsed = await req.clone().json();
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function attachStandardHeaders(response: Response, startedAt: number) {
  const responseStartedAt = Date.now();
  const requestId = getRequestId();
  const latencyMs = Date.now() - startedAt;

  response.headers.set("X-Response-Time-Ms", String(latencyMs));
  if (requestId) {
    response.headers.set("X-Request-Id", requestId);
  }
  recordResponseTime(Date.now() - responseStartedAt);

  return {
    latencyMs,
    requestId,
    response,
  };
}

function buildMetricContext(
  logMetaBase: {
    method: string;
    route: string;
  },
  input: {
    status: number;
    latencyMs: number;
    error?: string;
    gymContext?: SafeHandlerContext["gymContext"];
    studentContext?: SafeHandlerContext["studentContext"];
    personalContext?: SafeHandlerContext["personalContext"];
    adminContext?: SafeHandlerContext["adminContext"];
    requestId?: string | null;
  },
) {
  return {
    method: logMetaBase.method,
    path: logMetaBase.route,
    status: input.status,
    latencyMs: input.latencyMs,
    error: input.error,
    requestId: input.requestId ?? undefined,
    userId:
      input.adminContext?.user?.id ??
      input.gymContext?.user?.id ??
      input.studentContext?.user?.id ??
      input.personalContext?.user?.id,
    studentId: input.studentContext?.studentId,
    gymId: input.gymContext?.gymId,
  };
}

/**
 * Creates a safe API handler with built-in auth, validation, and error handling
 */
export function createSafeHandler<
  TBody = Record<string, string | number | boolean | object | null>,
  TQuery = Record<string, string | number | boolean | object | null>,
>(
  handler: (ctx: SafeHandlerContext<TBody, TQuery>) => Promise<Response>,
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

    let gymContext: SafeHandlerContext["gymContext"];
    let studentContext: SafeHandlerContext["studentContext"];
    let personalContext: SafeHandlerContext["personalContext"];
    let adminContext: SafeHandlerContext["adminContext"];

    try {
      const authStartedAt = Date.now();
      if (options.auth === "gym") {
        const result = await requireGym(req);
        recordAuthTime(Date.now() - authStartedAt);
        if ("response" in result) {
          const { response, latencyMs, requestId } = attachStandardHeaders(
            result.response,
            startedAt,
          );
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: response.status,
              latencyMs,
              requestId,
            }),
          );
          return response;
        }
        const sessionUser = result.session as { user?: AuthUser } | undefined;
        const resultWithGymId = result as { gymId?: string };
        const nextGymContext: NonNullable<SafeHandlerContext["gymContext"]> = {
          gymId: sessionUser?.user?.activeGymId || resultWithGymId.gymId || "",
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
        };
        if (!nextGymContext.gymId) {
          const { getGymContext } = await import("@/lib/utils/gym/gym-context");
          const ctxResult = await getGymContext(req);
          if (ctxResult.ctx) {
            nextGymContext.gymId = ctxResult.ctx.gymId;
          }
        }
        gymContext = nextGymContext;
      } else if (options.auth === "student") {
        const result = await requireStudent(req);
        recordAuthTime(Date.now() - authStartedAt);
        if ("response" in result) {
          const { response, latencyMs, requestId } = attachStandardHeaders(
            result.response,
            startedAt,
          );
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: response.status,
              latencyMs,
              requestId,
            }),
          );
          return response;
        }
        studentContext = {
          studentId: String(result.user.studentId),
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
          student: (result.user.student || {}) as Record<string, unknown>,
        };
      } else if (options.auth === "personal") {
        const result = await requirePersonal(req);
        recordAuthTime(Date.now() - authStartedAt);
        if ("response" in result) {
          const { response, latencyMs, requestId } = attachStandardHeaders(
            result.response,
            startedAt,
          );
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: response.status,
              latencyMs,
              requestId,
            }),
          );
          return response;
        }
        personalContext = {
          personalId: String(result.user.personalId),
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
          personal: (result.user.personal || {}) as Record<string, unknown>,
        };
      } else if (options.auth === "admin") {
        const result = await requireAdmin(req);
        recordAuthTime(Date.now() - authStartedAt);
        if ("response" in result) {
          const { response, latencyMs, requestId } = attachStandardHeaders(
            result.response,
            startedAt,
          );
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: response.status,
              latencyMs,
              requestId,
            }),
          );
          return response;
        }
        adminContext = {
          session: result.session as Record<string, unknown>,
          user: result.user as AuthUser,
        };
      } else {
        recordAuthTime(Date.now() - authStartedAt);
      }

      const authenticatedUserId =
        adminContext?.user?.id ??
        gymContext?.user?.id ??
        studentContext?.user?.id ??
        personalContext?.user?.id;

      if (authenticatedUserId) {
        const rateLimitedResponse = await enforceSubjectRateLimit({
          request: req,
          subjectKey: authenticatedUserId,
          actorId: authenticatedUserId,
        });

        if (rateLimitedResponse) {
          const handled = attachStandardHeaders(rateLimitedResponse, startedAt);
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: handled.response.status,
              latencyMs: handled.latencyMs,
              requestId: handled.requestId,
              gymContext,
              studentContext,
              personalContext,
              adminContext,
            }),
          );
          return handled.response;
        }
      }

      let body: TBody = {} as TBody;
      if (options.schema?.body) {
        body = options.schema.body.parse(await parseRequestBody(req));
      } else {
        body = (await parseRequestBody(req)) as TBody;
      }

      let query: TQuery = {} as TQuery;
      if (options.schema?.query) {
        const { searchParams } = new URL(req.url);
        query = options.schema.query.parse(
          Object.fromEntries(searchParams.entries()),
        );
      } else {
        const { searchParams } = new URL(req.url);
        query = Object.fromEntries(searchParams.entries()) as TQuery;
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

      const handlerContext = {
        req,
        body,
        query,
        gymContext,
        studentContext,
        personalContext,
        adminContext,
        params,
      };

      const shouldUseIdempotency =
        (method === "POST" || method === "PATCH" || method === "DELETE") &&
        !!req.headers.get("x-idempotency-key");

      if (!shouldUseIdempotency) {
        const handlerStartedAt = Date.now();
        const handled = attachStandardHeaders(
          await handler(handlerContext),
          startedAt,
        );
        recordHandlerTime(Date.now() - handlerStartedAt);
        recordApiRequest(
          buildMetricContext(logMetaBase, {
            status: handled.response.status,
            latencyMs: handled.latencyMs,
            requestId: handled.requestId,
            gymContext,
            studentContext,
            personalContext,
            adminContext,
          }),
        );
        return handled.response;
      }

      const idemKey = req.headers.get("x-idempotency-key") as string;
      const replay = await getReplayRecord(idemKey);
      if (replay && replay.status === "completed" && replay.response_status) {
        try {
          const parsedBody = replay.response_body
            ? parseJsonSafe<unknown>(replay.response_body)
            : null;
          const replayResponse = NextResponse.json(parsedBody, {
            status: replay.response_status,
          });
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          const handled = attachStandardHeaders(replayResponse, startedAt);
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: replay.response_status,
              latencyMs: handled.latencyMs,
              requestId: handled.requestId,
              gymContext,
              studentContext,
              personalContext,
              adminContext,
            }),
          );
          return handled.response;
        } catch {
          const replayResponse = NextResponse.json(
            { ok: true, replay: true },
            { status: replay.response_status },
          );
          replayResponse.headers.set("X-Idempotency-Replay", "true");
          const handled = attachStandardHeaders(replayResponse, startedAt);
          recordApiRequest(
            buildMetricContext(logMetaBase, {
              status: replay.response_status,
              latencyMs: handled.latencyMs,
              requestId: handled.requestId,
              gymContext,
              studentContext,
              personalContext,
              adminContext,
            }),
          );
          return handled.response;
        }
      }

      if (replay && replay.status === "processing") {
        const processingResponse = NextResponse.json(
          { error: "Requisicao idempotente em processamento" },
          { status: 409 },
        );
        const handled = attachStandardHeaders(processingResponse, startedAt);
        recordApiRequest(
          buildMetricContext(logMetaBase, {
            status: handled.response.status,
            latencyMs: handled.latencyMs,
            requestId: handled.requestId,
            gymContext,
            studentContext,
            personalContext,
            adminContext,
          }),
        );
        return handled.response;
      }

      await reserveIdempotencyKey({
        key: idemKey,
        route: req.nextUrl.pathname,
        method,
        body: body as Record<string, string | number | boolean | object | null>,
      });

      try {
        const handlerStartedAt = Date.now();
        const response = await handler(handlerContext);
        recordHandlerTime(Date.now() - handlerStartedAt);
        const responseClone = response.clone();
        const responseText = await responseClone.text();
        await completeIdempotencyKey({
          key: idemKey,
          statusCode: response.status,
          responseBody: responseText || "null",
        });
        const handled = attachStandardHeaders(response, startedAt);
        recordApiRequest(
          buildMetricContext(logMetaBase, {
            status: handled.response.status,
            latencyMs: handled.latencyMs,
            requestId: handled.requestId,
            gymContext,
            studentContext,
            personalContext,
            adminContext,
          }),
        );
        return handled.response;
      } catch (innerError) {
        await failIdempotencyKey(idemKey);
        throw innerError;
      }
    } catch (error) {
      const err = error as {
        name?: string;
        message?: string;
        status?: number;
        errors?: Array<{ path?: string[]; message?: string }>;
      };
      const status =
        typeof err?.status === "number"
          ? err.status
          : err?.name === "ZodError"
            ? 400
            : 500;

      log.error("[SafeHandler] Error", {
        error: err?.message,
        ...logMetaBase,
      });

      const errorResponse =
        err?.name === "ZodError"
          ? NextResponse.json(
              { error: "Erro de validacao", details: err.errors },
              { status: 400 },
            )
          : NextResponse.json(
              {
                error:
                  status >= 500
                    ? "Erro interno do servidor"
                    : err?.message || "Erro na requisicao",
              },
              { status },
            );

      const handled = attachStandardHeaders(errorResponse, startedAt);
      recordApiRequest(
        buildMetricContext(logMetaBase, {
          status,
          latencyMs: handled.latencyMs,
          error: err?.message || "unknown",
          requestId: handled.requestId,
          gymContext,
          studentContext,
          personalContext,
          adminContext,
        }),
      );

      return handled.response;
    }
  };
}
