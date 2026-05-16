import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export async function getUserRole(userId: string): Promise<UserRole | null> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { role: true },
	});

	return user?.role || null;
}

export async function requireRole(
	userId: string,
	requiredRole: UserRole,
): Promise<boolean> {
	const role = await getUserRole(userId);
	return role === requiredRole;
}

export async function requireAnyRole(
	userId: string,
	roles: UserRole[],
): Promise<boolean> {
	const role = await getUserRole(userId);
	return role ? roles.includes(role) : false;
}
