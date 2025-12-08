"use client";

import { useQuery } from "@tanstack/react-query";
import { getStudentProgress } from "@/app/student/actions";

export function useStudentProgress() {
  return useQuery({
    queryKey: ["student-progress"],
    queryFn: getStudentProgress,
    staleTime: 1000 * 60 * 5,
  });
}
