"use client";

import { PersonalStudentsPage } from "@/components/organisms/personal";
import type { PersonalAffiliation, PersonalStudentAssignment } from "../types";

interface PersonalStudentsPageContentProps {
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
  onRefresh: () => Promise<void>;
}

export function PersonalStudentsPageContent({
  students,
  affiliations,
  onRefresh,
}: PersonalStudentsPageContentProps) {
  return (
    <PersonalStudentsPage
      students={students}
      affiliations={affiliations}
      onRefresh={onRefresh}
    />
  );
}
