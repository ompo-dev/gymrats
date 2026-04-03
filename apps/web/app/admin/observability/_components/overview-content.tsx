import { Suspense } from "react";
import Link from "next/link";
import { ErrorKpi } from "./error-kpi";
import { CacheKpi } from "./cache-kpi";
import { KpiSkeleton } from "./kpi-skeleton";
import { RealtimeEventFeed } from "./realtime-event-feed";
import { RequestKpi } from "./request-kpi";
import { getObservabilitySummary, getObservabilityRequests } from "./queries";
import { WebVitalsKpi } from "./web-vitals-kpi";

export async function ObservabilityOverviewContent() {
  const [summary, requests] = await Promise.all([
    getObservabilitySummary(),
    getObservabilityRequests(8),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-duo-text">
              Observability
            </h1>
            <p className="text-sm text-duo-gray-dark">
              Últimas {summary.windowHours} horas com streaming, cache, requests
              e web vitals.
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link
              className="rounded-full border border-duo-border px-3 py-1 text-duo-text transition hover:border-duo-accent"
              href="/admin/observability/overview"
            >
              Overview
            </Link>
            <Link
              className="rounded-full border border-duo-border px-3 py-1 text-duo-text transition hover:border-duo-accent"
              href="/admin/observability/requests"
            >
              Requests
            </Link>
          </nav>
        </div>
        {summary.note ? (
          <p className="text-xs text-duo-accent">{summary.note}</p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<KpiSkeleton />}>
          <RequestKpi />
        </Suspense>
        <Suspense fallback={<KpiSkeleton />}>
          <ErrorKpi />
        </Suspense>
        <Suspense fallback={<KpiSkeleton />}>
          <CacheKpi />
        </Suspense>
        <Suspense fallback={<KpiSkeleton />}>
          <WebVitalsKpi />
        </Suspense>
      </section>

      <RealtimeEventFeed />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-duo-text">
              Top requests lentas
            </h2>
            <Link
              className="text-xs text-duo-accent hover:underline"
              href="/admin/observability/requests"
            >
              Ver tudo
            </Link>
          </div>
          <div className="space-y-3">
            {requests.requests.map((request) => (
              <Link
                key={request.requestId}
                className="block rounded-xl border border-duo-border/70 px-3 py-2 transition hover:border-duo-accent"
                href={`/admin/observability/requests/${request.requestId}`}
              >
                <p className="font-medium text-duo-text">
                  {request.method} {request.route}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  {request.totalMs}ms · status {request.status} · DB{" "}
                  {request.dbQueryCount} queries · cache {request.cacheHits}/
                  {request.cacheMisses}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">
            Web vitals recentes
          </h2>
          <div className="space-y-3">
            {summary.webVitals.metrics.slice(0, 6).map((metric) => (
              <div
                key={metric.metric}
                className="rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <p className="font-medium text-duo-text">
                  {metric.metric.toUpperCase()}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  p75 {metric.p75} · p95 {metric.p95} · amostras {metric.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
