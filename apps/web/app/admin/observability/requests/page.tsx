import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireProtectedRouteAccess } from "@/lib/auth/server-route-guard";
import { getObservabilityRequests } from "../_components/queries";

async function RequestsPageContent() {
  await connection();
  await requireProtectedRouteAccess("/admin/observability");

  const { requests, note } = await getObservabilityRequests(100);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-duo-text">
              Request traces
            </h1>
            <p className="text-sm text-duo-gray-dark">
              Drill-down por request com breakdown de DB, cache e eventos.
            </p>
          </div>
          <Link
            className="rounded-full border border-duo-border px-3 py-1 text-sm text-duo-text transition hover:border-duo-accent"
            href="/admin/observability/overview"
          >
            Voltar ao overview
          </Link>
        </div>
        {note ? <p className="text-xs text-duo-accent">{note}</p> : null}
      </header>

      <section className="overflow-hidden rounded-2xl border border-duo-border bg-duo-bg-card">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_8rem_10rem] gap-3 border-b border-duo-border px-4 py-3 text-xs uppercase tracking-wide text-duo-gray-dark">
          <span>Método</span>
          <span>Rota</span>
          <span>Status</span>
          <span>Total</span>
          <span>DB</span>
          <span>Detalhe</span>
        </div>
        <div className="divide-y divide-duo-border/60">
          {requests.map((request) => (
            <div
              key={request.requestId}
              className="grid grid-cols-[7rem_minmax(0,1fr)_7rem_7rem_8rem_10rem] gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium text-duo-text">{request.method}</span>
              <span className="truncate text-duo-text">{request.route}</span>
              <span className="text-duo-gray-dark">{request.status}</span>
              <span className="text-duo-gray-dark">{request.totalMs}ms</span>
              <span className="text-duo-gray-dark">
                {request.dbQueryCount} q · {request.dbMs}ms
              </span>
              <Link
                className="text-duo-accent hover:underline"
                href={`/admin/observability/requests/${request.requestId}`}
              >
                Abrir trace
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function RequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-duo-gray-dark">
          Carregando requests...
        </div>
      }
    >
      <RequestsPageContent />
    </Suspense>
  );
}
