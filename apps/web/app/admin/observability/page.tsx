import { Suspense } from "react";
import { connection } from "next/server";
import { requireProtectedRouteAccess } from "@/lib/auth/server-route-guard";
import { ObservabilityOverviewContent } from "./_components/overview-content";

async function AdminObservabilityPageContent() {
  await connection();
  await requireProtectedRouteAccess("/admin/observability");

  return <ObservabilityOverviewContent />;
}

export default function AdminObservabilityPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-duo-gray-dark">
          Carregando observabilidade...
        </div>
      }
    >
      <AdminObservabilityPageContent />
    </Suspense>
  );
}
