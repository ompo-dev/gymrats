import { NextRequest, NextResponse } from "next/server";
import { getStudentSubscription } from "@/app/student/actions";

export async function GET(request: NextRequest) {
  try {
    const subscription = await getStudentSubscription();
    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Erro ao buscar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar assinatura" },
      { status: 500 }
    );
  }
}
