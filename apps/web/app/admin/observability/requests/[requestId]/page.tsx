import Link from "next/link";
import { connection } from "next/server";
import { requireProtectedRouteAccess } from "@/lib/auth/server-route-guard";
import { getObservabilityRequestTrace } from "../../_components/queries";

type RequestTracePageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export default async function RequestTracePage({
  params,
}: RequestTracePageProps) {
  await connection();
  await requireProtectedRouteAccess("/admin/observability");

  const { requestId } = await params;
  const trace = await getObservabilityRequestTrace(requestId);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-duo-text">Request trace</h1>
            <p className="text-sm text-duo-gray-dark">
              {trace.method} {trace.route} · {trace.status} · {trace.totalMs}ms
            </p>
          </div>
          <Link
            className="rounded-full border border-duo-border px-3 py-1 text-sm text-duo-text transition hover:border-duo-accent"
            href="/admin/observability/requests"
          >
            Voltar
          </Link>
        </div>
        <p className="text-xs text-duo-gray-dark">
          Request ID {trace.requestId} · {trace.occurredAt}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Middleware/Auth</p>
          <p className="text-3xl font-bold text-duo-text">
            {trace.breakdown.middlewareMs + trace.breakdown.authMs}ms
          </p>
          <p className="text-xs text-duo-gray-dark">
            auth {trace.breakdown.authMs}ms
          </p>
        </div>
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Handler</p>
          <p className="text-3xl font-bold text-duo-text">
            {trace.breakdown.handlerMs}ms
          </p>
          <p className="text-xs text-duo-gray-dark">
            response {trace.breakdown.responseMs}ms
          </p>
        </div>
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Database</p>
          <p className="text-3xl font-bold text-duo-text">
            {trace.breakdown.dbMs}ms
          </p>
          <p className="text-xs text-duo-gray-dark">
            {trace.dbQueries.length} queries
          </p>
        </div>
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <p className="text-sm text-duo-gray-dark">Cache/External</p>
          <p className="text-3xl font-bold text-duo-text">
            {trace.breakdown.cacheMs}ms
          </p>
          <p className="text-xs text-duo-gray-dark">
            external {trace.breakdown.externalMs}ms
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">
            DB queries
          </h2>
          <div className="space-y-3">
            {trace.dbQueries.map((query, index) => (
              <div
                key={`${query.sql}-${index}`}
                className="rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <p className="text-xs text-duo-gray-dark">{query.ms}ms</p>
                <p className="mt-1 break-all text-sm text-duo-text">
                  {query.sql}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">
            Cache ops
          </h2>
          <div className="space-y-3">
            {trace.cacheOps.map((operation, index) => (
              <div
                key={`${operation.key}-${index}`}
                className="rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <p className="font-medium text-duo-text">
                  {operation.operation.toUpperCase()} · {operation.key}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  {operation.ms}ms ·{" "}
                  {operation.hit == null ? "n/a" : operation.hit ? "hit" : "miss"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">
            N+1 patterns
          </h2>
          <div className="space-y-3">
            {trace.nPlusOnePatterns.length > 0 ? (
              trace.nPlusOnePatterns.map((pattern) => (
                <div
                  key={pattern.signature}
                  className="rounded-xl border border-duo-border/70 px-3 py-2"
                >
                  <p className="font-medium text-duo-text">{pattern.count}x</p>
                  <p className="mt-1 break-all text-xs text-duo-gray-dark">
                    {pattern.signature}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-duo-border/70 px-3 py-6 text-sm text-duo-gray-dark">
                Nenhum padrão N+1 detectado nesta request.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-duo-border bg-duo-bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold text-duo-text">
            Eventos relacionados
          </h2>
          <div className="space-y-3">
            {trace.events.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-duo-border/70 px-3 py-2"
              >
                <p className="font-medium text-duo-text">
                  {event.eventType} · {event.domain}
                </p>
                <p className="text-xs text-duo-gray-dark">
                  {event.occurredAt}
                  {event.status ? ` · ${event.status}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
