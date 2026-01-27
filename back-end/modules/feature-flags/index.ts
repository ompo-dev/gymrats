import { setFeatureRule } from "@packages/shared/feature-flags";

export function registerFeatureFlag(
  featureId: string,
  allowedPlans: string[]
) {
  setFeatureRule(featureId, allowedPlans);
}
