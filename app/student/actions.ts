"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { MuscleGroup } from "@/lib/types";
import { getSession } from "@/lib/utils/session";

export async function getCurrentUserInfo() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			console.log("[getCurrentUserInfo] Sem token de sessão");
			return { isAdmin: false, role: null };
		}

		const session = await getSession(sessionToken);
		if (!session) {
			console.log("[getCurrentUserInfo] Sessão não encontrada");
			return { isAdmin: false, role: null };
		}

		const isAdmin = session.user.role === "ADMIN";
		const role = session.user.role;

		console.log("[getCurrentUserInfo] User role:", role, "isAdmin:", isAdmin);

		return {
			isAdmin,
			role,
		};
	} catch (error) {
		console.error(
			"[getCurrentUserInfo] Erro ao buscar informações do usuário:",
			error,
		);
		return { isAdmin: false, role: null };
	}
}

export async function getStudentProfile() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			return { hasProfile: false, profile: null };
		}

		// Primeiro tentar buscar sessão no banco usando o token
		const session = await getSession(sessionToken);

		// Se não encontrou no banco, tentar validar via Better Auth
		if (!session) {
			try {
				const { auth } = await import("@/lib/auth-config");

				// Criar headers com cookies para Better Auth
				const betterAuthHeaders = new Headers();
				const betterAuthToken = cookieStore.get(
					"better-auth.session_token",
				)?.value;
				const authToken = cookieStore.get("auth_token")?.value;

				if (betterAuthToken) {
					betterAuthHeaders.set(
						"cookie",
						`better-auth.session_token=${betterAuthToken}`,
					);
				} else if (authToken) {
					betterAuthHeaders.set("cookie", `auth_token=${authToken}`);
				}

				const betterAuthSession = await auth.api.getSession({
					headers: betterAuthHeaders,
				});

				if (betterAuthSession?.user) {
					// Sessão do Better Auth encontrada - buscar dados do perfil diretamente
					const user = await db.user.findUnique({
						where: { id: betterAuthSession.user.id },
						include: {
							student: {
								include: {
									profile: true,
								},
							},
						},
					});

					if (!user || !user.student) {
						return { hasProfile: false, profile: null };
					}

					const hasProfile =
						!!user.student.profile &&
						user.student.profile.height !== null &&
						user.student.profile.weight !== null &&
						user.student.profile.fitnessLevel !== null;

					return {
						hasProfile,
						profile: user.student.profile
							? {
									height: user.student.profile.height,
									weight: user.student.profile.weight,
									fitnessLevel: user.student.profile.fitnessLevel,
									weeklyWorkoutFrequency:
										user.student.profile.weeklyWorkoutFrequency,
									workoutDuration: user.student.profile.workoutDuration,
									goals: user.student.profile.goals
										? JSON.parse(user.student.profile.goals)
										: [],
									availableEquipment: user.student.profile.availableEquipment
										? JSON.parse(user.student.profile.availableEquipment)
										: [],
									gymType: user.student.profile.gymType,
									preferredWorkoutTime:
										user.student.profile.preferredWorkoutTime,
									preferredSets: user.student.profile.preferredSets,
									preferredRepRange: user.student.profile.preferredRepRange,
									restTime: user.student.profile.restTime,
								}
							: null,
					};
				}
			} catch (betterAuthError) {
				// Se falhar com Better Auth, continuar com método antigo
				console.log(
					"[getStudentProfile] Better Auth não encontrou sessão:",
					betterAuthError,
				);
			}
		}

		// Se encontrou sessão no banco, usar método antigo
		if (session) {
			const user = await db.user.findUnique({
				where: { id: session.userId },
				include: {
					student: {
						include: {
							profile: true,
						},
					},
				},
			});

			if (!user || !user.student) {
				return { hasProfile: false, profile: null };
			}

			const hasProfile =
				!!user.student.profile &&
				user.student.profile.height !== null &&
				user.student.profile.weight !== null &&
				user.student.profile.fitnessLevel !== null;

			return {
				hasProfile,
				profile: user.student.profile
					? {
							height: user.student.profile.height,
							weight: user.student.profile.weight,
							fitnessLevel: user.student.profile.fitnessLevel,
							weeklyWorkoutFrequency:
								user.student.profile.weeklyWorkoutFrequency,
							workoutDuration: user.student.profile.workoutDuration,
							goals: user.student.profile.goals
								? JSON.parse(user.student.profile.goals)
								: [],
							availableEquipment: user.student.profile.availableEquipment
								? JSON.parse(user.student.profile.availableEquipment)
								: [],
							gymType: user.student.profile.gymType,
							preferredWorkoutTime: user.student.profile.preferredWorkoutTime,
							preferredSets: user.student.profile.preferredSets,
							preferredRepRange: user.student.profile.preferredRepRange,
							restTime: user.student.profile.restTime,
						}
					: null,
			};
		}

		// Se não encontrou sessão nem via banco nem via Better Auth
		return { hasProfile: false, profile: null };
	} catch (error) {
		console.error("Erro ao buscar perfil:", error);
		return { hasProfile: false, profile: null };
	}
}

