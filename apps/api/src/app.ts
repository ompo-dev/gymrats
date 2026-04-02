import { abacatePay } from "@gymrats/api/abacatepay";
import { webhookQueue } from "@gymrats/cache";
import { parseJsonSafe } from "@gymrats/domain/json";
import { resetStudentWeeklyOverride } from "@gymrats/workflows";
import { log } from "@/lib/observability";
import { auditLog } from "@/lib/security/audit-log";
import { claimWebhookReplayKey } from "@/lib/security/webhook-replay";
import { apiApp as baseApiApp } from "./server/app";

export const apiApp = baseApiApp
  .post("/api/webhooks/abacatepay", async ({ body, request, set }) => {
    try {
      const signature = request.headers.get("x-webhook-signature");
      const path = new URL(request.url).pathname;

      if (!signature) {
        await auditLog({
          action: "PAYMENT:WEBHOOK",
          request: request.headers,
          payload: {
            path,
            reason: "missing_signature",
          },
          result: "FAILURE",
        });
        set.status = 400;
        return { error: "Missing webhook signature" };
      }

      const rawBody =
        typeof body === "string" ? body : JSON.stringify(body ?? {});

      const isSignatureValid = abacatePay.verifyWebhookSignature(
        rawBody,
        signature,
      );

      if (!isSignatureValid) {
        await auditLog({
          action: "PAYMENT:WEBHOOK",
          request: request.headers,
          payload: {
            path,
            reason: "invalid_signature",
          },
          result: "FAILURE",
        });
        set.status = 400;
        return { error: "Invalid cryptographic signature" };
      }

      const isFirstDelivery = await claimWebhookReplayKey(signature, rawBody);
      if (!isFirstDelivery) {
        await auditLog({
          action: "PAYMENT:WEBHOOK",
          request: request.headers,
          payload: {
            path,
            replay: true,
          },
          result: "SUCCESS",
        });
        return { received: true, replay: true };
      }

      const parsedBody =
        typeof body === "string"
          ? parseJsonSafe<{
              event?: string;
              data?: Record<string, unknown>;
            }>(rawBody)
          : ((body ?? {}) as {
              event?: string;
              data?: Record<string, unknown>;
            });

      if (!parsedBody?.event || !parsedBody.data) {
        await auditLog({
          action: "PAYMENT:WEBHOOK",
          request: request.headers,
          payload: {
            path,
            reason: "invalid_json",
          },
          result: "FAILURE",
        });
        set.status = 400;
        return { error: "Invalid webhook payload" };
      }

      await webhookQueue.add("process-payment", {
        event: parsedBody.event ?? "unknown",
        data: parsedBody.data ?? {},
      });

      await auditLog({
        action: "PAYMENT:WEBHOOK",
        request: request.headers,
        payload: {
          path,
          event: parsedBody.event,
        },
        result: "SUCCESS",
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
