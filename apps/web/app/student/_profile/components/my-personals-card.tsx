"use client";

import { ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { PersonalListItemCard } from "@/components/organisms/sections/list-item-cards";
import type { StudentPersonalAssignment } from "@/lib/types/student-discovery";
import { useStudentDiscoveryStore } from "@/stores/student-discovery-store";

export function MyPersonalsCard() {
  const router = useRouter();
  const assignments = useStudentDiscoveryStore(
    (state) => state.assignedPersonals as StudentPersonalAssignment[],
  );
  const resource = useStudentDiscoveryStore(
    (state) => state.resources["student:assigned-personals"],
  );
  const loadAssignedPersonals = useStudentDiscoveryStore(
    (state) => state.loadAssignedPersonals,
  );
  const loading =
    assignments.length === 0 && (!resource || resource.status === "loading");

  const handleDiscoverPersonals = () => {
    router.push("/student?tab=personals");
  };

  useEffect(() => {
    if (!resource) {
      void loadAssignedPersonals();
    }
  }, [loadAssignedPersonals, resource]);

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