export async function getStudentProgress() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			return getNeutralProgress();
		}

		const session = await getSession(sessionToken);
		if (!session || !session.user.student) {
			return getNeutralProgress();
		}

		const studentId = session.user.student.id;

		const progress = await db.studentProgress.findUnique({
			where: { studentId: studentId },
		});

		if (!progress) {
			return getNeutralProgress();
		}

		// Buscar achievements desbloqueados
		const achievementUnlocks = await db.achievementUnlock.findMany({
			where: {
				studentId: studentId,
			},
			include: {
				achievement: true,
			},
			orderBy: {
				unlockedAt: "desc",
			},
		});

		const achievements = achievementUnlocks.map((unlock) => ({
			id: unlock.achievement.id,
			title: unlock.achievement.title,
			description: unlock.achievement.description || "",
			icon: unlock.achievement.icon || "🏆",
			unlockedAt: unlock.unlockedAt,
			progress: unlock.progress || undefined,
			target: unlock.achievement.target || undefined,
			category: unlock.achievement.category as
				| "streak"
				| "workouts"
				| "xp"
				| "perfect"
				| "special",
			level: unlock.achievement.level || undefined,
			color: unlock.achievement.color || "#58CC02",
		}));

		// Calcular weeklyXP (últimos 7 dias)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const workoutHistory = await db.workoutHistory.findMany({
			where: {
				studentId: studentId,
				date: {
					gte: sevenDaysAgo,
				},
			},
			include: {
				workout: {
					select: {
						xpReward: true,
					},
				},
			},
		});

		// Agrupar XP por dia da semana (0 = domingo, 6 = sábado)
		const weeklyXP = [0, 0, 0, 0, 0, 0, 0];
		workoutHistory.forEach((wh) => {
			const dayOfWeek = wh.date.getDay();
			weeklyXP[dayOfWeek] += wh.workout?.xpReward ?? 0;
		});

		return {
			currentStreak: progress.currentStreak || 0,
			longestStreak: progress.longestStreak || 0,
			totalXP: progress.totalXP || 0,
			currentLevel: progress.currentLevel || 1,
			xpToNextLevel: progress.xpToNextLevel || 0,
			workoutsCompleted: progress.workoutsCompleted || 0,
			todayXP: progress.todayXP || 0,
			achievements: achievements,
			lastActivityDate: progress.lastActivityDate
				? progress.lastActivityDate.toISOString()
				: new Date().toISOString(),
			dailyGoalXP: progress.dailyGoalXP || 50,
			weeklyXP: weeklyXP,
		};
	} catch (error) {
		console.error("Erro ao buscar progresso:", error);
		return getNeutralProgress();
	}
}

/** Valores neutros para progresso quando não autenticado ou em erro (nunca mock em produção) */
function getNeutralProgress() {
	return {
		currentStreak: 0,
		longestStreak: 0,
		totalXP: 0,
		currentLevel: 1,
		xpToNextLevel: 100,
		workoutsCompleted: 0,
		todayXP: 0,
		achievements: [],
		lastActivityDate: new Date().toISOString(),
		dailyGoalXP: 50,
		weeklyXP: [0, 0, 0, 0, 0, 0, 0],
	};
}

