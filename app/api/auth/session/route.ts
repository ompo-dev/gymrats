import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { db } from "@/lib/db";
import { getSessionUseCase } from "@/lib/use-cases/auth";
import { getSession } from "@/lib/utils/session";
import {
  getBillingPeriodFromPlan,
  hasActivePremiumStatus,
  isPremiumPlan,
} from "@/lib/utils/subscription";

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
              student: { select: { id: true } },
              gyms: { select: { id: true } },
            },
          }),
        getSessionTokenById: async (sessionId) => {
          const sessionFromDb = await db.session.findUnique({
            where: { id: sessionId },
            select: { token: true },
          });
          return sessionFromDb?.token || null;
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

    // Buscar dados da subscription para enriquecer a sessão
    // studentId vem do getSessionUseCase, evitando query extra de student
    let subscriptionData: {
      plan: string;
      status: string;
      billingPeriod: "monthly" | "annual";
      isPremium: boolean;
    } | null = null;

    const studentId = result.data.studentId;
    if (result.data.user.hasStudent && studentId) {
      const subscription = await db.subscription.findUnique({
        where: { studentId },
        select: {
          plan: true,
          status: true,
          trialEnd: true,
        },
      });

      if (subscription && isPremiumPlan(subscription.plan)) {
        subscriptionData = {
          plan: subscription.plan,
          status: subscription.status,
          billingPeriod: getBillingPeriodFromPlan(subscription.plan),
          isPremium: hasActivePremiumStatus(subscription),
        };
      }
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
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Erro ao buscar sessão:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao buscar sessão";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
