import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { db } from "@/lib/db";
import { getStudentSubscriptionSource } from "@/lib/utils/subscription";
import { NextResponse } from "@/runtime/next-server";

export const GET = createSafeHandler(
  async ({ studentContext }) => {
    const studentId = studentContext!.studentId;
    const subInfo = await getStudentSubscriptionSource(studentId);

    if (subInfo.source === null) {
      return NextResponse.json({ subscription: null });
    }

    const sub = await db.subscription.findUnique({
      where: { studentId },
    });

    const now = new Date();
    const trialEnd = sub?.trialEnd ? new Date(sub.trialEnd) : null;
    const isTrialActive = trialEnd ? trialEnd > now : false;

    let enterpriseGymName: string | undefined;
    if (subInfo.source === "GYM_ENTERPRISE" && subInfo.gymId) {
      const gym = await db.gym.findUnique({
        where: { id: subInfo.gymId },
        select: { name: true },
      });
      enterpriseGymName = gym?.name ?? undefined;
    }

    const isVirtualEnterprise = !sub && subInfo.source === "GYM_ENTERPRISE";
    const virtualPeriodEnd = new Date(now);
    virtualPeriodEnd.setFullYear(virtualPeriodEnd.getFullYear() + 1);
    const canStartTrial = !sub || (sub.plan === "free" && !sub.trialStart);

    let isFirstPayment = true;
    if (sub?.id) {
      const hasEverPaid = await db.subscriptionPayment.count({
        where: {
          subscriptionId: sub.id,
          status: "succeeded",
        },
      });
      isFirstPayment = hasEverPaid === 0;
    }

    if (subInfo.source === "GYM_ENTERPRISE" || isTrialActive) {
      isFirstPayment = true;
    }

    return NextResponse.json({
      subscription: {
        id:
          sub?.id ??
          (isVirtualEnterprise ? "virtual-gym-enterprise" : undefined),
        ...subInfo,
        abacatePayBillingId: sub?.abacatePayBillingId,
        currentPeriodEnd:
          sub?.currentPeriodEnd ??
          (isVirtualEnterprise ? virtualPeriodEnd : undefined),
        currentPeriodStart:
          sub?.currentPeriodStart ?? (isVirtualEnterprise ? now : undefined),
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
        trialStart: sub?.trialStart ?? null,
        trialEnd: sub?.trialEnd ?? null,
        canceledAt: sub?.canceledAt ?? null,
        isTrial: isTrialActive,
        daysRemaining: trialEnd
          ? Math.max(
              0,
              Math.ceil(
                (trialEnd.getTime() - now.getTime()) / (1000 * 3600 * 24),
              ),
            )
          : null,
        enterpriseGymName,
        canStartTrial,
        isFirstPayment,
      },
      isFirstPayment,
    });
  },
  {
    auth: "student",
  },
);
