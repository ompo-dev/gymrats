process.env.GYMRATS_RUNTIME_ROLE ??= "worker";

import "../../api/src/server/workers/email.worker";
import "../../api/src/server/workers/webhook.worker";

console.log("[worker] Email and webhook workers are running");
