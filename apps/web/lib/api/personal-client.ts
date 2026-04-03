import type { AxiosError } from "axios";
import type { Payment, StudentData } from "@/lib/types";
import { actionClient as apiClient } from "@/lib/actions/client";

function getErrorMessage(error: unknown, fallback: string) {
  const payload = (error as AxiosError<{ error?: string }>)?.response?.data;
  return payload?.error || fallback;
}

export async function createPersonalCouponRequest(data: {
  code: string;
  notes: string;
  discountKind: "PERCENTAGE" | "FIXED";
  discount: number;
  maxRedeems?: number;
  expiresAt?: Date | string | null;
}) {
  try {
    await apiClient.post("/api/personals/coupons", {
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

export async function deletePersonalCouponRequest(couponId: string) {
  try {
    await apiClient.delete(
      `/api/personals/coupons?couponId=${encodeURIComponent(couponId)}`,
    );
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao excluir cupom"),
    } as const;
  }
}

export async function createPersonalBoostCampaignRequest(data: {
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
    }>("/api/personals/boost-campaigns", data);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao criar campanha"),
    } as const;
  }
}

export async function deletePersonalBoostCampaignRequest(campaignId: string) {
  try {
    await apiClient.delete(
      `/api/personals/boost-campaigns?campaignId=${encodeURIComponent(campaignId)}`,
    );
    return { success: true } as const;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao excluir campanha"),
    } as const;
  }
}

export async function getPersonalBoostCampaignPixRequest(campaignId: string) {
  try {
    const response = await apiClient.get<{
      success: true;
      pixId: string;
      brCode: string;
      brCodeBase64: string;
      amount: number;
      expiresAt?: string;
    }>(`/api/personals/boost-campaigns/${campaignId}/pix`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Erro ao gerar PIX"),
    } as const;
  }
}

export async function getPersonalStudentsAsStudentDataRequest(gymId?: string) {
  const response = await apiClient.get<{ students: StudentData[] }>(
    "/api/personals/students/student-data",
    { params: gymId ? { gymId } : undefined },
  );
  return response.data.students;
}

export async function getPersonalStudentByIdRequest(studentId: string) {
  const response = await apiClient.get<{ student: StudentData }>(
    `/api/personals/students/${studentId}/student-data`,
  );
  return response.data.student;
}

export async function getPersonalStudentPaymentsRequest(_studentId: string) {
  return [] as Payment[];
}
