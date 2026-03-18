import { type NextRequest, NextResponse } from "@/runtime/next-server";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { getSessionUseCase } from "@/lib/use-cases/auth";
import { getSession } from "@/lib/utils/session";
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
    const authHeaderValue = request.headers.get("authorization");
    const authHeaderToken = authHeaderValue
      ? authHeaderValue.replace(/^Bearer\s+/i, "").trim()
      : null;
    const cookieAuthToken = request.cookies.get("auth_token")?.value || null;
    const cookieBetterAuthToken =
      request.cookies.get("better-auth.session_token")?.value || null;

    const result = await getSessionUseCase(
      {
        getBetterAuthSession: async (headers) =>
          auth.api.getSession({ headers }),
        findUserById: (userId) =>
          db.user.findUnique({
            where: { id: userId },
            include: {
              student: {
                select: {
                  id: true,
                  subscription: {
                    select: {
                      plan: true,
                      status: true,
                      trialEnd: true,
                      currentPeriodEnd: true,
                    },
                  },
                },
              },
              personal: { select: { id: true } },
              gyms: {
                select: {
                  id: true,
                  plan: true,
                  subscription: {
                    select: {
                      plan: true,
                      status: true,
                      currentPeriodEnd: true,
                    },
                  },
                },
              },
            },
          }),
        getSessionTokenById: async (sessionId) => {
          const sessionFromDb = await db.session.findUnique({
            where: { id: sessionId },
            select: { token: true, sessionToken: true },
          });
          return sessionFromDb?.token || sessionFromDb?.sessionToken || null;
        },
        getSessionByToken: getSession,
      },
      {
        headers: request.headers,
        authHeaderToken,
        cookieAuthToken,
        cookieBetterAuthToken,
      },
    );

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
