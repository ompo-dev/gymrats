"use client";

import { ChevronRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";

type PersonalAssignment = {
  id: string;
  personal: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  } | null;
};

export function MyPersonalsCard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<PersonalAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDiscoverPersonals = () => {
    router.push("/student?tab=personals");
  };

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ personals: PersonalAssignment[] }>("/api/students/personals")
      .then((res) => {
        if (!cancelled) {
          setAssignments(res.data.personals || []);
        }
      })
      .catch(() => {
        if (!cancelled) setAssignments([]);
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
            <Users className="h-5 w-5 text-duo-purple" />
            <h2 className="font-bold text-duo-fg">Meus Personais</h2>
          </div>
        </DuoCard.Header>
        <p className="text-sm text-duo-fg-muted py-4">Carregando...</p>
      </DuoCard.Root>
    );
  }

  if (assignments.length === 0) {
    return (
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-duo-purple" />
            <h2 className="font-bold text-duo-fg">Meus Personais</h2>
          </div>
          <DuoButton size="sm" variant="outline" onClick={handleDiscoverPersonals}>
            Encontrar personais
            <ChevronRight className="h-4 w-4" />
          </DuoButton>
        </DuoCard.Header>
        <p className="text-sm text-duo-fg-muted py-4">
          Você ainda não tem personais atribuídos. Sua academia pode atribuir um
          personal a você ou você pode encontrar e contratar um.
        </p>
      </DuoCard.Root>
    );
  }

  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-duo-purple" />
          <h2 className="font-bold text-duo-fg">Meus Personais</h2>
        </div>
        <DuoButton size="sm" variant="outline" onClick={handleDiscoverPersonals}>
          Encontrar mais
          <ChevronRight className="h-4 w-4" />
        </DuoButton>
      </DuoCard.Header>
      <div className="space-y-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-lg border border-duo-border p-3"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <Image
                src={a.personal.avatar || "/placeholder.svg"}
                alt={a.personal.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-duo-fg truncate">
                {a.personal.name}
              </p>
              <p className="text-xs text-duo-fg-muted truncate">
                {a.personal.email}
              </p>
              {a.gym && (
                <p className="text-xs text-duo-fg-muted mt-0.5">
                  via {a.gym.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DuoCard.Root>
  );
}
