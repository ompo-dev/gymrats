import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/utils/session";

export type StudentContext = {
	studentId: string;
	session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
	user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];
	student: NonNullable<Awaited<ReturnType<typeof db.student.findUnique>>>;
};

type StudentContextResult =
	| { ctx: StudentContext; error?: undefined }
	| { ctx?: undefined; error: string };

export async function getStudentContext(): Promise<StudentContextResult> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get("auth_token")?.value;

	if (!sessionToken) {
		return { error: "Não autenticado. Por favor, faça login." };
	}

	const session = await getSession(sessionToken);
	if (!session) {
		return { error: "Sessão inválida. Por favor, faça login novamente." };
	}

	if (session.user.role !== "STUDENT") {
		return { error: "Acesso disponível apenas para alunos." };
	}

	const student = await db.student.findUnique({
		where: { userId: session.user.id },
	});

	if (!student) {
		return { error: "Perfil de aluno não encontrado." };
	}

	return {
		ctx: {
			studentId: student.id,
			session,
			user: session.user,
			student,
		},
	};
}