export async function getStudentUnits() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			return [];
		}

		const session = await getSession(sessionToken);
		if (!session || !session.user.student) {
			return [];
		}

		// Buscar units do database
		const studentId = session.user.student.id;

		const units = await db.unit.findMany({
			orderBy: { order: "asc" },
			include: {
				workouts: {
					orderBy: { order: "asc" },
					include: {
						exercises: {
							orderBy: { order: "asc" },
							include: {
								alternatives: {
									orderBy: { order: "asc" },
								},
							},
						},
						completions: {
							where: {
								studentId: studentId,
							},
							orderBy: {
								date: "desc",
							},
							take: 1,
						},
					},
				},
			},
		});

		// Buscar IDs de workouts completados
		const completedWorkoutIds = await db.workoutHistory.findMany({
			where: {
				studentId: studentId,
			},
			select: {
				workoutId: true,
			},
			distinct: ["workoutId"],
		});

		const completedIdsSet = new Set(
			completedWorkoutIds.map((wh) => wh.workoutId),
		);

		// Transformar para formato esperado
		const formattedUnits = units.map((unit) => ({
			id: unit.id,
			title: unit.title,
			description: unit.description || "",
			color: unit.color || "#58CC02",
			icon: unit.icon || "💪",
			workouts: unit.workouts.map((workout) => {
				const isCompleted = completedIdsSet.has(workout.id);
				const lastCompletion = workout.completions[0];

				// Calcular locked
				// Um workout está locked se:
				// 1. Está marcado como locked no DB, OU
				// 2. Não é o primeiro workout da primeira unit E não completou o anterior
				let isLocked = workout.locked;

				// Encontrar índice do workout na unit
				const workoutIndex = unit.workouts.findIndex(
					(w) => w.id === workout.id,
				);

				// Encontrar índice da unit no array
				const unitIndex = units.findIndex((u) => u.id === unit.id);

				// Se é o primeiro workout da primeira unit, NUNCA deve estar locked
				if (unitIndex === 0 && workoutIndex === 0) {
					isLocked = false;
				} else if (!isLocked) {
					// Se não é o primeiro workout da primeira unit
					if (unitIndex > 0 || workoutIndex > 0) {
						let previousWorkout = null;

						if (workoutIndex > 0) {
							// Workout anterior na mesma unit
							previousWorkout = unit.workouts[workoutIndex - 1];
						} else if (unitIndex > 0) {
							// Último workout da unit anterior
							const previousUnit = units[unitIndex - 1];
							if (previousUnit.workouts.length > 0) {
								previousWorkout =
									previousUnit.workouts[previousUnit.workouts.length - 1];
							}
						}

						// Se tem workout anterior, verificar se foi completado
						if (previousWorkout) {
							isLocked = !completedIdsSet.has(previousWorkout.id);
						}
					}
				}

				// Calcular stars
				let stars: number | undefined;
				if (lastCompletion) {
					if (lastCompletion.overallFeedback === "excelente") {
						stars = 3;
					} else if (lastCompletion.overallFeedback === "bom") {
						stars = 2;
					} else if (lastCompletion.overallFeedback === "regular") {
						stars = 1;
					} else {
						stars = 0;
					}
				}

				return {
					id: workout.id,
					title: workout.title,
					description: workout.description || "",
					type: workout.type as "strength" | "cardio" | "flexibility" | "rest",
					muscleGroup: workout.muscleGroup as MuscleGroup,
					difficulty: workout.difficulty as
						| "iniciante"
						| "intermediario"
						| "avancado",
					exercises: workout.exercises.map((exercise) => ({
						id: exercise.id,
						name: exercise.name,
						sets: exercise.sets,
						reps: exercise.reps,
						rest: exercise.rest,
						notes: exercise.notes || undefined,
						videoUrl: exercise.videoUrl || undefined,
						educationalId: exercise.educationalId || undefined,
						alternatives:
							exercise.alternatives.length > 0
								? exercise.alternatives.map((alt) => ({
										id: alt.id,
										name: alt.name,
										reason: alt.reason,
										educationalId: alt.educationalId || undefined,
									}))
								: undefined,
					})),
					xpReward: workout.xpReward,
					estimatedTime: workout.estimatedTime,
					locked: isLocked,
					completed: isCompleted,
					stars: stars,
					completedAt: lastCompletion?.date || undefined,
				};
			}),
		}));

		return formattedUnits;
	} catch (error) {
		console.error("Erro ao buscar units do database:", error);
		return [];
	}
}

