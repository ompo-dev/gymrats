"use client";

import { PersonalStudentsPageContent } from "./page-content";
import type { StudentData } from "@/lib/types";
import type { PersonalAffiliation, PersonalStudentAssignment } from "../types";

export function PersonalStudentsRouteWrapper({
  students,
  affiliations,
}: {
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
}) {
  return (
    <PersonalStudentsPageContent
      students={students as unknown as StudentData[]}
      affiliations={affiliations}
    />
  );
}
