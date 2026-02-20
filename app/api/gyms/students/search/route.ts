import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export async function GET(request: NextRequest) {
	try {
		const cookieStore = await cookies();
		const sessionToken = cookieStore.get("auth_token")?.value;
		if (!sessionToken) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const session = await getSession(sessionToken);
		if (!session || session.user.role !== "GYM") {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const gymUser = await db.user.findUnique({
			where: { id: session.user.id },
			select: { activeGymId: true },
		});
		if (!gymUser?.activeGymId) {
			return NextResponse.json(
				{ error: "Academia não configurada" },
				{ status: 400 },
			);
		}

		const { searchParams } = new URL(request.url);
		const email = searchParams.get("email")?.toLowerCase().trim();
		if (!email || email.length < 3) {
			return NextResponse.json({ error: "Email inválido" }, { status: 400 });
		}

		const user = await db.user.findFirst({
			where: {
				email: { contains: email, mode: "insensitive" },
				role: "STUDENT",
			},
			include: {
				student: {
					include: {
						profile: true,
						progress: true,
						memberships: {
							where: { gymId: gymUser.activeGymId },
						},
					},
				},
			},
		});

		if (!user?.student) {
			return NextResponse.json({ found: false });
		}

		const isAlreadyMember = user.student.memberships.length > 0;
		const existingMembership = user.student.memberships[0];

		return NextResponse.json({
			found: true,
			isAlreadyMember,
			existingStatus: existingMembership?.status ?? null,
			student: {
				id: user.student.id,
				name: user.name,
				email: user.email,
				avatar: user.student.avatar,
				age: user.student.age,
				gender: user.student.gender,
				phone: user.student.phone,
				fitnessLevel: user.student.profile?.fitnessLevel,
				goals: user.student.profile?.goals
					? (() => {
							try {
								return JSON.parse(user.student!.profile!.goals!);
							} catch {
								return [];
							}
						})()
					: [],
				currentLevel: user.student.progress?.currentLevel ?? 1,
				currentStreak: user.student.progress?.currentStreak ?? 0,
			},
		});
	} catch (error) {
		console.error("[GET /api/gyms/students/search]", error);
		return NextResponse.json({ error: "Erro interno" }, { status: 500 });
	}
}