export async function getGymLocations() {
	try {
		// Buscar academias parceiras e ativas
		const whereClause: { isActive: boolean; isPartner?: boolean } = {
			isActive: true,
			isPartner: true,
		};

		const gyms = await db.gym.findMany({
			where: whereClause,
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

			// Calcular se está aberto agora
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
			let openNow = true;

			if (openingHours) {
				if (openingHours.days && openingHours.days.length > 0) {
					if (!openingHours.days.includes(currentDayName)) {
						openNow = false;
					}
				}

				if (openNow) {
					const [openHour, openMin] = openingHours.open.split(":").map(Number);
					const [closeHour, closeMin] = openingHours.close
						.split(":")
						.map(Number);
					const openTime = openHour * 60 + openMin;
					const closeTime = closeHour * 60 + closeMin;
					openNow = currentTime >= openTime && currentTime <= closeTime;
				}
			}

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
				rating: gym.rating || 0,
				totalReviews: gym.totalReviews || 0,
				plans: {
					daily: plansByType.daily ?? 0,
					weekly: plansByType.weekly ?? 0,
					monthly: plansByType.monthly ?? 0,
				},
				amenities: amenities,
				openNow: openNow,
				openingHours: openingHours
					? {
							open: openingHours.open,
							close: openingHours.close,
						}
					: {
							open: "06:00",
							close: "22:00",
						},
				photos: photos.length > 0 ? photos : undefined,
				isPartner: (gym as { isPartner?: boolean }).isPartner || false, // Type assertion temporário até migration ser aplicada
			};
		});

		return formattedGyms;
	} catch (error) {
		console.error("Erro ao buscar academias do database:", error);
		return [];
	}
}

export async function getStudentSubscription() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			return null;
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return null;
		}

		// Se for ADMIN, garantir que tenha perfil de student
		let studentId: string | null = null;
		if (session.user.role === "ADMIN") {
			const existingStudent = await db.student.findUnique({
				where: { userId: session.user.id },
			});

			if (!existingStudent) {
				const newStudent = await db.student.create({
					data: {
						userId: session.user.id,
					},
				});
				studentId = newStudent.id;
			} else {
				studentId = existingStudent.id;
			}
		} else if (session.user.student?.id) {
			studentId = session.user.student.id;
		}

		if (!studentId) {
			return null;
		}

		const subscription = await db.subscription.findUnique({
			where: { studentId },
		});

		if (!subscription) {
			console.log(
				`[getStudentSubscription] Nenhuma subscription encontrada para studentId: ${studentId}`,
			);
			return null;
		}

		console.log(`[getStudentSubscription] Subscription encontrada:`, {
			id: subscription.id,
			status: subscription.status,
			plan: subscription.plan,
			trialEnd: subscription.trialEnd,
		});

		const now = new Date();
		const trialEndDate = subscription.trialEnd
			? new Date(subscription.trialEnd)
			: null;
		const isTrialActive = trialEndDate ? trialEndDate > now : false;

		// Se a subscription está cancelada mas o trial ainda está ativo, retornar os dados
		// Só retornar null se estiver cancelada E não houver trial ativo
		if (subscription.status === "canceled" && !isTrialActive) {
			console.log(
				`[getStudentSubscription] Subscription cancelada e trial expirado, retornando null`,
			);
			return null;
		}
		const daysRemaining = trialEndDate
			? Math.max(
					0,
					Math.ceil(
						(trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
					),
				)
			: null;

		// Inferir billingPeriod baseado na diferença entre currentPeriodStart e currentPeriodEnd
		// Se a diferença for aproximadamente 1 ano (330-370 dias), é anual
		// Caso contrário, assume mensal (padrão)
		const periodStart = new Date(subscription.currentPeriodStart);
		const periodEnd = new Date(subscription.currentPeriodEnd);
		const daysDiff = Math.ceil(
			(periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
		);
		const billingPeriod: "monthly" | "annual" =
			daysDiff >= 330 && daysDiff <= 370 ? "annual" : "monthly";

		return {
			id: subscription.id,
			plan: subscription.plan,
			status: subscription.status,
			currentPeriodStart: subscription.currentPeriodStart,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
			canceledAt: subscription.canceledAt,
			trialStart: subscription.trialStart,
			trialEnd: subscription.trialEnd,
			isTrial: isTrialActive,
			daysRemaining,
			billingPeriod,
		};
	} catch (error) {
		console.error("Erro ao buscar assinatura:", error);
		return null;
	}
}

