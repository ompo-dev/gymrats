import type { Context } from "elysia";
import {
	createGymSchema,
	gymLocationsQuerySchema,
	setActiveGymSchema,
} from "@/lib/api/schemas";
import { db } from "@/lib/db";
import { parseJsonArray, parseJsonSafe } from "../utils/json";
import {
	badRequestResponse,
	internalErrorResponse,
	notFoundResponse,
	successResponse,
} from "../utils/response";
import { validateBody, validateQuery } from "../utils/validation";

type GymContext = {
	set: Context["set"];
	body?: unknown;
	query?: Record<string, unknown>;
	userId: string;
};

export async function listGymsHandler({ set, userId }: GymContext) {
	try {
		const gyms = await db.gym.findMany({
			where: { userId },
			include: { subscription: true },
			orderBy: { createdAt: "asc" },
		});

		const hasPaidSubscription = gyms.some(
			(gym) => gym.subscription?.status === "active",
		);

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

		return successResponse(set, {
			gyms: gymsData,
			canCreateMultipleGyms,
			totalGyms: gyms.length,
		});
	} catch (error) {
		console.error("[listGymsHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao listar academias", error);
	}
}

export async function createGymHandler({ set, body, userId }: GymContext) {
	try {
		const validation = validateBody(body, createGymSchema);
		if (!validation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${validation.errors.join("; ")}`,
				{ errors: validation.errors },
			);
		}

		const { name, address, phone, email, cnpj } = validation.data as any;
		const existingGyms = await db.gym.findMany({
			where: { userId },
			include: { subscription: true },
		});

		if (existingGyms.length > 0) {
			const hasPaidSubscription = existingGyms.some(
				(gym) => gym.subscription?.status === "active",
			);

			if (!hasPaidSubscription) {
				return badRequestResponse(
					set,
					"Para criar múltiplas academias, você precisa ter pelo menos uma academia com plano ativo (não trial)",
				);
			}
		}

		if (cnpj) {
			const existingCnpj = await db.gym.findUnique({ where: { cnpj } });
			if (existingCnpj) {
				return badRequestResponse(set, "CNPJ já cadastrado");
			}
		}

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

		await db.gymStats.create({
			data: { gymId: newGym.id },
		});

		await db.user.update({
			where: { id: userId },
			data: { activeGymId: newGym.id },
		});

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

		return successResponse(set, {
			gym: {
				id: newGym.id,
				name: newGym.name,
				address: newGym.address,
				email: newGym.email,
				plan: newGym.plan,
			},
		});
	} catch (error) {
		console.error("[createGymHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao criar academia", error);
	}
}

export async function getGymProfileHandler({ set, userId }: GymContext) {
	try {
		const user = await db.user.findUnique({
			where: { id: userId },
			include: {
				gyms: {
					include: { profile: true },
				},
			},
		});

		if (!user || !user.gyms || user.gyms.length === 0) {
			return successResponse(set, { hasProfile: false });
		}

		const gym = user.gyms[0];
		const hasProfile =
			!!gym.profile &&
			gym.name !== null &&
			gym.address !== null &&
			gym.phone !== null &&
			gym.email !== null;

		return successResponse(set, {
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
	} catch (error) {
		console.error("[getGymProfileHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao buscar perfil", error);
	}
}

export async function setActiveGymHandler({ set, body, userId }: GymContext) {
	try {
		const validation = validateBody(body, setActiveGymSchema);
		if (!validation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${validation.errors.join("; ")}`,
				{ errors: validation.errors },
			);
		}

		const { gymId } = validation.data as any;
		const gym = await db.gym.findFirst({
			where: {
				id: gymId,
				userId,
			},
		});

		if (!gym) {
			return notFoundResponse(set, "Academia não encontrada");
		}

		await db.user.update({
			where: { id: userId },
			data: { activeGymId: gymId },
		});

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

		return successResponse(set, { activeGymId: gymId });
	} catch (error) {
		console.error("[setActiveGymHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao alterar academia ativa", error);
	}
}

export async function getGymLocationsHandler({
	set,
	query,
}: {
	set: GymContext["set"];
	query?: Record<string, unknown>;
}) {
	try {
		const queryValidation = validateQuery(
			(query || {}) as Record<string, unknown>,
			gymLocationsQuerySchema,
		);
		if (!queryValidation.success) {
			return badRequestResponse(
				set,
				`Erros de validação: ${queryValidation.errors.join("; ")}`,
				{ errors: queryValidation.errors },
			);
		}

		const lat = queryValidation.data.lat as string | undefined;
		const lng = queryValidation.data.lng as string | undefined;

		const gyms = await db.gym.findMany({
			where: { isActive: true },
			include: {
				plans: {
					where: { isActive: true },
					orderBy: { price: "asc" },
				},
			},
			orderBy: { rating: "desc" },
		});

		const calculateDistance = (
			lat1: number,
			lon1: number,
			lat2: number,
			lon2: number,
		) => {
			const R = 6371;
			const dLat = ((lat2 - lat1) * Math.PI) / 180;
			const dLon = ((lon2 - lon1) * Math.PI) / 180;
			const a =
				Math.sin(dLat / 2) * Math.sin(dLat / 2) +
				Math.cos((lat1 * Math.PI) / 180) *
					Math.cos((lat2 * Math.PI) / 180) *
					Math.sin(dLon / 2) *
					Math.sin(dLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return R * c;
		};

		const calculateOpenNow = (
			openingHours: { open: string; close: string; days?: string[] } | null,
		) => {
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

		const formattedGyms = gyms.map((gym) => {
			const amenities = parseJsonArray<string>(gym.amenities);
			const openingHours = parseJsonSafe<{
				open: string;
				close: string;
				days?: string[];
			}>(gym.openingHours);
			const photos = parseJsonArray<string>(gym.photos);

			let distance: number | undefined;
			if (lat && lng && gym.latitude && gym.longitude) {
				distance = calculateDistance(
					parseFloat(lat),
					parseFloat(lng),
					gym.latitude,
					gym.longitude,
				);
			}

			const openNow = openingHours ? calculateOpenNow(openingHours) : true;

			const plansByType: {
				daily?: number;
				weekly?: number;
				monthly?: number;
			} = {};

			gym.plans.forEach((plan) => {
				if (plan.type === "daily") plansByType.daily = plan.price;
				if (plan.type === "weekly") plansByType.weekly = plan.price;
				if (plan.type === "monthly") plansByType.monthly = plan.price;
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
				distance,
				rating: gym.rating || 0,
				totalReviews: gym.totalReviews || 0,
				plans: plansByType,
				amenities,
				openNow,
				openingHours: openingHours || undefined,
				photos: photos.length > 0 ? photos : undefined,
				isPartner: (gym as any).isPartner || false,
			};
		});

		if (lat && lng) {
			formattedGyms.sort((a, b) => {
				if (a.distance === undefined) return 1;
				if (b.distance === undefined) return -1;
				return a.distance - b.distance;
			});
		}

		return successResponse(set, { gyms: formattedGyms });
	} catch (error) {
		console.error("[getGymLocationsHandler] Erro:", error);
		return internalErrorResponse(set, "Erro ao buscar academias", error);
	}
}
