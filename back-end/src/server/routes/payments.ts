import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import { getPaymentsHandler } from "../handlers/payments";

export const paymentsRoutes = new Elysia()
  .use(authRolesMacro)
  .get(
    "/",
    ({ set, query, studentId }) => getPaymentsHandler({ set, query, studentId }),
    { requireStudent: true }
  );
