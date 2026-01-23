"use server";

import { backendGet, backendPost } from "@/lib/api/backend-client";
import {
  mockGymProfile,
  mockGymStats,
  mockStudents,
  mockEquipment,
  mockFinancialSummary,
  mockRecentCheckIns,
  mockPayments,
  mockCoupons,
  mockReferrals,
  mockExpenses,
  mockMembershipPlans,
} from "@/lib/gym-mock-data";

type ApiSuccess<T> = { success: true } & T;

export async function getCurrentUserInfo() {
  try {
    const response = await backendGet<ApiSuccess<{ user: { role: string } }>>(
      "/api/auth/session"
    );
    const role = response?.user?.role ?? null;
    return { isAdmin: role === "ADMIN", role };
  } catch (error) {
    console.error("[getCurrentUserInfo] Erro ao buscar sessão:", error);
    return { isAdmin: false, role: null };
  }
}

export async function getGymProfile() {
  try {
    const response = await backendGet<
      ApiSuccess<{ hasProfile?: boolean; profile?: unknown }>
    >("/api/gyms/profile");

    if (!response?.hasProfile || !response.profile) {
      return mockGymProfile;
    }

    return {
      ...mockGymProfile,
      ...(response.profile as Record<string, unknown>),
    };
  } catch (error) {
    console.error("[getGymProfile] Erro ao buscar perfil:", error);
    return mockGymProfile;
  }
}

export async function getGymStats() {
  return mockGymStats;
}

export async function getGymStudents() {
  return mockStudents;
}

export async function getGymEquipment() {
  return mockEquipment;
}

export async function getGymFinancialSummary() {
  return mockFinancialSummary;
}

export async function getGymRecentCheckIns() {
  return mockRecentCheckIns;
}

export async function getGymEquipmentById(equipmentId: string) {
  return mockEquipment.find((item) => item.id === equipmentId) || null;
}

export async function getGymStudentById(studentId: string) {
  return mockStudents.find((student) => student.id === studentId) || null;
}

export async function getGymStudentPayments(studentId: string) {
  return mockPayments.filter((payment) => payment.studentId === studentId);
}

export async function getGymPayments() {
  return mockPayments;
}

export async function getGymCoupons() {
  return mockCoupons;
}

export async function getGymReferrals() {
  return mockReferrals;
}

export async function getGymExpenses() {
  return mockExpenses;
}

export async function getGymMembershipPlans() {
  return mockMembershipPlans;
}

export async function getGymSubscription() {
  try {
    const response = await backendGet<ApiSuccess<Record<string, unknown>>>(
      "/api/gym-subscriptions/current"
    );

    if (!response?.success) {
      return null;
    }

    const { success, ...subscription } = response;
    return subscription;
  } catch (error) {
    console.error("[getGymSubscription] Erro ao buscar assinatura:", error);
    return null;
  }
}

export async function startGymTrial() {
  try {
    const response = await backendPost<ApiSuccess<Record<string, unknown>>>(
      "/api/gym-subscriptions/start-trial",
      {}
    );

    return response;
  } catch (error) {
    console.error("[startGymTrial] Erro ao iniciar trial:", error);
    return { error: "Erro ao iniciar trial" };
  }
}
