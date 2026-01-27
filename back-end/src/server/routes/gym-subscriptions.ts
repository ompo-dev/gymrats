import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import {
  cancelGymSubscriptionHandler,
  createGymSubscriptionHandler,
  getCurrentGymSubscriptionHandler,
  startGymTrialHandler,
} from "../handlers/gym-subscriptions";

export const gymSubscriptionsRoutes = new Elysia()
  .use(authRolesMacro)
  .get(
    "/current",
    ({ set, userId }) => getCurrentGymSubscriptionHandler({ set, userId }),
    { requireGym: true }
  )
  .post(
    "/create",
    ({ set, body, userId }) => createGymSubscriptionHandler({ set, body, userId }),
    { requireGym: true }
  )
  .post(
    "/start-trial",
    ({ set, userId }) => startGymTrialHandler({ set, userId }),
    { requireGym: true }
  )
  .post(
    "/cancel",
    ({ set, userId }) => cancelGymSubscriptionHandler({ set, userId }),
    { requireGym: true }
  );
