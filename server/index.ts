import { apiApp } from "./app";

const port = Number(process.env.PORT || 3001);

apiApp.listen(port);

console.log(
  `🦊 Elysia is running at ${apiApp.server?.hostname}:${apiApp.server?.port}`
);
