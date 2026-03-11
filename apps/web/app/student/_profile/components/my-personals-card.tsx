"use client";

import { ChevronRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DuoButton, DuoCard } from "@/components/duo";
import { PersonalListItemCard } from "@/components/organisms/sections/list-item-cards";
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
          <DuoButton
            size="sm"
            variant="outline"
            onClick={handleDiscoverPersonals}
          >
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
        <DuoButton
          size="sm"
          variant="outline"
          onClick={handleDiscoverPersonals}
        >
          Personais
          <ChevronRight className="h-4 w-4" />
        </DuoButton>
      </DuoCard.Header>
      <div className="space-y-3">
        {assignments.map((a) => (
          <PersonalListItemCard
            key={a.id}
            image={a.personal.avatar || "/placeholder.svg"}
            name={a.personal.name}
            onClick={handleDiscoverPersonals}
            badge={{ label: "Atribuído" }}
            email={a.personal.email}
            subtitle={a.gym ? `via ${a.gym.name}` : undefined}
          />
        ))}
      </div>
    </DuoCard.Root>
  );
}
