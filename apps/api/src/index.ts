import { apiApp } from "./app";

process.env.GYMRATS_RUNTIME_ROLE ??= "api";

const port = Number(process.env.PORT || 3000);

apiApp.listen(port);

console.log(
  `[api] Elysia backend listening on ${apiApp.server?.hostname}:${apiApp.server?.port}`,
);
