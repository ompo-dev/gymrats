"use client";

import { useCallback, useEffect, useState } from "react";
import { GymStudentsPage } from "@/components/organisms/gym/gym-students";
import type { PersonalStudentOriginFilter } from "@/components/organisms/gym/gym-students";
import type { StudentData } from "@/lib/types";
import type { PersonalAffiliation } from "../types";
import { getPersonalStudentsAsStudentData } from "../actions";

interface PersonalStudentsPageContentProps {
  students: StudentData[];
  affiliations: PersonalAffiliation[];
}

export function PersonalStudentsPageContent({
  students: initialStudents,
  affiliations,
}: PersonalStudentsPageContentProps) {
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [loading, setLoading] = useState(false);
  const [originFilter, setOriginFilter] =
    useState<PersonalStudentOriginFilter>("all");
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  const gymIdForFetch =
    originFilter === "academia" && selectedGymId
      ? selectedGymId
      : originFilter === "personal"
        ? null
        : undefined;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPersonalStudentsAsStudentData(gymIdForFetch);
      setStudents(data);
    } finally {
      setLoading(false);
    }
  }, [gymIdForFetch]);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  useEffect(() => {
    if (originFilter === "all" && !selectedGymId) {
      setStudents(initialStudents);
      return;
    }
    fetchStudents();
  }, [originFilter, selectedGymId, gymIdForFetch, fetchStudents]);

  const personalAffiliations = affiliations.map((a) => ({
    id: a.id,
    gym: { id: a.gym.id, name: a.gym.name },
  }));

  return (
    <GymStudentsPage
      students={loading ? [] : students}
      variant="personal"
      personalAffiliations={personalAffiliations}
      originFilter={originFilter}
      selectedGymId={selectedGymId}
      onOriginFilterChange={(v) => {
        setOriginFilter(v);
        if (v !== "academia") setSelectedGymId(null);
      }}
      onSelectedGymChange={setSelectedGymId}
    />
  );
}

