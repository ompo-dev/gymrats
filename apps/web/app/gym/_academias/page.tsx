import { Suspense } from "react";
import { AcademiasPageContent } from "./page-content";

export default function AcademiasPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Carregando...
        </div>
      }
    >
      <AcademiasPageContent />
    </Suspense>
  );
}
