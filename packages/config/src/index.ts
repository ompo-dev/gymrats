import { getEnvBoolean, getEnvString } from "@gymrats/env";

export type FeatureFlags = {
  personalEnabled: boolean;
  personalBillingEnabled: boolean;
  perfStudentBootstrapV2: boolean;
  perfPaymentsV2: boolean;
  perfGymBootstrapV2: boolean;
  perfPersonalBootstrapV2: boolean;
  observabilityDashboardEnabled: boolean;
  observabilityClientEventsEnabled: boolean;
};

const isProductionRuntime = process.env.NODE_ENV === "production";

export const featureFlags: FeatureFlags = {
  personalEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERSONAL_ENABLED,
    true,
  ),
  personalBillingEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERSONAL_BILLING_ENABLED,
    true,
  ),
  perfStudentBootstrapV2: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERF_STUDENT_BOOTSTRAP_V2,
    !isProductionRuntime,
  ),
  perfPaymentsV2: getEnvBoolean(process.env.NEXT_PUBLIC_PERF_PAYMENTS_V2, true),
  perfGymBootstrapV2: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERF_GYM_BOOTSTRAP_V2,
    false,
  ),
  perfPersonalBootstrapV2: getEnvBoolean(
    process.env.NEXT_PUBLIC_PERF_PERSONAL_BOOTSTRAP_V2,
    false,
  ),
  observabilityDashboardEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_OBSERVABILITY_DASHBOARD_ENABLED,
    !isProductionRuntime,
  ),
  observabilityClientEventsEnabled: getEnvBoolean(
    process.env.NEXT_PUBLIC_OBSERVABILITY_CLIENT_EVENTS_ENABLED,
    !isProductionRuntime,
  ),
};

export const releaseInfo = {
  id: getEnvString(process.env.NEXT_PUBLIC_RELEASE_ID, "local-dev"),
  environment: getEnvString(process.env.NODE_ENV, "development"),
};

export function ensureFeatureEnabled(flag: boolean, message: string) {
  if (!flag) {
    throw new Error(message);
  }
}
