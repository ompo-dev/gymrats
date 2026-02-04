"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { initializeGymTrial } from "@/lib/utils/auto-trial";
import { getSession } from "@/lib/utils/session";
import type { GymOnboardingData } from "./steps/types";

/**
 * Cria uma NOVA academia (adicional) para um usuário gym que já tem academias
 */
export async function submitNewGym(formData: GymOnboardingData) {
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
				gyms: {
					include: {
						subscription: true,
					},
				},
			},
		});

		if (!user) {
			return { success: false, error: "Usuário não encontrado" };
		}

		if (user.role !== "GYM" && user.role !== "ADMIN") {
			return { success: false, error: "Usuário não é uma academia" };
		}

		// Validar se pode criar múltiplas academias (precisa ter pelo menos uma com plano ativo)
		const hasActiveSubscription = user.gyms.some((gym) => {
			return (
				gym.subscription &&
				gym.subscription.status === "active" &&
				gym.subscription.plan !== "trial"
			);
		});

		if (!hasActiveSubscription) {
			return {
				success: false,
				error:
					"Você precisa ter um plano ativo (não trial) em pelo menos uma academia para criar múltiplas unidades",
			};
		}

		const fullAddress = formData.addressNumber
			? `${formData.address}, ${formData.addressNumber}, ${formData.city}, ${formData.state} - ${formData.zipCode}`
			: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zipCode}`;

		// Criar nova academia
		const newGym = await db.gym.create({
			data: {
				userId,
				name: formData.name,
				address: fullAddress,
				phone: formData.phone,
				email: formData.email,
				cnpj: formData.cnpj || null,
				isActive: true,
			},
		});

		// Criar equipamentos
		if (formData.equipment.length > 0) {
			await db.equipment.createMany({
				data: formData.equipment.map((eq) => ({
					gymId: newGym.id,
					name: eq.name,
					type: eq.type,
					brand: null,
					model: null,
					status: "available",
				})),
				skipDuplicates: true,
			});
		}

		// Criar profile
		await db.gymProfile.create({
			data: {
				gymId: newGym.id,
				equipmentCount: formData.equipment.length,
			},
		});

		// Criar stats
		await db.gymStats.create({
			data: {
				gymId: newGym.id,
			},
		});

		// Inicializar trial de 14 dias automaticamente
		await initializeGymTrial(newGym.id);

		// Atualizar activeGymId do usuário para a nova academia
		await db.user.update({
			where: { id: userId },
			data: { activeGymId: newGym.id },
		});

		// Atualizar preferência
		await db.gymUserPreference.upsert({
			where: { userId },
			create: {
				userId,
				lastActiveGymId: newGym.id,
			},
			update: {
				lastActiveGymId: newGym.id,
			},
		});

		return { success: true, gymId: newGym.id };
	} catch (error: unknown) {
		console.error("Erro ao criar nova academia:", error);
		const msg =
			error instanceof Error ? error.message : "Erro ao criar nova academia";
		return { success: false, error: msg };
	}
}

/**
 * Onboarding original - atualiza a primeira academia do usuário
 */
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

		if (user.role !== "GYM" && user.role !== "ADMIN") {
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
	} catch (error: unknown) {
		console.error("Erro ao salvar perfil da academia:", error);
		const msg =
			error instanceof Error
				? error.message
				: "Erro ao salvar perfil da academia";
		return { success: false, error: msg };
	}
}
