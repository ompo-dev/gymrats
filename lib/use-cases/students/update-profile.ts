/**
 * Caso de uso: atualizar perfil do student
 */

import type { z } from "zod";
import { db } from "@/lib/db";
import { initializeStudentTrial } from "@/lib/utils/auto-trial";
import { updateStudentProfileSchema } from "@/lib/api/schemas/students.schemas";

export type UpdateStudentProfileInput = z.infer<
	typeof updateStudentProfileSchema
>;

function toNum(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value === "number") return value;
	const parsed = parseFloat(String(value));
	return Number.isNaN(parsed) ? null : parsed;
}

function toInt(value: unknown): number | null {
	if (value == null) return null;
	if (typeof value === "number") return Math.floor(value);
	const parsed = parseInt(String(value), 10);
	return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Constrói o objeto de dados do perfil para upsert
 */
export function buildProfileData(
	data: UpdateStudentProfileInput,
	studentId: string,
) {
	return {
		studentId,
		height: data.height ? toNum(data.height) : null,
		weight: data.weight ? toNum(data.weight) : null,
		fitnessLevel: data.fitnessLevel || null,
		weeklyWorkoutFrequency: data.weeklyWorkoutFrequency
			? toInt(data.weeklyWorkoutFrequency)
			: null,
		workoutDuration: data.workoutDuration
			? toInt(data.workoutDuration)
			: null,
		goals:
			data.goals && Array.isArray(data.goals)
				? JSON.stringify(data.goals)
				: null,
		injuries:
			data.injuries && Array.isArray(data.injuries)
				? JSON.stringify(data.injuries)
				: null,
		availableEquipment:
			data.availableEquipment && Array.isArray(data.availableEquipment)
				? JSON.stringify(data.availableEquipment)
				: null,
		gymType: data.gymType || null,
		preferredWorkoutTime: data.preferredWorkoutTime || null,
		preferredSets: data.preferredSets ? toInt(data.preferredSets) : null,
		preferredRepRange: data.preferredRepRange || null,
		restTime: data.restTime || null,
		dietType: data.dietType || null,
		allergies:
			data.allergies && Array.isArray(data.allergies)
				? JSON.stringify(data.allergies)
				: null,
		targetCalories: data.targetCalories ? toInt(data.targetCalories) : null,
		targetProtein: data.targetProtein ? toNum(data.targetProtein) : null,
		targetCarbs: data.targetCarbs ? toNum(data.targetCarbs) : null,
		targetFats: data.targetFats ? toNum(data.targetFats) : null,
		mealsPerDay: data.mealsPerDay ? toInt(data.mealsPerDay) : null,
		bmr: data.bmr ? toNum(data.bmr) : null,
		tdee: data.tdee ? toNum(data.tdee) : null,
		activityLevel: data.activityLevel ? toInt(data.activityLevel) : null,
		hormoneTreatmentDuration: data.hormoneTreatmentDuration
			? toInt(data.hormoneTreatmentDuration)
			: null,
		physicalLimitations:
			data.physicalLimitations && Array.isArray(data.physicalLimitations)
				? JSON.stringify(data.physicalLimitations)
				: null,
		motorLimitations:
			data.motorLimitations && Array.isArray(data.motorLimitations)
				? JSON.stringify(data.motorLimitations)
				: null,
		medicalConditions:
			data.medicalConditions && Array.isArray(data.medicalConditions)
				? JSON.stringify(data.medicalConditions)
				: null,
		limitationDetails:
			data.limitationDetails &&
			typeof data.limitationDetails === "object"
				? JSON.stringify(data.limitationDetails)
				: null,
		dailyAvailableHours: data.dailyAvailableHours
			? toNum(data.dailyAvailableHours)
			: null,
	};
}

export interface UpdateStudentProfileDeps {
	userId: string;
	data: UpdateStudentProfileInput;
}

/**
 * Atualiza ou cria student e perfil, inicializa progress e trial
 */
export async function updateStudentProfileUseCase(deps: UpdateStudentProfileDeps) {
	const { userId, data } = deps;

	const user = await db.user.findUnique({
		where: { id: userId },
		include: { student: true },
	});

	if (!user) throw new Error("Usuário não encontrado");
	if (user.role !== "STUDENT") throw new Error("Usuário não é um aluno");

	let student = user.student;
	if (!student) {
		student = await db.student.create({
			data: {
				userId,
				age: data.age ?? undefined,
				gender: data.gender ?? undefined,
				isTrans: data.isTrans ?? false,
				usesHormones: data.usesHormones ?? false,
				hormoneType: data.hormoneType || null,
			},
		});
	} else {
		student = await db.student.update({
			where: { id: student.id },
			data: {
				age: data.age ?? undefined,
				gender: data.gender ?? undefined,
				isTrans: data.isTrans ?? undefined,
				usesHormones: data.usesHormones ?? undefined,
				hormoneType: data.hormoneType ?? undefined,
			},
		});
	}

	const profileData = buildProfileData(data, student.id);

	await db.studentProfile.upsert({
		where: { studentId: student.id },
		create: profileData,
		update: profileData,
	});

	const existingProgress = await db.studentProgress.findUnique({
		where: { studentId: student.id },
	});

	if (!existingProgress) {
		await db.studentProgress.create({
			data: { studentId: student.id },
		});
	}

	await initializeStudentTrial(student.id);

	return { studentId: student.id };
}
