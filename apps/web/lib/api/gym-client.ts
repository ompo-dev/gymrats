import type { AxiosError } from "axios";
import type { Payment, StudentData } from "@/lib/types";
import { actionClient as apiClient } from "@/lib/actions/client";

function getErrorMessage(error: unknown, fallback: string) {
  const payload = (error as AxiosError<{ error?: string }>)?.response?.data;
  return payload?.error || fallback;
}

export async function createGymCouponRequest(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
  expiresAt?: Date | string | null;
}) {
  try {
    await apiClient.post("/api/gyms/coupons", {
      ...data,
      expiresAt:
        typeof data.expiresAt === "string"
          ? data.expiresAt
          : (data.expiresAt?.toISOString() ?? null),
    });
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao criar cupom"),
    } as const;
  }
}

export async function deleteGymCouponRequest(couponId: string) {
  try {
    await apiClient.delete(
      `/api/gyms/coupons?couponId=${encodeURIComponent(couponId)}`,
    );
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao excluir cupom"),
    } as const;
  }
}

export async function createGymBoostCampaignRequest(data: {
  title: string;
  description: string;
  primaryColor: string;
  linkedCouponId: string | null;
  linkedPlanId: string | null;
  durationHours: number;
  amountCents: number;
  radiusKm?: number;
}) {
  try {
    const response = await apiClient.post<{
      success: true;
      campaignId: string;
      pixId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
    }>("/api/gyms/boost-campaigns", data);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao criar campanha"),
    } as const;
  }
}

export async function deleteGymBoostCampaignRequest(campaignId: string) {
  try {
    await apiClient.delete(
      `/api/gyms/boost-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
    );
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao excluir campanha"),
    } as const;
  }
}

export async function getGymBoostCampaignPixRequest(campaignId: string) {
  try {
    const response = await apiClient.get<{
      success: true;
      pixId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
    }>(`/api/gyms/boost-campaigns/${campaignId}/pix`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao gerar PIX"),
    } as const;
  }
}

export async function createGymWithdrawRequest(data: {
  amountCents: number;
  fake?: boolean;
}) {
  try {
    const response = await apiClient.post<{
      success: true;
      withdraw: { id: string; amount: number; status: string };
    }>("/api/gyms/withdraws", data);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao criar saque"),
    } as const;
  }
}

export async function getGymStudentByIdRequest(studentId: string) {
  const response = await apiClient.get<{ student: StudentData }>(
    `/api/gyms/students/${studentId}`,
  );
  return response.data.student;
}

export async function getGymStudentPaymentsRequest(studentId: string) {
  const response = await apiClient.get<{ payments: Payment[] }>(
    "/api/gyms/payments",
    { params: { studentId } },
  );
  return response.data.payments;
}
