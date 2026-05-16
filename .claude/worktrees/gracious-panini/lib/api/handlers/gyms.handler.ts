/**
 * Handler de Gyms
 *
 * Centraliza toda a lógica das rotas relacionadas a gyms
 */

import type { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "../middleware/auth.middleware";
import {
	validateBody,
	validateQuery,
} from "../middleware/validation.middleware";
import {
	createGymSchema,
	gymLocationsQuerySchema,
	setActiveGymSchema,
} from "../schemas";
import {
	badRequestResponse,
	internalErrorResponse,
	notFoundResponse,
	successResponse,
} from "../utils/response.utils";

/**
 * GET /api/gyms/list
 * Lista todas as academias do usuário
 */
export async function listGymsHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		// Buscar todas as academias do usuário
		const gyms = await db.gym.findMany({
			where: { userId },
			include: {
				subscription: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		// Verificar se alguma academia tem assinatura ativa (não trial)
		const _hasActiveSubscription = gyms.some((gym) => {
			if (!gym.subscription) return false;

			const now = new Date();
			const isTrialActive =
				gym.subscription.trialEnd && new Date(gym.subscription.trialEnd) > now;
			const isActive = gym.subscription.status === "active";
			const isTrialing = gym.subscription.status === "trialing";

			return isActive || (isTrialing && isTrialActive);
		});

		// Verificar se tem pelo menos uma academia com plano pago (não trial)
		const hasPaidSubscription = gyms.some((gym) => {
			if (!gym.subscription) return false;
			return gym.subscription.status === "active";
		});

		// Usuário só pode criar múltiplas academias se tiver pelo menos UMA com plano ativo (não trial)
		const canCreateMultipleGyms = hasPaidSubscription;

		const gymsData = gyms.map((gym) => {
			const now = new Date();
			const gymHasActiveSubscription = gym.subscription
				? gym.subscription.status === "active" ||
					(gym.subscription.status === "trialing" &&
						gym.subscription.trialEnd &&
						new Date(gym.subscription.trialEnd) > now)
				: false;

			return {
				id: gym.id,
				name: gym.name,
				logo: gym.logo,
				address: gym.address,
				email: gym.email,
				plan: gym.plan,
				isActive: gym.isActive,
				hasActiveSubscription: gymHasActiveSubscription,
			};
		});

		return successResponse({
			gyms: gymsData,
			canCreateMultipleGyms,
			totalGyms: gyms.length,
		});
	} catch (error: any) {
		console.error("[listGymsHandler] Erro:", error);
		return internalErrorResponse("Erro ao listar academias", error);
	}
}

/**
 * POST /api/gyms/create
 * Cria uma nova academia
 */
export async function createGymHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		// Validar body com Zod
		const validation = await validateBody(request, createGymSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { name, address, phone, email, cnpj } = validation.data;

		// Buscar academias existentes do usuário
		const existingGyms = await db.gym.findMany({
			where: { userId },
			include: {
				subscription: true,
			},
		});

		// Verificar se usuário pode criar múltiplas academias
		if (existingGyms.length > 0) {
			const hasPaidSubscription = existingGyms.some((gym) => {
				if (!gym.subscription) return false;
				return gym.subscription.status === "active";
			});

			if (!hasPaidSubscription) {
				return badRequestResponse(
					"Para criar múltiplas academias, você precisa ter pelo menos uma academia com plano ativo (não trial)",
				);
			}
		}

		// Verificar se CNPJ já existe (se fornecido)
		if (cnpj) {
			const existingCnpj = await db.gym.findUnique({
				where: { cnpj },
			});

			if (existingCnpj) {
				return badRequestResponse("CNPJ já cadastrado");
			}
		}

		// Criar nova academia
		const newGym = await db.gym.create({
			data: {
				userId,
				name,
				address,
				phone,
				email,
				cnpj: cnpj || null,
				plan: "basic",
				isActive: true,
			},
		});

		// Criar perfil da academia
		await db.gymProfile.create({
			data: {
				gymId: newGym.id,
				totalStudents: 0,
				activeStudents: 0,
				equipmentCount: 0,
				level: 1,
				xp: 0,
				xpToNextLevel: 100,
				currentStreak: 0,
				longestStreak: 0,
			},
		});

		// Criar stats da academia
		await db.gymStats.create({
			data: {
				gymId: newGym.id,
			},
		});

		// Definir como academia ativa
		await db.user.update({
			where: { id: userId },
			data: { activeGymId: newGym.id },
		});

		// Atualizar preferência
		await db.gymUserPreference.upsert({
			where: { userId },
			update: {
				lastActiveGymId: newGym.id,
				updatedAt: new Date(),
			},
			create: {
				userId,
				lastActiveGymId: newGym.id,
			},
		});

		return successResponse({
			gym: {
				id: newGym.id,
				name: newGym.name,
				address: newGym.address,
				email: newGym.email,
				plan: newGym.plan,
			},
		});
	} catch (error: any) {
		console.error("[createGymHandler] Erro:", error);
		return internalErrorResponse("Erro ao criar academia", error);
	}
}

/**
 * GET /api/gyms/profile
 * Busca o perfil da academia
 */
export async function getGymProfileHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		const user = await db.user.findUnique({
			where: { id: userId },
			include: {
				gyms: {
					include: {
						profile: true,
					},
				},
			},
		});

		if (!user || !user.gyms || user.gyms.length === 0) {
			return successResponse({
				hasProfile: false,
			});
		}

		// Pegar a primeira academia do usuário (ou a ativa se tiver activeGymId no futuro)
		const gym = user.gyms[0];

		const hasProfile =
			!!gym.profile &&
			gym.name !== null &&
			gym.address !== null &&
			gym.phone !== null &&
			gym.email !== null;

		return successResponse({
			hasProfile,
			profile: gym.profile
				? {
						name: gym.name,
						address: gym.address,
						phone: gym.phone,
						email: gym.email,
						cnpj: gym.cnpj,
						equipmentCount: gym.profile.equipmentCount,
					}
				: null,
		});
	} catch (error: any) {
		console.error("[getGymProfileHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar perfil", error);
	}
}

