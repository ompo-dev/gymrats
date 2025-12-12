import { NextRequest, NextResponse } from "next/server";
import { startGymTrial } from "@/app/gym/actions";

export async function POST(request: NextRequest) {
  try {
    const result = await startGymTrial();
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, subscription: result.subscription });
  } catch (error: any) {
    console.error("Erro ao iniciar trial:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao iniciar trial" },
      { status: 500 }
    );
  }
}

