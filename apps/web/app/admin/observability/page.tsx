import { featureFlags } from "@gymrats/config";
import { serverApiGet } from "@/lib/api/server";
import { getCurrentUserInfo } from "@/app/student/actions";

export const dynamic = "force-dynamic";

type ObservabilitySummary = {
  windowHours: number;
  counts: {
    telemetryEvents: number;
    frontendEvents: number;
    businessEvents: number;
  };
  api: {
    requestCount: number;
    errorCount: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
  };
  domains: Array<{
    domain: string;
    total: number;
    errors: number;
    apiRequests: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    domain: string;
    status?: string | null;
    occurredAt: string;
    metricName?: string | null;
    metricValue?: number | null;
  }>;
  recentBusinessEvents: Array<{
    id: string;
    eventType: string;
    domain: string;
    status?: string | null;
    occurredAt: string;
  }>;
  note?: string;
};

async function getSummary() {
  try {
    return await serverApiGet<ObservabilitySummary>(
      "/api/admin/observability/summary?sinceHours=24",
    );
  } catch {
    return null;
  }
}

export default async function AdminObservabilityPage() {
  if (!featureFlags.observabilityDashboardEnabled) {
    return <div className="p-6 text-sm text-duo-gray-dark">Dashboard desabilitado.</div>;
  }

  const user = await getCurrentUserInfo();
  if (!user.isAdmin) {
    return <div className="p-6 text-sm text-duo-gray-dark">Acesso restrito a administradores.</div>;
  }

  const summary = await getSummary();

  if (!summary) {
    return <div className="p-6 text-sm text-duo-gray-dark">Nao foi possivel carregar a observabilidade.</div>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-duo-text">Observability</h1>
        <p className="text-sm text-duo-gray-dark">
          Ultimas {summary.windowHours} horas com comparativo rapido de API e frontend.
        </p>
        {summary.note ? (
          <p className="text-xs text-duo-accent">{summary.note}</p>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">API requests</p>
          <p className="text-3xl font-bold text-duo-text">{summary.api.requestCount}</p>
          <p className="text-xs text-duo-gray-dark">
            p50 {summary.api.p50LatencyMs}ms · p95 {summary.api.p95LatencyMs}ms
          </p>
        </div>
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Frontend events</p>
          <p className="text-3xl font-bold text-duo-text">
            {summary.counts.frontendEvents}
          </p>
          <p className="text-xs text-duo-gray-dark">
            Telemetry total {summary.counts.telemetryEvents}
          </p>
        </div>
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Business events</p>
          <p className="text-3xl font-bold text-duo-text">
            {summary.counts.businessEvents}
          </p>
          <p className="text-xs text-duo-gray-dark">
            Errors {summary.api.errorCount} · Avg {summary.api.avgLatencyMs}ms
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">Domains</h2>
          <div className="space-y-3">
            {summary.domains.map((domain) => (
              <div
                key={domain.domain}
                className="flex items-center justify-between rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-duo-text">{domain.domain}</p>
                  <p className="text-xs text-duo-gray-dark">
                    {domain.apiRequests} API requests · {domain.errors} errors
                  </p>
                </div>
                <p className="text-sm font-semibold text-duo-text">{domain.total}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">Recent telemetry</h2>
          <div className="space-y-3">
            {summary.recentEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <p className="font-medium text-duo-text">
                  {event.eventType} · {event.domain}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  {event.metricName ? `${event.metricName}: ${event.metricValue ?? 0}` : event.status || "ok"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
