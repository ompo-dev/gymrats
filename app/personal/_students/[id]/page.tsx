"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { PersonalStudentDetail } from "@/components/organisms/personal/personal-student-detail";
import type { PersonalStudentAssignmentForDetail } from "@/components/organisms/personal/personal-student-detail/hooks/use-personal-student-detail";

export default function PersonalStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] =
    useState<PersonalStudentAssignmentForDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/personals/students/${id}`);
        const data = await res.json();
        if (!cancelled) {
          if (res.ok && data.assignment) {
            setAssignment(data.assignment);
          } else {
            setAssignment(null);
          }
        }
      } catch {
        if (!cancelled) setAssignment(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading && !assignment) {
    return (
      <div className="flex min-h-[300px] items-center justify-center px-4 py-6">
        <Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
      </div>
    );
  }

  if (!assignment) {
    router.replace("/personal?tab=students");
    return null;
  }

  return (
    <PersonalStudentDetail
      studentId={id}
      assignment={assignment}
      onBack={() => router.push("/personal?tab=students")}
    />
  );
}
