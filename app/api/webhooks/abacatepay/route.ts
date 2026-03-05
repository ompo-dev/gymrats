import type { NextRequest } from "next/server";
import { abacatePay } from "@/lib/api/abacatepay";
import {
  badRequestResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api/utils/response.utils";
import { db } from "@/lib/db";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { ReferralService } from "@/lib/services/referral.service";

export async function POST(request: NextRequest) {
  try {
    // 1. Validar Assinatura HMAC (Obrigatório e Seguro)
    const signature = request.headers.get("x-webhook-signature");
    const rawBody = await request.text();

    if (!signature) {
      console.warn("[Webhook] Tentativa de acesso sem HMAC Signature");
      return badRequestResponse("Missing webhook signature");
    }

    const isSignatureValid = abacatePay.verifyWebhookSignature(
      rawBody,
      signature,
    );

    if (!isSignatureValid) {
      console.warn(
        "[Webhook] Falha na verificação criptográfica de assinatura (HMAC).",
      );
      return badRequestResponse("Invalid cryptographic signature");
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    console.log(
      `[Webhook] Evento recebido: ${event}`,
      JSON.stringify(data, null, 2),
    );

    if (event === "billing.paid") {
      // Payload pode vir de billing (checkout) ou pixQrCode (PIX inline)
      const pixQrCode = data.pixQrCode;
      const billing = data.billing;
      const paymentId = pixQrCode?.id ?? billing?.id;
      const amount =
        data.payment?.amount ?? billing?.amount ?? pixQrCode?.amount ?? 0;
      const metadata = billing?.metadata ?? pixQrCode?.metadata ?? {};

      if (!paymentId) {
        console.error("[Webhook] billing.paid sem id em billing ou pixQrCode");
        return successResponse({
          processed: false,
          error: "Missing payment id",
        });
      }

      // 0. Tentar Payment (membership-payment ou membership-change-plan)
      const payment = await db.payment.findUnique({
        where: { abacatePayBillingId: paymentId },
        include: { plan: true },
      });

      if (payment && payment.status === "pending") {
        const kind = metadata.kind as string | undefined;

        if (kind === "membership-payment") {
          const membershipId = metadata.membershipId as string | undefined;
          if (membershipId) {
            const now = new Date();
            await db.$transaction([
              db.payment.update({
                where: { id: payment.id },
                data: { status: "paid", date: now },
              }),
              db.gymMembership.update({
                where: { id: membershipId },
                data: {
                  status: "active",
                  startDate: new Date(),
                  nextBillingDate: payment.dueDate,
                },
              }),
            ]);
            console.log(
              `[Webhook] Membership ${membershipId} ativado via PIX (payment ${payment.id})`,
            );
            await GymDomainService.incrementActiveStudentsOnly(payment.gymId);
            await GymSubscriptionService.syncStudentEnterpriseBenefit(
              payment.studentId,
            );
            return successResponse({
              received: true,
              type: "membership-payment",
            });
          }
        }

        if (kind === "membership-change-plan") {
          const membershipId = metadata.membershipId as string | undefined;
          const planId = metadata.planId as string | undefined;
          if (membershipId && planId && payment.plan) {
            const now = new Date();
            const nextBillingDate = new Date();
            nextBillingDate.setDate(
              nextBillingDate.getDate() + payment.plan.duration,
            );
            await db.$transaction([
              db.payment.update({
                where: { id: payment.id },
                data: { status: "paid", date: now },
              }),
              db.gymMembership.update({
                where: { id: membershipId },
                data: {
                  planId,
                  amount: payment.plan.price,
                  nextBillingDate,
                  status: "active",
                },
              }),
            ]);
            console.log(
              `[Webhook] Membership ${membershipId} plano alterado via PIX (payment ${payment.id})`,
            );
            if (payment.studentId) {
              await GymSubscriptionService.syncStudentEnterpriseBenefit(
                payment.studentId,
              );
            }
            return successResponse({
              received: true,
              type: "membership-change-plan",
            });
          }
        }
      }

      // Idempotência: se Payment já paid, retornar success
      if (payment && payment.status === "paid") {
        return successResponse({
          received: true,
          type: "payment-already-paid",
        });
      }

      // 1. Tentar GymSubscription (abacatePayBillingId armazena billing id ou pix id)
      const gymSub = await db.gymSubscription.findFirst({
        where: { abacatePayBillingId: paymentId },
        include: { gym: { select: { userId: true } } },
      });

      if (gymSub) {
        const now = new Date();
        const periodEnd = new Date(now);
        const isAnnual = gymSub.billingPeriod === "annual";
        if (isAnnual) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db.gymSubscription.update({
          where: { id: gymSub.id },
          data: {
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            canceledBecausePrincipalCanceled: null,
          },
        });

        // Registrar/atualizar pagamento da assinatura da academia.
        // Isso é essencial para regras como "já assinou alguma vez".
        await db.subscriptionPayment.upsert({
          where: { abacatePayBillingId: paymentId },
          update: {
            gymSubscriptionId: gymSub.id,
            amount: amount / 100,
            status: "succeeded",
            paymentMethod: billing?.payment?.method || "pix",
            paidAt: now,
          },
          create: {
            gymSubscriptionId: gymSub.id,
            amount: amount / 100,
            status: "succeeded",
            paymentMethod: billing?.payment?.method || "pix",
            abacatePayBillingId: paymentId,
            paidAt: now,
          },
        });

        const planQualified = ["premium", "enterprise"].includes(
          gymSub.plan?.toLowerCase() ?? "",
        );
        if (planQualified) {
          // Principal voltou a Premium/Enterprise: reativar assinaturas suspensas das outras academias
          await GymSubscriptionService.restoreSubscriptionsSuspendedByPrincipalCancel(
            gymSub.gym.userId,
          );
        } else {
          // Principal assinou Basic: suspender as outras academias (podem ser restauradas depois)
          await GymSubscriptionService.suspendOtherGymsBecausePrincipalDowngraded(
            gymSub.gym.userId,
            gymSub.gymId,
          );
        }
        // Ajustar isActive das academias e benefícios dos alunos
        await GymSubscriptionService.handleGymDowngrade(gymSub.gymId);

        // Lógica de Comissão por Indicação de Academia (50% Referrals)
        console.log(
          `[Webhook] Processando indicação GYM: ${gymSub.gymId} | Amount: ${amount}`,
        );
        await ReferralService.onFirstPaymentConfirmed(
          "GYM",
          gymSub.gymId,
          amount,
          paymentId,
        );

        console.log(
          `[Webhook] GymSubscription ${gymSub.id} (gym ${gymSub.gymId}) ativada: ${gymSub.plan} ${gymSub.billingPeriod}`,
        );
        return successResponse({ received: true, type: "gym" });
      }

      // 1.5. Tentar PersonalSubscription
      const personalSub = await db.personalSubscription.findFirst({
        where: { abacatePayBillingId: paymentId },
        include: { personal: true },
      });

      if (personalSub && personalSub.status === "pending_payment") {
        const now = new Date();
        const periodEnd = new Date(now);
        const isAnnual = personalSub.billingPeriod === "annual";
        if (isAnnual) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await db.personalSubscription.update({
          where: { id: personalSub.id },
          data: {
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
          },
        });

        console.log(
          `[Webhook] PersonalSubscription ${personalSub.id} (personal ${personalSub.personalId}) ativada: ${personalSub.plan} ${personalSub.billingPeriod}`,
        );
        return successResponse({ received: true, type: "personal-subscription" });
      }

      if (personalSub && personalSub.status === "active") {
        return successResponse({
          received: true,
          type: "personal-subscription-already-active",
        });
      }

      // 2. Tentar Subscription (aluno)
      let subscription = await db.subscription.findUnique({
        where: { abacatePayBillingId: paymentId },
        include: { student: true },
      });

      if (!subscription && metadata.studentId) {
        subscription = await db.subscription.findUnique({
          where: { studentId: metadata.studentId },
          include: { student: true },
        });
      }

      if (!subscription) {
        // 3. Tentar BoostCampaign
        const boostCampaign = await db.boostCampaign.findUnique({
          where: { abacatePayBillingId: paymentId },
        });

        if (boostCampaign && boostCampaign.status === "pending_payment") {
          const now = new Date();
          const endsAt = new Date(
            now.getTime() + boostCampaign.durationHours * 60 * 60 * 1000,
          );

          await db.boostCampaign.update({
            where: { id: boostCampaign.id },
            data: {
              status: "active",
              startsAt: now,
              endsAt: endsAt,
              updatedAt: now,
            },
          });

          console.log(
            `[Webhook] BoostCampaign ${boostCampaign.id} ativada via PIX`,
          );
          return successResponse({ received: true, type: "boost-campaign" });
        }

        console.error(
          `[Webhook] Registro não encontrado para paymentId: ${paymentId} ou metadata id`,
        );
        return successResponse({
          processed: false,
          error: "Record not found",
        });
      }

      // Calcular novos períodos
      const now = new Date();
      const periodEnd = new Date(now);
      const isAnnual = metadata.billingPeriod === "annual";
      const planType =
        typeof metadata.planId === "string" &&
        metadata.planId.toLowerCase() === "pro"
          ? "Pro"
          : "Premium";

      if (isAnnual) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Atualizar Subscription
      const updatedPlanName = `${planType} ${isAnnual ? "Anual" : "Mensal"}`;

      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: updatedPlanName,
          billingPeriod: metadata.billingPeriod, // Salva o período do metadata do AbacatePay
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          abacatePayBillingId: paymentId,
          abacatePayCustomerId:
            billing?.customer?.id || subscription.abacatePayCustomerId,
        },
      });

      // Registrar o pagamento
      await db.subscriptionPayment.create({
        data: {
          subscriptionId: subscription.id,
          amount: amount / 100,
          status: "succeeded",
          paymentMethod: billing?.payment?.method || "pix",
          abacatePayBillingId: paymentId,
          paidAt: now,
        },
      });

      console.log(
        `[Webhook] Assinatura do aluno ${subscription.studentId} atualizada para ${updatedPlanName.toUpperCase()}.`,
      );

      // Lógica de Comissão por Indicação de Aluno (50% Referrals)
      console.log(
        `[Webhook] Processando indicação STUDENT: ${subscription.studentId} | Amount: ${amount}`,
      );
      await ReferralService.onFirstPaymentConfirmed(
        "STUDENT",
        subscription.studentId,
        amount,
        paymentId,
      );
      return successResponse({ received: true, type: "student-subscription" });
    }

    return successResponse({ received: true });
  } catch (error) {
    console.error("[Webhook] Erro ao processar webhook:", error);
    return internalErrorResponse("Error processing webhook", error);
  }
}
