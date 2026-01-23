type FeatureRule = {
  allowedPlans: string[];
};

const featureRules = new Map<string, FeatureRule>();

export function setFeatureRule(featureId: string, allowedPlans: string[]) {
  featureRules.set(featureId, { allowedPlans });
}

export function canUseFeatureRule(featureId: string, plan?: string) {
  const rule = featureRules.get(featureId);
  if (!rule) {
    return true;
  }

  if (!plan) {
    return false;
  }

  return rule.allowedPlans.includes(plan);
}
