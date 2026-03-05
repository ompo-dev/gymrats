"use client";

import { ChevronRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";

export function MyAcademiasCard() {
  const router = useRouter();

  const handleViewAcademias = () => {
    router.push("/student?tab=gyms");
  };

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-duo-blue" />
          <h2 className="font-bold text-duo-fg">Academias</h2>
        </div>
        <DuoButton size="sm" variant="outline" onClick={handleViewAcademias}>
          Ver academias
          <ChevronRight className="h-4 w-4" />
        </DuoButton>
      </DuoCard.Header>
      <p className="text-sm text-duo-fg-muted">
        Encontre academias parceiras, veja planos e assine.
      </p>
    </DuoCard.Root>
  );
}
