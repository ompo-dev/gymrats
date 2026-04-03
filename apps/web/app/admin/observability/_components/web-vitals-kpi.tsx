import { getObservabilityWebVitals } from "./queries";

export async function WebVitalsKpi() {
  const summary = await getObservabilityWebVitals();
  const lcp = summary.webVitals.metrics.find((metric) => metric.metric === "lcp");

  return (
    <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
      <p className="text-sm text-duo-gray-dark">Web Vitals</p>
      <p className="text-3xl font-bold text-duo-text">
        {summary.webVitals.total}
      </p>
      <p className="text-xs text-duo-gray-dark">
        LCP p75 {lcp?.p75 ?? 0}ms · métricas {summary.webVitals.metrics.length}
      </p>
    </div>
  );
}
