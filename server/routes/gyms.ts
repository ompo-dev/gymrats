import { Elysia } from "elysia";
import { authMacro } from "../plugins/auth-macro";
import {
  createGymHandler,
  getGymLocationsHandler,
  getGymProfileHandler,
  listGymsHandler,
  setActiveGymHandler,
} from "../handlers/gyms";

export const gymsRoutes = new Elysia()
  .use(authMacro)
  .get(
    "/list",
    ({ set, userId }) => listGymsHandler({ set, userId }),
    { auth: true }
  )
  .post(
    "/create",
    ({ set, body, userId }) => createGymHandler({ set, body, userId }),
    { auth: true }
  )
  .get(
    "/profile",
    ({ set, userId }) => getGymProfileHandler({ set, userId }),
    { auth: true }
  )
  .post(
    "/set-active",
    ({ set, body, userId }) => setActiveGymHandler({ set, body, userId }),
    { auth: true }
  )
  .get("/locations", ({ set, query }) => getGymLocationsHandler({ set, query }));
