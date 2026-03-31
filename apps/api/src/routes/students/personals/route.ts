import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { featureFlags } from "@/lib/feature-flags";
import { StudentPersonalService } from "@/lib/services/personal/student-personal.service";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    if (!featureFlags.personalEnabled) {
      return NextResponse.json(
        { error: "Módulo Personal desabilitado" },
        { status: 503 },
      );
    }
    const studentId = studentContext?.studentId || "";
    const assignments =
      await StudentPersonalService.listPersonalsByStudent(studentId);
    return NextResponse.json({
      personals: assignments.map((a) => ({
        id: a.id,
        personal: {
          id: a.personal.id,
          name: a.personal.name,
          email: a.personal.email,
          avatar: a.personal.avatar,
        },
        gym: a.gym
          ? {
              id: a.gym.id,
              name: a.gym.name,
              image: a.gym.image,
              logo: a.gym.logo,
            }
          : null,
      })),
    });
  },
  { auth: "student" },
);
