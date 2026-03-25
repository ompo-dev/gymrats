import { abacatePay } from "@gymrats/api/abacatepay";
import { webhookQueue } from "@gymrats/cache";
import { resetStudentWeeklyOverride } from "@gymrats/workflows";
import { log } from "@/lib/observability";
import { apiApp as baseApiApp } from "./server/app";

export const apiApp = baseApiApp
  .post("/api/webhooks/abacatepay", async ({ request, set }) => {
    try {
      const signature = request.headers.get("x-webhook-signature");
      const rawBody = await request.text();

      if (!signature) {
        set.status = 400;
        return { error: "Missing webhook signature" };
      }

      const isSignatureValid = abacatePay.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isSignatureValid) {
        set.status = 400;
        return { error: "Invalid cryptographic signature" };
      }

      const body = JSON.parse(rawBody) as {
        event: string;
        data: Record<string, unknown>;
      };

      await webhookQueue.add("process-payment", {
        event: body.event,
        data: body.data,
      });

      return { received: true, queued: true };
    } catch (error) {
      log.error("[Webhook] Erro ao enfileirar webhook", {
        error: error instanceof Error ? error.message : String(error),
      });
      set.status = 500;
      return { error: "Error enqueuing webhook" };
    }
  })
  .get("/api/cron/week-reset", async ({ request, set }) => {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      return await resetStudentWeeklyOverride();
    } catch (error) {
      log.error("[Cron] week-reset failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      set.status = 500;
      return { error: "Internal server error" };
    }
  })
  .get("/healthz", () => ({ status: "ok" }));
