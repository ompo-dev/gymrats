import { abacatePay } from "@gymrats/api/abacatepay";
import { parseJsonSafe } from "@gymrats/domain/json";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { log } from "@/lib/observability";
import { webhookQueue } from "@/lib/queue/queues";
import { auditLog } from "@/lib/security/audit-log";
import { claimWebhookReplayKey } from "@/lib/security/webhook-replay";
import type { NextRequest } from "@/runtime/next-server";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-webhook-signature");
    const rawBody = await request.text();

    if (!signature) {
      log.warn("[Webhook] Tentativa de acesso sem assinatura");
      await auditLog({
        action: "PAYMENT:WEBHOOK",
        request,
        payload: {
          path: request.nextUrl.pathname,
          reason: "missing_signature",
        },
        result: "FAILURE",
      });
      return badRequestResponse("Missing webhook signature");
    }

    const isSignatureValid = abacatePay.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isSignatureValid) {
      log.warn("[Webhook] Assinatura criptografica invalida");
      await auditLog({
        action: "PAYMENT:WEBHOOK",
        request,
        payload: {
          path: request.nextUrl.pathname,
          reason: "invalid_signature",
        },
        result: "FAILURE",
      });
      return badRequestResponse("Invalid cryptographic signature");
    }

    const isFirstDelivery = await claimWebhookReplayKey(signature, rawBody);
    if (!isFirstDelivery) {
      await auditLog({
        action: "PAYMENT:WEBHOOK",
        request,
        payload: {
          path: request.nextUrl.pathname,
          replay: true,
        },
        result: "SUCCESS",
      });
      return successResponse({ received: true, replay: true });
    }

    const body = parseJsonSafe<{
      event?: string;
      data?: Record<string, unknown>;
    }>(rawBody);

    if (!body?.event || !body.data || typeof body.data !== "object") {
      await auditLog({
        action: "PAYMENT:WEBHOOK",
        request,
        payload: {
          path: request.nextUrl.pathname,
          reason: "invalid_json",
        },
        result: "FAILURE",
      });
      return badRequestResponse("Invalid webhook payload");
    }

    await webhookQueue.add("process-payment", {
      event: body.event,
      data: body.data,
    });

    await auditLog({
      action: "PAYMENT:WEBHOOK",
      request,
      payload: {
        path: request.nextUrl.pathname,
        event: body.event,
      },
      result: "SUCCESS",
    });

    return successResponse({ received: true, queued: true });
  } catch (error) {
    log.error("[Webhook] Erro ao enfileirar webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    return internalErrorResponse("Error enqueuing webhook");
  }
}
