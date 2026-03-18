import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { resolveAuthSessionFromRequest } from "@/lib/auth/session-resolver";
import {
  getBillingPeriodFromPlan,
  hasActivePremiumStatus,
  isPremiumPlan,
} from "@/lib/utils/subscription";

type StudentSubscriptionRecord = {
  plan: string;
  status: string;
  trialEnd?: string | Date | null;
  currentPeriodEnd?: string | Date | null;
};

export async function GET(request: NextRequest) {
  try {
    const result = await resolveAuthSessionFromRequest(request);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      );
    }

    const studentSubscription =
      result.data.user.student &&
      typeof result.data.user.student === "object" &&
      "subscription" in result.data.user.student
        ? (result.data.user.student.subscription as
            | StudentSubscriptionRecord
            | null
            | undefined)
        : null;

    let subscriptionData: {
      plan: string;
      status: string;
      billingPeriod: "monthly" | "annual";
      isPremium: boolean;
    } | null = null;

    if (studentSubscription && isPremiumPlan(studentSubscription.plan)) {
      subscriptionData = {
        plan: studentSubscription.plan,
        status: studentSubscription.status,
        billingPeriod: getBillingPeriodFromPlan(studentSubscription.plan),
        isPremium: hasActivePremiumStatus({
          ...studentSubscription,
          trialEnd:
            studentSubscription.trialEnd ??
            studentSubscription.currentPeriodEnd ??
            null,
        }),
      };
    }

    const response = NextResponse.json({
      user: {
        ...result.data.user,
        subscription: subscriptionData,
      },
      session: result.data.session,
    });

    if (result.data.shouldSyncAuthToken && result.data.sessionToken) {
      response.cookies.set("auth_token", result.data.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao buscar sessao:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao buscar sessao";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
