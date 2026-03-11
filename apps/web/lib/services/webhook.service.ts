import { db } from "@/lib/db";
import { GymSubscriptionService } from "@/lib/services/gym/gym-subscription.service";
import { GymDomainService } from "@/lib/services/gym-domain.service";
import { ReferralService } from "@/lib/services/referral.service";

/**
 * Lógica pesada de processamento de Webhooks movida para o Worker BullMQ.
 * Centraliza as transações no banco, cálculos de comissão e atualizações de planos.
 */
export class WebhookService {
  static async processAbacatePayEvent(event: string, data: any): Promise<void> {
    if (event !== "billing.paid") {
      console.log(`[WebhookService] Evento ignorado: ${event}`);
      return;
    }

    const pixQrCode = data.pixQrCode;
    const billing = data.billing;
    const paymentId = pixQrCode?.id ?? billing?.id;
    const amount = data.payment?.amount ?? billing?.amount ?? pixQrCode?.amount ?? 0;
    const metadata = billing?.metadata ?? pixQrCode?.metadata ?? {};

    if (!paymentId) {
      console.error("[WebhookService] billing.paid sem id em billing ou pixQrCode");
      return;
    }

    // --- 0. Tentar Payment (membership-payment ou membership-change-plan) ---
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
          console.log(`[WebhookService] Membership ${membershipId} ativado via PIX (payment ${payment.id})`);
          await GymDomainService.incrementActiveStudentsOnly(payment.gymId);
          await GymSubscriptionService.syncStudentEnterpriseBenefit(payment.studentId);
          return;
        }
      }

      if (kind === "membership-change-plan") {
        const membershipId = metadata.membershipId as string | undefined;
        const planId = metadata.planId as string | undefined;
        if (membershipId && planId && payment.plan) {
          const now = new Date();
          const nextBillingDate = new Date();
          nextBillingDate.setDate(nextBillingDate.getDate() + payment.plan.duration);
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
          console.log(`[WebhookService] Membership ${membershipId} plano alterado via PIX (payment ${payment.id})`);
          if (payment.studentId) {
            await GymSubscriptionService.syncStudentEnterpriseBenefit(payment.studentId);
          }
          return;
        }
      }
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

      const planQualified = ["premium", "enterprise"].includes(gymSub.plan?.toLowerCase() ?? "");
      if (planQualified) {
        await GymSubscriptionService.restoreSubscriptionsSuspendedByPrincipalCancel(gymSub.gym.userId);
      } else {
        await GymSubscriptionService.suspendOtherGymsBecausePrincipalDowngraded(gymSub.gym.userId, gymSub.gymId);
      }
      await GymSubscriptionService.handleGymDowngrade(gymSub.gymId);

      console.log(`[WebhookService] Processando indicação GYM: ${gymSub.gymId} | Amount: ${amount}`);
      await ReferralService.onFirstPaymentConfirmed("GYM", gymSub.gymId, amount, paymentId);
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
      console.log(`[WebhookService] PersonalSubscription ${personalSub.id} ativada`);
      return;
    }

    if (personalSub && personalSub.status === "active") return;

    // --- 2. Tentar Subscription (aluno) ---
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
      // --- 3. Tentar BoostCampaign ---
      const boostCampaign = await db.boostCampaign.findUnique({
        where: { abacatePayBillingId: paymentId },
      });

      if (boostCampaign && boostCampaign.status === "pending_payment") {
        const now = new Date();
        const endsAt = new Date(now.getTime() + boostCampaign.durationHours * 60 * 60 * 1000);

        await db.boostCampaign.update({
          where: { id: boostCampaign.id },
          data: {
            status: "active",
            startsAt: now,
            endsAt: endsAt,
            updatedAt: now,
          },
        });
        console.log(`[WebhookService] BoostCampaign ${boostCampaign.id} ativada via PIX`);
        return;
      }

      // --- 4. Tentar PersonalStudentPayment ---
      if (metadata.kind === "personal-subscription") {
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

          console.log(`[WebhookService] PersonalStudentPayment ${personalPayment.id} pago`);
          return;
        }
      }

      console.error(`[WebhookService] Registro não encontrado para paymentId: ${paymentId} ou metadata id`);
      return;
    }

    // --- Concluir Subscription Aluno ---
    const now = new Date();
    const periodEnd = new Date(now);
    const isAnnual = metadata.billingPeriod === "annual";
    const planType = typeof metadata.planId === "string" && metadata.planId.toLowerCase() === "pro" ? "Pro" : "Premium";

    if (isAnnual) periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updatedPlanName = `${planType} ${isAnnual ? "Anual" : "Mensal"}`;

    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: updatedPlanName,
        billingPeriod: metadata.billingPeriod,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        abacatePayBillingId: paymentId,
        abacatePayCustomerId: billing?.customer?.id || subscription.abacatePayCustomerId,
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

    console.log(`[WebhookService] Assinatura do aluno ${subscription.studentId} atualizada para ${updatedPlanName}.`);
    console.log(`[WebhookService] Processando indicação STUDENT: ${subscription.studentId} | Amount: ${amount}`);
    
    await ReferralService.onFirstPaymentConfirmed("STUDENT", subscription.studentId, amount, paymentId);
  }
}
