/**
 * Pure subscription helpers safe for client-side usage.
 */

export function isBasicPlan(plan: string): boolean {
  const normalizedPlan = plan.toLowerCase();
  return (
    normalizedPlan.includes("basic") ||
    normalizedPlan.includes("premium") ||
    normalizedPlan.includes("enterprise") ||
    normalizedPlan.includes("pro")
  );
}

export function isPremiumPlan(plan: string): boolean {
  const normalizedPlan = plan.toLowerCase();
  return (
    normalizedPlan.includes("premium") ||
    normalizedPlan.includes("enterprise") ||
    normalizedPlan.includes("pro")
  );
}

export function hasActivePremiumStatus(subscription: {
  plan: string;
  status: string;
  trialEnd?: Date | string | null;
}): boolean {
  if (!isPremiumPlan(subscription.plan)) {
    return false;
  }

  if (subscription.status === "canceled" || subscription.status === "expired") {
    return false;
  }

  const now = new Date();
  const isTrialActive =
    subscription.trialEnd && new Date(subscription.trialEnd) > now;

  return (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    !!isTrialActive
  );
}

export function getBillingPeriodFromPlan(plan: string): "monthly" | "annual" {
  return plan.toLowerCase().includes("anual") ? "annual" : "monthly";
}
