import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/middleware/auth.middleware";
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from "@/lib/api/utils/response.utils";
import { uploadFoodsFromCSVContent } from "@/lib/services/upload-foods-from-csv";
import fs from "fs";
import path from "path";

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
      // Upload via arquivo
      csvContent = await file.text();
    } else {
      // Usar arquivo padrão do projeto
      const csvPath = path.join(process.cwd(), "public", "alimentos.csv");
      
      if (!fs.existsSync(csvPath)) {
        return badRequestResponse("Arquivo CSV não encontrado. Envie um arquivo ou certifique-se de que public/alimentos.csv existe.");
      }

      csvContent = fs.readFileSync(csvPath, "utf-8");
    }

    // Validar que é um CSV válido
    if (!csvContent || csvContent.trim().length === 0) {
      return badRequestResponse("Conteúdo CSV vazio ou inválido");
    }

    // Verificar opções
    const skipDuplicates = formData.get("skipDuplicates") === "true";
    const batchSize = parseInt(formData.get("batchSize")?.toString() || "100", 10);

    // Fazer upload
    const result = await uploadFoodsFromCSVContent(csvContent, {
      skipDuplicates,
      batchSize: Math.min(Math.max(batchSize, 1), 500), // Limitar entre 1 e 500
    });

    return successResponse({
      message: "Upload de alimentos concluído",
      ...result,
    });
  } catch (error: any) {
    console.error("[uploadFoods] Erro:", error);
    return internalErrorResponse(
      "Erro ao fazer upload de alimentos",
      error
    );
  }
}

