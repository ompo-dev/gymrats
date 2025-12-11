"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/utils/session";
import { db } from "@/lib/db";
import { initializeGymTrial } from "@/lib/utils/auto-trial";
import type { GymOnboardingData } from "./steps/types";

export async function submitGymOnboarding(formData: GymOnboardingData) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_token")?.value;

    if (!sessionToken) {
      return { success: false, error: "Não autenticado" };
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return { success: false, error: "Sessão inválida" };
    }

    const userId = session.userId;

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        gym: {
          include: {
            profile: true,
            stats: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado" };
    }

    if (user.role !== "GYM") {
      return { success: false, error: "Usuário não é uma academia" };
    }

    const fullAddress = formData.addressNumber
      ? `${formData.address}, ${formData.addressNumber}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
      : `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;

    let gym = user.gym;
    if (!gym) {
      const createdGym = await db.gym.create({
        data: {
          userId,
          name: formData.name,
          address: fullAddress,
          phone: formData.phone,
          email: formData.email,
          cnpj: formData.cnpj || null,
        },
      });

      gym = await db.gym.findUnique({
        where: { id: createdGym.id },
        include: {
          profile: true,
          stats: true,
        },
      });
    } else {
      await db.gym.update({
        where: { id: gym.id },
        data: {
          name: formData.name,
          address: fullAddress,
          phone: formData.phone,
          email: formData.email,
          cnpj: formData.cnpj || null,
        },
      });

      gym = await db.gym.findUnique({
        where: { id: gym.id },
        include: {
          profile: true,
          stats: true,
        },
      });
    }

    if (!gym) {
      return { success: false, error: "Erro ao criar/atualizar academia" };
    }

    if (formData.equipment.length > 0) {
      await db.equipment.createMany({
        data: formData.equipment.map((eq) => ({
          gymId: gym.id,
          name: eq.name,
          type: eq.type,
          brand: null,
          model: null,
          status: "available",
        })),
        skipDuplicates: true,
      });
    }

    if (!gym.profile) {
      await db.gymProfile.create({
        data: {
          gymId: gym.id,
          equipmentCount: formData.equipment.length,
        },
      });
    } else {
      await db.gymProfile.update({
        where: { gymId: gym.id },
        data: {
          equipmentCount: formData.equipment.length,
        },
      });
    }

    if (!gym.stats) {
      await db.gymStats.create({
        data: {
          gymId: gym.id,
        },
      });
    }

    // Inicializar trial de 14 dias automaticamente
    await initializeGymTrial(gym.id);

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao salvar perfil da academia:", error);
    return {
      success: false,
      error: error.message || "Erro ao salvar perfil da academia",
    };
  }
}
