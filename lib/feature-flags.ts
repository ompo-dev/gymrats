export const featureFlags = {
  personalEnabled:
    (process.env.NEXT_PUBLIC_PERSONAL_ENABLED ?? "true").toLowerCase() !==
    "false",
  personalBillingEnabled:
    (process.env.NEXT_PUBLIC_PERSONAL_BILLING_ENABLED ?? "true").toLowerCase() !==
    "false",
};

export function ensureFeatureEnabled(flag: boolean, message: string) {
  if (!flag) {
    throw new Error(message);
  }
}
