import { apiApp } from "./app";

// Inicializa os Workers do BullMQ assim que o servidor iniciar
import "./workers/email.worker";
import "./workers/webhook.worker";

const port = Number(process.env.PORT || 3000);

apiApp.listen(port);

console.log(
  `🦊 Elysia is running at ${apiApp.server?.hostname}:${apiApp.server?.port}`,
);
