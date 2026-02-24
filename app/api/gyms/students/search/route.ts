import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGymContext } from "@/lib/utils/gym-context";

export async function GET(request: NextRequest) {
	try {
		const { ctx, errorResponse } = await getGymContext();
		if (errorResponse) return errorResponse;

		const { activeGymId } = ctx.user; // Use from context


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
							where: { gymId: ctx.gymId },
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
