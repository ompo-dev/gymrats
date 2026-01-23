import { eventBus } from "@packages/events";

type FeatureUsagePayload = {
  featureId: string;
  userId?: string;
  academyId?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
};

export async function trackFeatureUsage(payload: FeatureUsagePayload) {
  await eventBus.emit("feature.used", {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