/**
 * POST /api/gyms/set-active
 * Define uma academia como ativa
 */
export async function setActiveGymHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		const auth = await requireAuth(request);
		if ("error" in auth) {
			return auth.response;
		}

		const userId = auth.userId;

		// Validar body com Zod
		const validation = await validateBody(request, setActiveGymSchema);
		if (!validation.success) {
			return validation.response;
		}

		const { gymId } = validation.data;

		// Verificar se a academia pertence ao usuário
		const gym = await db.gym.findFirst({
			where: {
				id: gymId,
				userId,
			},
		});

		if (!gym) {
			return notFoundResponse("Academia não encontrada");
		}

		// Atualizar activeGymId no usuário
		await db.user.update({
			where: { id: userId },
			data: { activeGymId: gymId },
		});

		// Atualizar preferência do usuário
		await db.gymUserPreference.upsert({
			where: { userId },
			update: {
				lastActiveGymId: gymId,
				updatedAt: new Date(),
			},
			create: {
				userId,
				lastActiveGymId: gymId,
			},
		});

		return successResponse({ activeGymId: gymId });
	} catch (error: any) {
		console.error("[setActiveGymHandler] Erro:", error);
		return internalErrorResponse("Erro ao alterar academia ativa", error);
	}
}

/**
 * GET /api/gyms/locations
 * Busca academias parceiras com localização e planos
 */
