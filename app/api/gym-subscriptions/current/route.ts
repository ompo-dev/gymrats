import { NextRequest, NextResponse } from "next/server";
import { getGymSubscription } from "@/app/gym/actions";

export async function GET(request: NextRequest) {
  try {
    const subscription = await getGymSubscription();

    // Log para debug
    if (subscription) {
      console.log("[API] Gym Subscription retornada:", {
        id: subscription.id,
        plan: subscription.plan,
        billingPeriod: subscription.billingPeriod,
        status: subscription.status,
      });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Erro ao buscar assinatura:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar assinatura" },
      { status: 500 }
    );
  }
}
