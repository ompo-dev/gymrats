import { getEnvBoolean } from "@gymrats/env";

export const featureFlags = {
  personalEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERSONAL_ENABLED,
    true,
  ),
  personalBillingEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERSONAL_BILLING_ENABLED,
    true,
  ),
};

export function ensureFeatureEnabled(flag: boolean, message: string) {
  if (!flag) {
    throw new Error(message);
  }
}
