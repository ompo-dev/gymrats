import type { NextRequest } from "next/server";
import { abacatePay } from "@/lib/api/abacatepay";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { webhookQueue } from "@/lib/queue/queues";
import { log } from "@/lib/observability";

export async function POST(request: NextRequest) {
  try {
    // 1. Validar Assinatura HMAC (Obrigatório e Seguro)
    const signature = request.headers.get("x-webhook-signature");
    const rawBody = await request.text();

    if (!signature) {
      log.warn("[Webhook] Tentativa de acesso sem HMAC Signature");
      return badRequestResponse("Missing webhook signature");
    }

    const isSignatureValid = abacatePay.verifyWebhookSignature(rawBody, signature);

    if (!isSignatureValid) {
      log.warn("[Webhook] Falha na verificação criptográfica de assinatura (HMAC).");
      return badRequestResponse("Invalid cryptographic signature");
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    log.info(`[Webhook] Evento Recebido Verificado: ${event}`);

    // Em vez de processar todo o fluxo pesado do banco (que arrisca 504 Gateway Timeout),
    // apenas colocamos na fila do Redis via BullMQ, liberando o AbacatePay na hora.
    await webhookQueue.add("process-payment", { event, data });

    return successResponse({ received: true, queued: true });
  } catch (error) {
    log.error("[Webhook] Erro ao enfileirar webhook:", { error });
    return internalErrorResponse("Error enqueuing webhook", error);
  }
}
