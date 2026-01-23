import fs from "fs";
import path from "path";
import type { Context } from "elysia";
import { uploadFoodsFromCSVContent } from "@/lib/services/upload-foods-from-csv";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "../utils/response";

export async function uploadFoodsHandler({
  set,
  request,
}: {
  set: Context["set"];
  request: Request;
}) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    let csvContent: string;
    if (file) {
      csvContent = await file.text();
    } else {
      const csvPath = path.join(process.cwd(), "public", "alimentos.csv");
      if (!fs.existsSync(csvPath)) {
        return badRequestResponse(
          set,
          "Arquivo CSV não encontrado. Envie um arquivo ou certifique-se de que public/alimentos.csv existe."
        );
      }

      csvContent = fs.readFileSync(csvPath, "utf-8");
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return badRequestResponse(set, "Conteúdo CSV vazio ou inválido");
    }

    const skipDuplicates = formData.get("skipDuplicates") === "true";
    const batchSize = parseInt(formData.get("batchSize")?.toString() || "100", 10);

    const result = await uploadFoodsFromCSVContent(csvContent, {
      skipDuplicates,
      batchSize: Math.min(Math.max(batchSize, 1), 500),
    });

    return successResponse(set, {
      message: "Upload de alimentos concluído",
      ...result,
    });
  } catch (error) {
    console.error("[uploadFoods] Erro:", error);
    return internalErrorResponse(set, "Erro ao fazer upload de alimentos", error);
  }
}
