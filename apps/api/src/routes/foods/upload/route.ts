import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/api/middleware/auth.middleware";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { log } from "@/lib/observability";
import { uploadFoodsFromCSVContent } from "@/lib/services/upload-foods-from-csv";
import type { NextRequest } from "@/runtime/next-server";

const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CSV_TYPES = new Set(["text/csv", "application/csv", ""]);

function looksLikeTextCsv(content: string) {
  return content.includes(",") || content.includes(";");
}

/**
 * POST /api/foods/upload
 * Faz upload de alimentos a partir do CSV da TACO
 * Requer autenticação ADMIN
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se é admin
    const auth = await requireAdmin(request);
    if ("error" in auth) {
      return auth.response;
    }

    // Verificar se há arquivo no body ou usar arquivo padrão
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    let csvContent: string;

    if (file) {
      if (!(file instanceof File)) {
        return badRequestResponse("Arquivo inválido");
      }

      if (file.size > MAX_CSV_FILE_SIZE) {
        return badRequestResponse("Arquivo muito grande. Máximo de 5MB.");
      }

      if (!ALLOWED_CSV_TYPES.has(file.type)) {
        return badRequestResponse("Tipo de arquivo não permitido. Use CSV.");
      }

      // Upload via arquivo
      csvContent = await file.text();
    } else {
      // Usar arquivo padrão do projeto
      const csvPath = path.join(process.cwd(), "public", "alimentos.csv");

      if (!fs.existsSync(csvPath)) {
        return badRequestResponse(
          "Arquivo CSV não encontrado. Envie um arquivo ou certifique-se de que public/alimentos.csv existe.",
        );
      }

      csvContent = fs.readFileSync(csvPath, "utf-8");
    }

    // Validar que é um CSV válido
    if (!csvContent || csvContent.trim().length === 0) {
      return badRequestResponse("Conteúdo CSV vazio ou inválido");
    }

    if (!looksLikeTextCsv(csvContent)) {
      return badRequestResponse("Conteúdo do arquivo não parece ser um CSV válido");
    }

    // Verificar opções
    const skipDuplicates = formData.get("skipDuplicates") === "true";
    const batchSize = parseInt(
      formData.get("batchSize")?.toString() || "100",
      10,
    );

    // Fazer upload
    const result = await uploadFoodsFromCSVContent(csvContent, {
      skipDuplicates,
      batchSize: Math.min(Math.max(batchSize, 1), 500), // Limitar entre 1 e 500
    });

    return successResponse({
      message: "Upload de alimentos concluído",
      ...result,
    });
  } catch (error) {
    log.error("[uploadFoods] Erro", { error });
    return internalErrorResponse("Erro ao fazer upload de alimentos", error);
  }
}