export async function getGymLocationsHandler(
	request: NextRequest,
): Promise<NextResponse> {
	try {
		// Esta rota pode ser pública (não requer autenticação)
		// Validar query params com Zod
		const queryValidation = await validateQuery(
			request,
			gymLocationsQuerySchema,
		);
		if (!queryValidation.success) {
			return queryValidation.response;
		}

		const lat = queryValidation.data.lat;
		const lng = queryValidation.data.lng;
		const _isPartner = queryValidation.data.isPartner;

		// Construir filtros
		const where: any = {
			isActive: true,
		};

		// Buscar academias
		const gyms = await db.gym.findMany({
			where: where,
			include: {
				plans: {
					where: {
						isActive: true,
					},
					orderBy: {
						price: "asc",
					},
				},
			},
			orderBy: {
				rating: "desc",
			},
		});

		// Função para calcular distância
		const calculateDistance = (
			lat1: number,
			lon1: number,
			lat2: number,
			lon2: number,
		): number => {
			const R = 6371; // Raio da Terra em km
			const dLat = ((lat2 - lat1) * Math.PI) / 180;
			const dLon = ((lon2 - lon1) * Math.PI) / 180;
			const a =
				Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos((lat1 * Math.PI) / 180) *
					Math.cos((lat2 * Math.PI) / 180) *
					Math.sin(dLon / 2) *
					Math.sin(dLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c; // Distância em km
		};

		// Função para calcular se está aberto agora
		const calculateOpenNow = (
			openingHours: { open: string; close: string; days?: string[] } | null,
		): boolean => {
			if (!openingHours) return true;

			const now = new Date();
			const dayNames = [
				"sunday",
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
			];
			const currentDayName = dayNames[now.getDay()];
			const currentTime = now.getHours() * 60 + now.getMinutes();

			if (openingHours.days && openingHours.days.length > 0) {
				if (!openingHours.days.includes(currentDayName)) {
					return false;
				}
			}

			const [openHour, openMin] = openingHours.open.split(":").map(Number);
			const [closeHour, closeMin] = openingHours.close.split(":").map(Number);
			const openTime = openHour * 60 + openMin;
			const closeTime = closeHour * 60 + closeMin;

			return currentTime >= openTime && currentTime <= closeTime;
		};

		// Transformar para formato esperado
		const formattedGyms = gyms.map((gym) => {
			// Parse amenities
			let amenities: string[] = [];
			if (gym.amenities) {
				try {
					amenities = JSON.parse(gym.amenities);
				} catch (_e) {
					// Ignorar erro de parse
				}
			}

			// Parse openingHours
			let openingHours: {
				open: string;
				close: string;
				days?: string[];
			} | null = null;
			if (gym.openingHours) {
				try {
					openingHours = JSON.parse(gym.openingHours);
				} catch (_e) {
					// Ignorar erro de parse
				}
			}

			// Parse photos
			let photos: string[] = [];
			if (gym.photos) {
				try {
					photos = JSON.parse(gym.photos);
				} catch (_e) {
					// Ignorar erro de parse
				}
			}

			// Calcular distância se lat/lng fornecidos
			let distance: number | undefined;
			if (lat && lng && gym.latitude && gym.longitude) {
				distance = calculateDistance(
					parseFloat(lat),
					parseFloat(lng),
					gym.latitude,
					gym.longitude,
				);
			}

			// Calcular se está aberto agora
			const openNow = openingHours ? calculateOpenNow(openingHours) : true;

			// Organizar plans por tipo
			const plansByType: {
				daily?: number;
				weekly?: number;
				monthly?: number;
			} = {};

			gym.plans.forEach((plan) => {
				if (plan.type === "daily") {
					plansByType.daily = plan.price;
				} else if (plan.type === "weekly") {
					plansByType.weekly = plan.price;
				} else if (plan.type === "monthly") {
					plansByType.monthly = plan.price;
				}
			});

			return {
				id: gym.id,
				name: gym.name,
				logo: gym.logo || undefined,
				address: gym.address,
				coordinates: {
					lat: gym.latitude || 0,
					lng: gym.longitude || 0,
				},
				distance: distance,
				rating: gym.rating || 0,
				totalReviews: gym.totalReviews || 0,
				plans: plansByType,
				amenities: amenities,
				openNow: openNow,
				openingHours: openingHours || undefined,
				photos: photos.length > 0 ? photos : undefined,
				isPartner: (gym as any).isPartner || false,
			};
		});

		// Ordenar por distância se fornecida
		if (lat && lng) {
			formattedGyms.sort((a, b) => {
				if (a.distance === undefined) return 1;
				if (b.distance === undefined) return -1;
				return a.distance - b.distance;
			});
		}

		return successResponse({ gyms: formattedGyms });
	} catch (error: any) {
		console.error("[getGymLocationsHandler] Erro:", error);
		return internalErrorResponse("Erro ao buscar academias", error);
	}
}
