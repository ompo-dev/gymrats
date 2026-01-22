import { Elysia } from "elysia";
import { authMacro } from "../plugins/auth-macro";
import { addPaymentMethodHandler, getPaymentMethodsHandler } from "../handlers/payments";

export const paymentMethodsRoutes = new Elysia()
  .use(authMacro)
  .get(
    "/",
    ({ set, userId }) => getPaymentMethodsHandler({ set, userId }),
    { auth: true }
  )
  .post(
    "/",
    ({ set, body, userId }) => addPaymentMethodHandler({ set, body, userId }),
    { auth: true }
  );
