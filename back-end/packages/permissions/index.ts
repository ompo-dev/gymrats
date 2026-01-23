import { canUseFeatureRule } from "@packages/shared/feature-flags";

export function canUseFeature(featureId: string, plan?: string) {
  return canUseFeatureRule(featureId, plan);
}
