export type TelemetryEventInput = {
  eventType: string;
  domain: string;
  actorId?: string | null;
  journey?: string | null;
  requestId?: string | null;
  releaseId?: string | null;
  featureFlagSet?: string[];
  metricName?: string | null;
  metricValue?: number | null;
  status?: string | null;
  payload?: unknown;
  occurredAt?: Date;
};
