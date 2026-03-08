"use client";

import { Building2, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import { AcademyListItemCard } from "@/components/organisms/sections/list-item-cards";
import { apiClient } from "@/lib/api/client";

type MembershipData = {
  id: string;
  status: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
    address?: string | null;
  };
  plan: {
    id: string;
    name: string;
    type: string;
    price: number;
  } | null;
};

export function MyAcademiasCard() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<MembershipData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleViewAcademias = () => {
    router.push("/student?tab=gyms");
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ memberships: MembershipData[] }>("/api/students/memberships")
      .then((res) => {
        if (!cancelled) {
          const raw = res.data.memberships || [];
          // Deduplica por academia (mantém apenas a mais recente de cada)
          const seen = new Set<string>();
          const unique = raw.filter((m) => {
            if (seen.has(m.gym.id)) return false;
            seen.add(m.gym.id);
            return true;
          });
          setMemberships(unique);
        }
      })
      .catch(() => {
        if (!cancelled) setMemberships([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-duo-blue" />
            <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
          </div>
        </DuoCard.Header>
        <p className="text-sm text-duo-fg-muted py-4">Carregando...</p>
      </DuoCard.Root>
    );
  }

  if (memberships.length === 0) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-duo-blue" />
            <h2 className="font-bold text-duo-fg">Minhas Academias</h2>
          </div>
          <DuoButton
            size="sm"
            variant="outline"
            onClick={handleViewAcademias}
          >
            Encontrar academias
            <ChevronRight className="h-4 w-4" />
          </DuoButton>
        </DuoCard.Header>
        <p className="text-sm text-duo-fg-muted py-4">
          Você ainda não está matriculado em nenhuma academia. Explore e
          encontre a academia ideal para você.
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
        {memberships.map((m) => (
          <AcademyListItemCard
            key={m.id}
            image={m.gym.logo || m.gym.image || "/placeholder.svg"}
            name={m.gym.name}
            onClick={handleViewAcademias}
            badge={{
              label: m.status === "active" ? "ATIVA" : "PENDENTE",
              variant: m.status === "active" ? "green" : "yellow",
            }}
            planName={m.plan?.name}
            address={m.gym.address ?? undefined}
          />
        ))}
      </div>
    </DuoCard.Root>
  );
}
