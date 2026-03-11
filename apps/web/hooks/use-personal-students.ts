"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePersonal } from "@/hooks/use-personal";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

const FILTER_ALL = "all";
const FILTER_INDEPENDENT = "independent";
const FILTER_VIA_GYM = "via_gym";

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    avatar?: string | null;
    user?: { id?: string; name?: string | null; email?: string | null } | null;
    profile?: unknown;
    progress?: unknown;
    records?: unknown[];
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalGymOption {
  id: string;
  gym: { id: string; name: string };
}

export interface UsePersonalStudentsProps {
  students: PersonalStudentItem[];
  affiliations: PersonalGymOption[];
  onRefresh: () => Promise<void>;
}

export function usePersonalStudents({
  students,
  affiliations,
  onRefresh,
}: UsePersonalStudentsProps) {
  const { toast } = useToast();
  const { actions, loaders } = usePersonal("actions", "loaders");
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [filter, setFilter] = useQueryState(
    "status",
    parseAsString.withDefault(FILTER_ALL),
  );
  const [gymIdFilter, setGymIdFilter] = useState<string>("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useQueryState("studentId", parseAsString);
  const [fetchedAssignment, setFetchedAssignment] =
    useState<PersonalStudentItem | null>(null);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);

  const selectedAssignmentFromList = useMemo(
    () =>
      studentId
        ? students.find((s) => s?.student?.id === studentId) ?? null
        : null,
    [studentId, students],
  );

  const selectedAssignment =
    selectedAssignmentFromList ?? (studentId ? fetchedAssignment : null);

  useEffect(() => {
    if (!studentId || selectedAssignmentFromList) {
      setFetchedAssignment(null);
      return;
    }
    let cancelled = false;
    setIsLoadingAssignment(true);
    setFetchedAssignment(null);
    apiClient
      .get<{ assignment?: PersonalStudentItem }>(
        `/api/personals/students/${studentId}`,
      )
      .then((response) => {
        if (cancelled) return;
        if (response.data.assignment) {
          setFetchedAssignment(response.data.assignment);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAssignment(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, selectedAssignmentFromList]);

  const filteredStudents = useMemo(
    () =>
      students.filter((item) => {
        if (!item?.student) return false;
        const name = item.student?.user?.name ?? "";
        const email = item.student?.user?.email ?? "";
        const searchLower = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !searchLower ||
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
        if (filter === FILTER_INDEPENDENT) return !item.gym?.id;
        if (filter === FILTER_VIA_GYM && gymIdFilter)
          return item.gym?.id === gymIdFilter;
        return true;
      }),
    [students, searchQuery, filter, gymIdFilter],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      setRemovingId(id);
      try {
        await actions.removeStudent(id);
        await loaders.loadSection("students");
        toast({
          title: "Vínculo removido",
          description: "O aluno deixou de estar atribuído a você.",
        });
        await onRefresh();
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error
            : err instanceof Error
              ? err.message
              : "Erro ao remover";
        toast({
          variant: "destructive",
          title: "Erro",
          description: String(msg),
        });
      } finally {
        setRemovingId(null);
      }
    },
    [actions, loaders, toast, onRefresh],
  );

  const handleOpenDetail = useCallback((id: string) => {
    setStudentId(id);
  }, [setStudentId]);

  const handleBack = useCallback(() => {
    setStudentId(null);
  }, [setStudentId]);

  const setFilterAll = useCallback(() => {
    setFilter(FILTER_ALL);
  }, [setFilter]);

  const setFilterIndependent = useCallback(() => {
    setFilter(FILTER_INDEPENDENT);
    setGymIdFilter("");
  }, [setFilter]);

  const setFilterViaGym = useCallback(() => {
    setFilter(FILTER_VIA_GYM);
  }, [setFilter]);

  return {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    gymIdFilter,
    setGymIdFilter,
    setFilterAll,
    setFilterIndependent,
    setFilterViaGym,
    assignModalOpen,
    setAssignModalOpen,
    removingId,
    studentId,
    setStudentId,
    selectedAssignment,
    isLoadingAssignment,
    filteredStudents,
    handleRemove,
    handleOpenDetail,
    handleBack,
    affiliations,
    FILTER_ALL,
    FILTER_INDEPENDENT,
    FILTER_VIA_GYM,
  };
}
