"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { GymStudentDetail } from "@/components/organisms/gym/gym-student-detail";
import type { Payment, StudentData } from "@/lib/types";
import {
  getPersonalStudentById,
  getPersonalStudentPayments,
} from "../../actions";

export default function PersonalStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [fullStudent, studentPayments] = await Promise.all([
          getPersonalStudentById(id),
          getPersonalStudentPayments(id),
        ]);
        if (!cancelled) {
          setStudent(fullStudent ?? null);
          setPayments(studentPayments ?? []);
        }
      } catch {
        if (!cancelled) setStudent(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading && !student) {
    return (
      <div className="flex min-h-[300px] items-center justify-center px-4 py-6">
        <Loader2 className="h-10 w-10 animate-spin text-duo-gray-dark" />
      </div>
    );
  }

  if (!student) {
    router.replace("/personal?tab=students");
    return null;
  }

  return (
    <GymStudentDetail
      student={student}
      payments={payments}
      onBack={() => router.push("/personal?tab=students")}
      variant="personal"
    />
  );
}
