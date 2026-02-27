"use server";

import type { Gym, GymProfile, GymStats } from "@prisma/client";
import { db } from "@/lib/db";
import { initializeGymTrial } from "@/lib/utils/auto-trial";
import { getGymContext } from "@/lib/utils/gym/gym-context";
import type { GymOnboardingData } from "./steps/types";

type GymWithProfileAndStats = Gym & {
	profile?: GymProfile | null;
	stats?: GymStats | null;
};

/**
 * Cria uma NOVA academia (adicional) para um usuário gym que já tem academias
 */
import { GymInventoryService } from "@/lib/services/gym/gym-inventory.service";

export async function submitNewGym(formData: GymOnboardingData) {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { success: false, error: "Não autenticado" };

		const fullAddress = formData.addressNumber
			? `${formData.address}, ${formData.addressNumber}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
			: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;

		const newGym = await GymInventoryService.createGym(ctx.user.id, {
			...formData,
			address: fullAddress,
		});

		await initializeGymTrial(newGym.id);

		return { success: true, gymId: newGym.id };
	} catch (error) {
		console.error("Erro ao criar nova academia:", error);
		const message = error instanceof Error ? error.message : "Erro ao criar nova academia";
		return { success: false, error: message };
	}
}

export async function submitGymOnboarding(formData: GymOnboardingData) {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse || !ctx) return { success: false, error: "Não autenticado" };

		const fullAddress = formData.addressNumber
			? `${formData.address}, ${formData.addressNumber}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
			: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;
		
		const gyms = await db.gym.findMany({ where: { userId: ctx.user.id } });
		const gymId = gyms[0]?.id;

		if (gymId) {
			await GymInventoryService.updateOnboarding(gymId, {
				...formData,
				address: fullAddress,
			});
			await initializeGymTrial(gymId);
		} else {
			const newGym = await GymInventoryService.createGym(ctx.user.id, {
				...formData,
				address: fullAddress,
			});
			await initializeGymTrial(newGym.id);
		}

		return { success: true };
	} catch (error) {
		console.error("Erro ao salvar perfil da academia:", error);
		const message = error instanceof Error ? error.message : "Erro ao salvar perfil da academia";
		return { success: false, error: message };
	}
}
