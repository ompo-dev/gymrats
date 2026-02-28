import { NextResponse } from "next/server";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";
import { gymMembersQuerySchema, createGymMemberSchema } from "@/lib/api/schemas/gyms.schemas";

// GET — listar membros da academia (com suporte a ?status= e ?search=)
export const GET = createSafeHandler(
  async ({ query, gymContext }) => {
    const { gymId } = gymContext!;
    const memberships = await GymDomainService.getMembers(gymId, query);
    return NextResponse.json({ members: memberships });
  },
  {
    auth: "gym",
    schema: { query: gymMembersQuerySchema },
  }
);

// POST — matricular aluno
export const POST = createSafeHandler(
  async ({ body, gymContext }) => {
    const { gymId } = gymContext!;
    try {
      const membership = await GymDomainService.enrollStudent(gymId, body);
      // Se a academia for Enterprise, aluno recebe Premium de aluno grátis
      await GymSubscriptionService.syncStudentEnterpriseBenefit(body.studentId);
      return NextResponse.json({ success: true, membership }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao matricular aluno";
      const status = message === "Aluno não encontrado" ? 404 :
                    message === "Aluno já está matriculado" ? 409 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  },
  {
    auth: "gym",
    schema: { body: createGymMemberSchema },
  }
);
