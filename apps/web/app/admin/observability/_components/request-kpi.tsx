import { getObservabilitySummary } from "./queries";

export async function RequestKpi() {
  const summary = await getObservabilitySummary();

  return (
    <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
      <p className="text-sm text-duo-gray-dark">Requests</p>
      <p className="text-3xl font-bold text-duo-text">
        {summary.api.requestCount}
      </p>
      <p className="text-xs text-duo-gray-dark">
        p50 {summary.api.p50LatencyMs}ms · p95 {summary.api.p95LatencyMs}ms
      </p>
    </div>
  );
}
