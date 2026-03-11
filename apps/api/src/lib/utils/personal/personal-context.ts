import { NextResponse } from "@/runtime/next-server";
import { getAuthContext } from "@/lib/context/auth-context-factory";
import { log } from "@/lib/observability";

export type { PersonalContext } from "@/lib/context/auth-context-factory";

type PersonalContextResult =
  | {
      ctx: import("@/lib/context/auth-context-factory").PersonalContext;
      errorResponse?: undefined;
    }
  | { ctx?: undefined; errorResponse: NextResponse };

export async function getPersonalContext(): Promise<PersonalContextResult> {
  try {
    const result = await getAuthContext({ type: "personal" });
    return result;
  } catch (error) {
    log.error("[getPersonalContext] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      errorResponse: NextResponse.json(
        { error: "Erro ao processar autenticação" },
        { status: 500 },
      ),
    };
  }
}
