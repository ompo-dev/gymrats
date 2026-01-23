import { Elysia } from "elysia";
import { authRolesMacro } from "../plugins/auth-roles";
import { searchFoodsHandler, getFoodByIdHandler } from "../handlers/nutrition";
import { uploadFoodsHandler } from "../handlers/foods";

export const foodsRoutes = new Elysia()
  .use(authRolesMacro)
  .get("/search", ({ set, query }) => searchFoodsHandler({ set, query }))
  .get("/:id", ({ set, params }) => getFoodByIdHandler({ set, params }))
  .post(
    "/upload",
    ({ set, request }) => uploadFoodsHandler({ set, request }),
    { requireAdmin: true }
  );