export async function startStudentTrial() {
	try {
		const cookieStore = await cookies();
		// Verificar ambos os cookies: auth_token (legacy) e better-auth.session_token (Better Auth)
		const sessionToken =
			cookieStore.get("auth_token")?.value ||
			cookieStore.get("better-auth.session_token")?.value;

		if (!sessionToken) {
			return { error: "Não autenticado" };
		}

		const session = await getSession(sessionToken);
		if (!session) {
			return { error: "Sessão inválida" };
		}

		// Se for ADMIN, garantir que tenha perfil de student
		let studentId: string | null = null;
		if (session.user.role === "ADMIN") {
			const existingStudent = await db.student.findUnique({
				where: { userId: session.user.id },
			});

			if (!existingStudent) {
				const newStudent = await db.student.create({
					data: {
						userId: session.user.id,
					},
				});
				studentId = newStudent.id;
			} else {
				studentId = existingStudent.id;
			}
		} else if (session.user.student?.id) {
			studentId = session.user.student.id;
		}

		if (!studentId) {
			return { error: "Aluno não encontrado" };
		}

		const existingSubscription = await db.subscription.findUnique({
			where: { studentId },
		});

		if (existingSubscription) {
			const now = new Date();
			const trialEndDate = existingSubscription.trialEnd
				? new Date(existingSubscription.trialEnd)
				: null;
			const isTrialActive = trialEndDate ? trialEndDate > now : false;

			// Se está cancelada e o trial expirou, permitir criar nova
			if (existingSubscription.status === "canceled" && !isTrialActive) {
				// Deletar a subscription cancelada para permitir criar nova
				await db.subscription.delete({
					where: { id: existingSubscription.id },
				});
			} else if (existingSubscription.status === "canceled" && isTrialActive) {
				// Se está cancelada mas trial ainda ativo, reativar
				const trialEnd = new Date(now);
				trialEnd.setDate(trialEnd.getDate() + 14);

				const updatedSubscription = await db.subscription.update({
					where: { id: existingSubscription.id },
					data: {
						status: "trialing",
						canceledAt: null,
						cancelAtPeriodEnd: false,
						trialStart: now,
						trialEnd: trialEnd,
						currentPeriodStart: now,
						currentPeriodEnd: trialEnd,
					},
				});

				return { success: true, subscription: updatedSubscription };
			} else if (isTrialActive) {
				// Se já existe trial ativo, retornar sucesso com a assinatura existente
				return { success: true, subscription: existingSubscription };
			} else {
				// Se já existe e está ativa, retornar erro
				return {
					error:
						"Você já possui uma assinatura. Gerencie sua assinatura na página de pagamentos.",
				};
			}
		}

		const now = new Date();
		const trialEnd = new Date(now);
		trialEnd.setDate(trialEnd.getDate() + 14);

		const subscription = await db.subscription.create({
			data: {
				studentId,
				plan: "premium",
				status: "trialing",
				currentPeriodStart: now,
				currentPeriodEnd: trialEnd,
				trialStart: now,
				trialEnd: trialEnd,
			},
		});

		return { success: true, subscription };
	} catch (error) {
		console.error("Erro ao iniciar trial:", error);
		return { error: "Erro ao iniciar trial" };
	}
}
