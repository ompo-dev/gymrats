import { apiClient } from "@/lib/api/client";

export async function confirmAbacatePayment(): Promise<{
  success: boolean;
  subscription?: {
    plan: string;
    status: string;
    billingPeriod: string;
  };
  error?: string;
}> {
  try {
    const response = await apiClient.get<{
      subscription?: {
        plan: string;
        status: string;
        billingPeriod?: string;
      } | null;
    }>("/api/subscriptions/current");

    const subscription = response.data.subscription;

    if (!subscription) {
      return { success: false, error: "Assinatura não encontrada." };
    }

    if (
      subscription.status === "active" ||
      subscription.status === "canceled"
    ) {
      return {
        success: true,
        subscription: {
          plan: subscription.plan,
          status: subscription.status,
          billingPeriod: subscription.billingPeriod ?? "monthly",
        },
      };
    }

    return {
      success: false,
      error: `Pagamento ainda não confirmado. Status: ${subscription.status}`,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao confirmar pagamento.",
    };
  }
}
