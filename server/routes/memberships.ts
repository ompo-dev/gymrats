import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import { getMembershipsHandler } from "../handlers/payments";

export const membershipsRoutes = new Elysia()
  .use(authRolesMacro)
  .get(
    "/",
    ({ set, studentId }) => getMembershipsHandler({ set, studentId }),
    { requireStudent: true }
  );
