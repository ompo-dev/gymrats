"use client";

import { GymStudentsPage } from "@/components/organisms/gym/gym-students";
import type { StudentData } from "@/lib/types";
import type { PersonalAffiliation } from "../types";

interface PersonalStudentsPageContentProps {
  students: StudentData[];
  affiliations: PersonalAffiliation[];
}

export function PersonalStudentsPageContent({
  students,
  affiliations,
}: PersonalStudentsPageContentProps) {
  const personalAffiliations = affiliations.map((a) => ({
    id: a.id,
    gym: { id: a.gym.id, name: a.gym.name },
  }));

  return (
    <GymStudentsPage
      students={students}
      variant="personal"
      personalAffiliations={personalAffiliations}
    />
  );
}

