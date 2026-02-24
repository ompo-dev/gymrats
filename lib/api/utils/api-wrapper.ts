import { NextRequest, NextResponse } from "next/server";
import { ZodType } from "zod";
import { requireGym, requireStudent } from "../middleware/auth.middleware";

type AuthStrategy = "gym" | "student" | "none";

interface HandlerOptions<TBody = any, TQuery = any> {
  auth?: AuthStrategy;
  schema?: {
    body?: ZodType<TBody, any, any>;
    query?: ZodType<TQuery, any, any>;
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
};

/**
 * Creates a safe API handler with built-in auth, validation, and error handling
 */
export function createSafeHandler<TBody = any, TQuery = any>(
  handler: (ctx: SafeHandlerContext<TBody, TQuery>) => Promise<NextResponse>,
  options: HandlerOptions<TBody, TQuery> = {}
) {
  return async (req: NextRequest) => {
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

      // 3. Execute handler
      return await handler({ req, body, query, gymContext, studentContext });
    } catch (error: any) {
      console.error("[SafeHandler] Error:", error);
      
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
