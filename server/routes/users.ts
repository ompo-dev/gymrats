import { Elysia } from "elysia";
import { db } from "@/lib/db";
import { initializeGymTrial, initializeStudentTrial } from "@/lib/utils/auto-trial";
import { updateUserRoleSchema } from "@/lib/api/schemas";
import { validateBody } from "../utils/validation";
import {
  badRequestResponse,
  internalErrorResponse,
} from "../utils/response";

export const usersRoutes = new Elysia().post("/update-role", async ({ body, set }) => {
  const validation = validateBody(body, updateUserRoleSchema);
  if (!validation.success) {
    return badRequestResponse(
      set,
      `Erros de validação: ${validation.errors.join("; ")}`,
      { errors: validation.errors }
    );
  }

  try {
    const { userId, role } = validation.data;
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { role: role as "STUDENT" | "GYM" },
    });

    if (role === "STUDENT") {
      const existingStudent = await db.student.findUnique({
        where: { userId },
      });

      const student =
        existingStudent ??
        (await db.student.create({
          data: { userId },
        }));

      await initializeStudentTrial(student.id);
    } else if (role === "GYM") {
      const existingGym = await db.gym.findFirst({
        where: { userId },
      });

      const gym =
        existingGym ??
        (await db.gym.create({
          data: {
            userId,
            name: updatedUser.name,
            address: "",
            phone: "",
            email: updatedUser.email,
          },
        }));

      await initializeGymTrial(gym.id);
    }

    return {
      success: true,
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
      },
    };
  } catch (error) {
    console.error("Erro ao atualizar role:", error);
    return internalErrorResponse(set, "Erro ao atualizar tipo de usuário", error);
  }
});
