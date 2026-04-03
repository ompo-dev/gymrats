import { getObservabilityCacheSummary } from "./queries";

export async function CacheKpi() {
  const summary = await getObservabilityCacheSummary();

  return (
    <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
      <p className="text-sm text-duo-gray-dark">Cache</p>
      <p className="text-3xl font-bold text-duo-text">
        {Math.round(summary.cache.hitRate * 100)}%
      </p>
      <p className="text-xs text-duo-gray-dark">
        {summary.cache.hits} hits · {summary.cache.misses} misses · média{" "}
        {summary.cache.avgMs}ms
      </p>
    </div>
  );
}
