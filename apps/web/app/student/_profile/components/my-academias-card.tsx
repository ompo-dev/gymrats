"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { AcademyListItemCard } from "@/components/organisms/sections/list-item-cards";
import { useStudentMemberships } from "@/hooks/use-student-bootstrap";

export function MyAcademiasCard() {
  const router = useRouter();
  const { memberships, isLoading } = useStudentMemberships();

  const uniqueMemberships = useMemo(() => {
    const raw = Array.isArray(memberships) ? memberships : [];
    const seen = new Set<string>();
    return raw.filter((membership) => {
      if (seen.has(membership.gymId)) return false;
      seen.add(membership.gymId);
      return true;
    });
  }, [memberships]);

  const loading = isLoading && uniqueMemberships.length === 0;

  const handleViewAcademias = () => {
    router.push("/student?tab=gyms");
  };

  if (loading) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-duo-blue" />
            <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
          </div>
        </DuoCard.Header>
        <p className="py-4 text-sm text-duo-fg-muted">Carregando...</p>
      </DuoCard.Root>
    );
  }

  if (uniqueMemberships.length === 0) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-duo-blue" />
            <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
          </div>
          <DuoButton size="sm" variant="outline" onClick={handleViewAcademias}>
            Encontrar academias
            <ChevronRight className="h-4 w-4" />
          </DuoButton>
        </DuoCard.Header>
        <p className="py-4 text-sm text-duo-fg-muted">
          Voce ainda nao esta matriculado em nenhuma academia. Explore e
          encontre a academia ideal para voce.
        </p>
      </DuoCard.Root>
    );
  }

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-duo-blue" />
          <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
        </div>
        <DuoButton size="sm" variant="outline" onClick={handleViewAcademias}>
          Ver mais
          <ChevronRight className="h-4 w-4" />
        </DuoButton>
      </DuoCard.Header>
      <div className="space-y-3">
        {uniqueMemberships.map((membership) => (
          <AcademyListItemCard
            key={membership.id}
            image={membership.gymLogo || "/placeholder.svg"}
            name={membership.gymName}
            onClick={handleViewAcademias}
            badge={{
              label: membership.status === "active" ? "ATIVA" : "PENDENTE",
              variant: membership.status === "active" ? "green" : "yellow",
            }}
            planName={membership.planName}
            address={membership.gymAddress ?? undefined}
          />
        ))}
      </div>
    </DuoCard.Root>
  );
}
