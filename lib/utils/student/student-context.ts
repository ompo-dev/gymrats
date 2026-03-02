import { getAuthContext } from "@/lib/context/auth-context-factory";
import { log } from "@/lib/observability";

export type { StudentContext } from "@/lib/context/auth-context-factory";

type StudentContextResult =
  | {
      ctx: import("@/lib/context/auth-context-factory").StudentContext;
      error?: undefined;
    }
  | { ctx?: undefined; error: string };

export async function getStudentContext(): Promise<StudentContextResult> {
  try {
    const result = await getAuthContext({ type: "student" });
    return result;
  } catch (error) {
    log.error("[getStudentContext] Erro", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: "Erro ao processar autenticação." };
  }
}
