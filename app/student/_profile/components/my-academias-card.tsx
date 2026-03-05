"use client";

import { ChevronRight, MapPin } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import type { StudentGymMembership } from "@/lib/types";

interface MyAcademiasCardProps {
  memberships?: StudentGymMembership[];
}

export function MyAcademiasCard({ memberships = [] }: MyAcademiasCardProps) {
  const router = useRouter();

  const activeMemberships = memberships.filter(
    (m) => m.status === "active" || m.status === "pending",
  );

  const handleViewAcademias = () => {
    router.push("/student?tab=gyms");
  };

  if (activeMemberships.length === 0) {
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

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-duo-blue" />
          <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
        </div>
        <DuoButton size="sm" variant="outline" onClick={handleViewAcademias}>
          Ver mais
          <ChevronRight className="h-4 w-4" />
        </DuoButton>
      </DuoCard.Header>
      <div className="space-y-3">
        {activeMemberships.map((m) => (
          <div
            key={m.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-duo-border p-3 transition-all hover:border-duo-blue/40"
            onClick={() => router.push(`/student?tab=gyms&gymId=${m.gymId}`)}
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-duo-border bg-gray-100">
              <Image
                src={m.gymLogo || "/placeholder.svg"}
                alt={m.gymName}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-duo-fg truncate">
                {m.gymName}
              </p>
              <p className="text-xs text-duo-fg-muted truncate">
                {m.planName}
                {m.status === "pending" && " • Pendente"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-duo-gray-dark" />
          </div>
        ))}
      </div>
    </DuoCard.Root>
  );
}
