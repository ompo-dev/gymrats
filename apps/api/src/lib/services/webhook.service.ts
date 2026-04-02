import { db } from "@/lib/db";
import { log } from "@/lib/observability";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { ReferralService } from "@/lib/services/referral.service";

type AbacatePayMetadata = Record<
  string,
  string | number | boolean | null | undefined
>;

interface AbacatePayWebhookPayload {
  pixQrCode?: {
    id?: string;
    amount?: number;
    metadata?: AbacatePayMetadata | null;
  } | null;
  billing?: {
    id?: string;
    amount?: number;
    metadata?: AbacatePayMetadata | null;
    payment?: { method?: string | null } | null;
    customer?: { id?: string | null } | null;
  } | null;
  payment?: { amount?: number | null } | null;
}

/**
 * Lógica pesada de processamento de Webhooks movida para o Worker BullMQ.
 * Centraliza as transações no banco, cálculos de comissão e atualizações de planos.
 */
export class WebhookService {
  static async processAbacatePayEvent(
    event: string,
    data: AbacatePayWebhookPayload,
  ): Promise<void> {
    if (event !== "billing.paid") {
      log.debug("[WebhookService] Evento ignorado", { event });
      return;
    }

    const pixQrCode = data.pixQrCode;
    const billing = data.billing;
    const paymentId = pixQrCode?.id ?? billing?.id;
    const amount =
      data.payment?.amount ?? billing?.amount ?? pixQrCode?.amount ?? 0;
    const metadata = billing?.metadata ?? pixQrCode?.metadata ?? {};
    const kind = typeof metadata.kind === "string" ? metadata.kind : undefined;
    const metadataStudentId =
      typeof metadata.studentId === "string" ? metadata.studentId : undefined;
    const metadataBillingPeriod =
      metadata.billingPeriod === "annual" ? "annual" : "monthly";

    if (!paymentId) {
      log.error("[WebhookService] billing.paid sem id em billing ou pixQrCode");
      return;
    }

    // --- 0. Tentar Payment (membership-payment ou membership-change-plan) ---
    const payment = await db.payment.findUnique({
      where: { abacatePayBillingId: paymentId },
      include: { plan: true },
    });

    if (
      payment &&
      (payment.status === "pending" || payment.status === "overdue") &&
      ((payment.kind && payment.kind.startsWith("membership_")) ||
        kind === "membership-payment" ||
        kind === "membership-change-plan" ||
        payment.reference?.startsWith("membership:"))
    ) {
      const normalizedKind =
        payment.kind ??
        (kind === "membership-change-plan"
          ? "membership_change_plan"
          : "membership_initial");

      if (
        payment.kind !== normalizedKind ||
        (!payment.membershipId && typeof metadata.membershipId === "string")
      ) {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            kind: normalizedKind,
            membershipId:
              payment.membershipId ??
              (typeof metadata.membershipId === "string"
                ? metadata.membershipId
                : null),
          },
        });
      }

      await GymDomainService.settlePayment(payment.gymId, payment.id);
      log.info("[WebhookService] Membership payment regularizado via webhook", {
        paymentId: payment.id,
      });
      await GymSubscriptionService.syncStudentEnterpriseBenefit(payment.studentId);
      return;
    }

    // Idempotência
    if (payment && payment.status === "paid") return;

    // --- 1. Tentar GymSubscription ---
    const gymSub = await db.gymSubscription.findFirst({
      where: { abacatePayBillingId: paymentId },
      include: { gym: { select: { userId: true } } },
    });

    if (gymSub) {
      const now = new Date();
      const periodEnd = new Date(now);
      const isAnnual = gymSub.billingPeriod === "annual";
      if (isAnnual) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

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
        await GymSubscriptionService.restoreSubscriptionsSuspendedByPrincipalCancel(
          gymSub.gym.userId,
        );
      } else {
        await GymSubscriptionService.suspendOtherGymsBecausePrincipalDowngraded(
          gymSub.gym.userId,
          gymSub.gymId,
        );
      }
      await GymSubscriptionService.handleGymDowngrade(gymSub.gymId);

      log.info("[WebhookService] Processando indicacao GYM", {
        gymId: gymSub.gymId,
        amount,
      });
      await ReferralService.onFirstPaymentConfirmed(
        "GYM",
        gymSub.gymId,
        amount,
        paymentId,
      );
      return;
    }

    // --- 1.5. Tentar PersonalSubscription ---
    const personalSub = await db.personalSubscription.findFirst({
      where: { abacatePayBillingId: paymentId },
      include: { personal: true },
    });

    if (personalSub && personalSub.status === "pending_payment") {
      const now = new Date();
      const periodEnd = new Date(now);
      const isAnnual = personalSub.billingPeriod === "annual";
      if (isAnnual) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);

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
      log.info("[WebhookService] PersonalSubscription ativada", {
        personalSubscriptionId: personalSub.id,
      });
      return;
    }

    if (personalSub && personalSub.status === "active") return;

    // --- 2. Tentar Subscription (aluno) ---
    let subscription = await db.subscription.findUnique({
      where: { abacatePayBillingId: paymentId },
      include: { student: true },
    });

    if (!subscription && metadataStudentId) {
      subscription = await db.subscription.findUnique({
        where: { studentId: metadataStudentId },
        include: { student: true },
      });
    }

    if (!subscription) {
      // --- 3. Tentar BoostCampaign ---
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
        log.info("[WebhookService] BoostCampaign ativada via PIX", {
          boostCampaignId: boostCampaign.id,
        });
        return;
      }

      // --- 4. Tentar PersonalStudentPayment ---
      if (kind === "personal-subscription") {
        const personalPayment = await db.personalStudentPayment.findFirst({
          where: { abacatePayBillingId: paymentId, status: "pending" },
        });

        if (personalPayment) {
          let assignment = await db.studentPersonalAssignment.findFirst({
            where: {
              studentId: personalPayment.studentId,
              personalId: personalPayment.personalId,
              gymId: null,
            },
          });

          if (assignment) {
            assignment = await db.studentPersonalAssignment.update({
              where: { id: assignment.id },
              data: { status: "active" },
            });
          } else {
            assignment = await db.studentPersonalAssignment.create({
              data: {
                studentId: personalPayment.studentId,
                personalId: personalPayment.personalId,
                gymId: null,
                assignedBy: "PERSONAL",
                status: "active",
              },
            });
          }

          await db.personalStudentPayment.update({
            where: { id: personalPayment.id },
            data: { status: "paid", assignmentId: assignment.id },
          });

          log.info("[WebhookService] PersonalStudentPayment pago", {
            personalStudentPaymentId: personalPayment.id,
          });
          return;
        }
      }

      log.error("[WebhookService] Registro nao encontrado para paymentId", {
        paymentId,
      });
      return;
    }

    // --- Concluir Subscription Aluno ---
    const now = new Date();
    const periodEnd = new Date(now);
    const isAnnual = metadataBillingPeriod === "annual";
    const planType =
      typeof metadata.planId === "string" &&
      metadata.planId.toLowerCase() === "pro"
        ? "Pro"
        : "Premium";

    if (isAnnual) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updatedPlanName = `${planType} ${isAnnual ? "Anual" : "Mensal"}`;

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: updatedPlanName,
        billingPeriod: metadataBillingPeriod,
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

    log.info("[WebhookService] Assinatura do aluno atualizada", {
      studentId: subscription.studentId,
      updatedPlanName,
    });
    log.info("[WebhookService] Processando indicacao STUDENT", {
      studentId: subscription.studentId,
      amount,
    });

    await ReferralService.onFirstPaymentConfirmed(
      "STUDENT",
      subscription.studentId,
      amount,
      paymentId,
    );
  }
}
