/**
 * API Unificada para Student
 * 
 * Esta API retorna todos os dados do student de uma vez,
 * ou apenas as seções solicitadas via query params.
 * 
 * GET /api/students/all
 * GET /api/students/all?sections=progress,profile,workouts
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllStudentData } from "@/app/student/actions-unified";

export async function GET(request: NextRequest) {
  try {
    // Ler query params
    const { searchParams } = new URL(request.url);
    const sectionsParam = searchParams.get("sections");

    // Parse sections se fornecido
    let sections: string[] | undefined = undefined;
    if (sectionsParam) {
      sections = sectionsParam.split(",").map((s) => s.trim());
    }

    // Buscar dados
    const data = await getAllStudentData(sections);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/students/all] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar dados do student",
        message: error.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

