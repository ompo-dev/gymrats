import { getObservabilitySummary } from "./queries";

export async function ErrorKpi() {
  const summary = await getObservabilitySummary();
  const errorRate =
    summary.api.requestCount > 0
      ? Math.round((summary.api.errorCount / summary.api.requestCount) * 1000) /
        10
      : 0;

  return (
    <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
      <p className="text-sm text-duo-gray-dark">Errors</p>
      <p className="text-3xl font-bold text-duo-text">
        {summary.api.errorCount}
      </p>
      <p className="text-xs text-duo-gray-dark">
        Taxa {errorRate}% · Frontend {summary.counts.frontendEvents}
      </p>
    </div>
  );
}
