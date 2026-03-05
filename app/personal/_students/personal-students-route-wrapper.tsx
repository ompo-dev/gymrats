"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { PersonalStudentsPageContent } from "./page-content";
import type { PersonalAffiliation, PersonalStudentAssignment } from "../types";

export function PersonalStudentsRouteWrapper({
  students,
  affiliations,
}: {
  students: PersonalStudentAssignment[];
  affiliations: PersonalAffiliation[];
}) {
  const router = useRouter();
  const onRefresh = useCallback(async () => {
    router.refresh();
  }, [router]);

  return (
    <PersonalStudentsPageContent
      students={students}
      affiliations={affiliations}
      onRefresh={onRefresh}
    />
  );
}
