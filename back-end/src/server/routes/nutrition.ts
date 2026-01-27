import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import {
  getDailyNutritionHandler,
  updateDailyNutritionHandler,
} from "../handlers/nutrition";
import { nutritionChatHandler } from "../handlers/nutrition-ai";

export const nutritionRoutes = new Elysia()
  .use(authRolesMacro)
  .get(
    "/daily",
    ({ set, query, studentId }) =>
      getDailyNutritionHandler({ set, query, studentId }),
    { requireStudent: true }
  )
  .post(
    "/daily",
    ({ set, body, studentId }) =>
      updateDailyNutritionHandler({ set, body, studentId }),
    { requireStudent: true }
  )
  .post(
    "/chat",
    ({ set, body, studentId }) =>
      nutritionChatHandler({ set, body, studentId }),
    { requireStudent: true }
  );
