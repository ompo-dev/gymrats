import { NextResponse } from "@/runtime/next-server";
import { getAuthContext } from "@/lib/context/auth-context-factory";
import { log } from "@/lib/observability";

export type { GymContext } from "@/lib/context/auth-context-factory";

type GymContextResult =
  | {
      ctx: import("@/lib/context/auth-context-factory").GymContext;
      errorResponse?: undefined;
    }
  | { ctx?: undefined; errorResponse: NextResponse };

export async function getGymContext(): Promise<GymContextResult> {
  try {
    const result = await getAuthContext({ type: "gym" });
    return result;
  } catch (error) {
    log.error("[getGymContext] Erro", {
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
