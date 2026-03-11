"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

export interface PersonalStudentSearchResult {
  found: boolean;
  assignedGymIds?: string[];
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    currentLevel?: number;
    currentStreak?: number;
  };
}

interface PersonalDirectoryState {
  studentSearchResult: PersonalStudentSearchResult | null;
  isSearchingStudents: boolean;
  searchStudentByIdentifier: (identifier: string) => Promise<void>;
  clearStudentSearchResult: () => void;
}

export const usePersonalDirectoryStore = create<PersonalDirectoryState>()(
  (set) => ({
    studentSearchResult: null,
    isSearchingStudents: false,

    searchStudentByIdentifier: async (identifier) => {
      const trimmed = identifier.trim();
      if (!trimmed) {
        set({ studentSearchResult: null });
        return;
      }

      const normalizedIdentifier = trimmed.startsWith("@")
        ? trimmed
        : `@${trimmed}`;
      if (normalizedIdentifier.length < 3) {
        set({ studentSearchResult: null });
        return;
      }

      set({ isSearchingStudents: true, studentSearchResult: null });
      try {
        const response = await apiClient.get<PersonalStudentSearchResult>(
          `/api/personals/students/search?email=${encodeURIComponent(normalizedIdentifier)}`,
        );
        set({ studentSearchResult: response.data });
      } catch {
        set({ studentSearchResult: null });
      } finally {
        set({ isSearchingStudents: false });
      }
    },

    clearStudentSearchResult: () => {
      set({ studentSearchResult: null });
    },
  }),
);
