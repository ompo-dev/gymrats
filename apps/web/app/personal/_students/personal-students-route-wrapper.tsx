"use client";

import type { StudentData } from "@/lib/types";
import type { PersonalAffiliation, PersonalStudentAssignment } from "../types";
import { PersonalStudentsPageContent } from "./page-content";

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
