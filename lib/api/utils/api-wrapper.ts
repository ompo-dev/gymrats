import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { getGymContext, GymContext } from "@/lib/utils/gym-context";
import { getStudentContext, StudentContext } from "@/lib/utils/student-context";

type AuthStrategy = "gym" | "student" | "none";

interface HandlerOptions<TBody = any, TQuery = any> {
  auth?: AuthStrategy;
  schema?: {
    body?: ZodSchema<TBody>;
    query?: ZodSchema<TQuery>;
  };
}

type SafeHandlerContext<TBody = any, TQuery = any> = {
  req: NextRequest;
  body: TBody;
  query: TQuery;
  gymContext?: GymContext;
  studentContext?: StudentContext;
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
      let gymContext: GymContext | undefined;
      let studentContext: StudentContext | undefined;

      // 1. Auth check
      if (options.auth === "gym") {
        const result = await getGymContext();
        if (result.errorResponse) return result.errorResponse;
        gymContext = result.ctx;
      } else if (options.auth === "student") {
        const result = await getStudentContext();
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 401 });
        }
        studentContext = result.ctx;
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
