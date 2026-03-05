"use client";

import { Building2, ChevronRight, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";

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
          setMemberships(res.data.memberships || []);
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
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-duo-border p-3"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-duo-border">
              <Image
                src={m.gym.logo || m.gym.image || "/placeholder.svg"}
                alt={m.gym.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-duo-fg truncate">
                {m.gym.name}
              </p>
              {m.gym.address && (
                <p className="text-xs text-duo-fg-muted truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {m.gym.address}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    m.status === "active"
                      ? "bg-duo-green/10 text-duo-green"
                      : "bg-duo-yellow/10 text-duo-yellow",
                  )}
                >
                  {m.status === "active" ? "Ativa" : "Pendente"}
                </span>
                {m.plan && (
                  <span className="text-xs text-duo-fg-muted">
                    {m.plan.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DuoCard.Root>
  );
}
