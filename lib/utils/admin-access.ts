import { db } from "@/lib/db";
import { getSession } from "./session";

/**
 * Helper para obter acesso de gym para admins
 * Se o usuário for ADMIN e não tiver perfil de gym, cria um automaticamente
 */
export async function getGymAccessForAdmin(
	sessionToken: string,
): Promise<{ gymId: string; isAdmin: boolean } | null> {
	const session = await getSession(sessionToken);
	if (!session) {
		return null;
	}

	const user = session.user;

	// Se for ADMIN, garantir que tenha acesso a gym
	if (user.role === "ADMIN") {
		// Verificar se já tem perfil de gym
		if (user.gym?.id) {
			return { gymId: user.gym.id, isAdmin: true };
		}

		// Se não tem, criar perfil de gym para o admin
		const existingGym = await db.gym.findUnique({
			where: { userId: user.id },
		});

		if (existingGym) {
			return { gymId: existingGym.id, isAdmin: true };
		}

		// Criar perfil de gym para o admin
		const gym = await db.gym.create({
			data: {
				userId: user.id,
				name: user.name,
				address: "",
				phone: "",
				email: user.email,
				plan: "basic",
			},
		});

		return { gymId: gym.id, isAdmin: true };
	}

	// Se não for admin, verificar se tem perfil de gym normal
	if (user.gym?.id) {
		return { gymId: user.gym.id, isAdmin: false };
	}

	return null;
}

/**
 * Helper para obter acesso de student para admins
 * Se o usuário for ADMIN e não tiver perfil de student, cria um automaticamente
 */
export async function getStudentAccessForAdmin(
	sessionToken: string,
): Promise<{ studentId: string; isAdmin: boolean } | null> {
	const session = await getSession(sessionToken);
	if (!session) {
		return null;
	}

	const user = session.user;

	// Se for ADMIN, garantir que tenha acesso a student
	if (user.role === "ADMIN") {
		// Verificar se já tem perfil de student
		if (user.student?.id) {
			return { studentId: user.student.id, isAdmin: true };
		}

		// Se não tem, criar perfil de student para o admin
		const existingStudent = await db.student.findUnique({
			where: { userId: user.id },
		});

		if (existingStudent) {
			return { studentId: existingStudent.id, isAdmin: true };
		}

		// Criar perfil de student para o admin
		const student = await db.student.create({
			data: {
				userId: user.id,
			},
		});

		return { studentId: student.id, isAdmin: true };
	}

	// Se não for admin, verificar se tem perfil de student normal
	if (user.student?.id) {
		return { studentId: user.student.id, isAdmin: false };
	}

	return null;
}

/**
 * Verifica se o usuário tem permissão de admin
 */
export async function isAdmin(sessionToken: string): Promise<boolean> {
	const session = await getSession(sessionToken);
	return session?.user?.role === "ADMIN";
}
