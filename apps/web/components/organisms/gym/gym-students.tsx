"use client";

import { Loader2 } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { AddPersonalStudentModal } from "@/components/organisms/personal/add-personal-student-modal";
import {
  StudentDirectoryScreen,
  type StudentDirectoryAffiliationOption,
} from "@/components/screens";
import { useGym } from "@/hooks/use-gym";
import { usePersonal } from "@/hooks/use-personal";
import type { MembershipPlan, Payment, StudentData } from "@/lib/types";
import { AddStudentModal } from "./add-student-modal";
import { GymStudentDetail } from "./gym-student-detail";

interface StudentDetailLoaderProps {
  studentId: string;
  fallbackStudent: StudentData | null;
  onBack: () => void;
  variant?: "gym" | "personal";
}

function StudentDetailLoader({
  studentId,
  fallbackStudent,
  onBack,
  variant = "gym",
}: StudentDetailLoaderProps) {
  const gymStudentDetails = useGym("studentDetails");
  const gymStudentPayments = useGym("studentPayments");
  const gymActions = useGym("actions");
  const personalStudentDetails = usePersonal("studentDetails");
  const personalStudentPayments = usePersonal("studentPayments");
  const personalActions = usePersonal("actions");
  const selectedStudentDetails =
    variant === "personal" ? personalStudentDetails : gymStudentDetails;
  const selectedStudentPayments =
    variant === "personal" ? personalStudentPayments : gymStudentPayments;
  const loadStudentDetail =
    variant === "personal"
      ? personalActions.loadStudentDetail
      : gymActions.loadStudentDetail;
  const loadStudentPayments =
    variant === "personal"
      ? personalActions.loadStudentPayments
      : gymActions.loadStudentPayments;
  const student =
    (selectedStudentDetails[studentId] as StudentData | null) ??
    fallbackStudent;
  const payments =
    (selectedStudentPayments[studentId] as Payment[] | undefined) ?? [];
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      try {
        await Promise.all([
          loadStudentDetail(studentId, true),
          loadStudentPayments(studentId, true),
        ]);
      } catch {
        // fallback já vem do store ou prop
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [studentId, loadStudentDetail, loadStudentPayments]);

  if (isLoading && !student) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-duo-gray-dark" />
      </div>
    );
  }

  return (
    <GymStudentDetail
      student={student}
      payments={payments}
      onBack={onBack}
      variant={variant}
    />
  );
}

interface GymStudentsPageProps {
  students?: StudentData[];
  membershipPlans?: MembershipPlan[];
  variant?: "gym" | "personal";
  personalAffiliations?: StudentDirectoryAffiliationOption[];
}

export function GymStudentsPage({
  students = [],
  membershipPlans = [],
  variant = "gym",
  personalAffiliations = [],
}: GymStudentsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("active"),
  );
  const [networkFilter, setNetworkFilter] = useQueryState("network", {
    defaultValue: "all",
  });
  const [gymFilter, setGymFilter] = useQueryState("gym", {
    defaultValue: "all",
  });
  const [studentId, setStudentId] = useQueryState("studentId");

  const safeStudents = Array.isArray(students) ? students : [];
  const filteredStudents = safeStudents.filter((student) => {
    const item = student as {
      name?: string;
      email?: string;
      membershipStatus?: string;
      status?: string;
      student?: { user?: { name?: string; email?: string } };
      gymMembership?: { gymId?: string };
    };

    const name = item.name ?? item.student?.user?.name ?? "";
    const email = item.email ?? item.student?.user?.email ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const status = item.membershipStatus ?? item.status ?? "active";
    const isActive = status === "active";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);

    if (variant === "personal") {
      const studentGymId = item.gymMembership?.gymId;
      const matchesNetwork =
        networkFilter === "all" ||
        (networkFilter === "personal" && !studentGymId) ||
        (networkFilter === "gym" && !!studentGymId);

      const matchesGym =
        networkFilter !== "gym" ||
        gymFilter === "all" ||
        (networkFilter === "gym" && studentGymId === gymFilter);

      return matchesSearch && matchesStatus && matchesNetwork && matchesGym;
    }

    return matchesSearch && matchesStatus;
  });

  if (studentId) {
    return (
      <StudentDetailLoader
        studentId={studentId}
        fallbackStudent={safeStudents.find((student) => student.id === studentId) ?? null}
        onBack={() => setStudentId(null)}
        variant={variant}
      />
    );
  }

  return (
    <>
      <StudentDirectoryScreen
        variant={variant}
        students={filteredStudents}
        searchQuery={searchQuery || ""}
        statusFilter={statusFilter || "all"}
        networkFilter={networkFilter || "all"}
        gymFilter={gymFilter || "all"}
        personalAffiliations={personalAffiliations}
        onSearchQueryChange={(value) => setSearchQuery(value)}
        onStatusFilterChange={(value) =>
          setStatusFilter(value as "all" | "active" | "inactive")
        }
        onNetworkFilterChange={(value) => setNetworkFilter(value)}
        onGymFilterChange={(value) => setGymFilter(value)}
        onAddStudent={() => setIsModalOpen(true)}
        onViewStudent={(value) => setStudentId(value)}
      />

      {variant === "personal" ? (
        <AddPersonalStudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
          }}
          affiliations={personalAffiliations}
        />
      ) : (
        <AddStudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
          membershipPlans={membershipPlans}
        />
      )}
    </>
  );
}
