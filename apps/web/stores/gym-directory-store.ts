"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api/client";

export interface GymTeamPersonal {
  id: string;
  personal: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface GymPersonalSearchResult {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  alreadyLinked: boolean;
}

export interface GymPersonalProfile {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  atendimentoPresencial: boolean;
  atendimentoRemoto: boolean;
  email?: string;
  phone?: string | null;
  cref?: string | null;
  gyms: { id: string; name: string; address?: string }[];
  studentsCount?: number;
}

export interface GymStudentSearchResult {
  found: boolean;
  isAlreadyMember?: boolean;
  existingStatus?: string;
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
    age?: number | null;
    gender?: string | null;
    fitnessLevel?: string | null;
    goals?: string[];
    currentLevel?: number;
    currentStreak?: number;
  };
}

export interface GymActiveMember {
  id: string;
  name: string;
  avatar?: string | null;
}

interface GymDirectoryState {
  teamPersonals: GymTeamPersonal[];
  teamSearchResults: GymPersonalSearchResult[];
  linkedPersonalSearchResults: GymPersonalSearchResult[];
  personalProfilesById: Record<string, GymPersonalProfile | null>;
  studentSearchResult: GymStudentSearchResult | null;
  activeMembers: GymActiveMember[];
  isLoadingTeam: boolean;
  isSearchingTeam: boolean;
  isSearchingLinkedPersonals: boolean;
  isSearchingStudents: boolean;
  isSearchingActiveMembers: boolean;
  loadingPersonalProfileIds: Record<string, boolean>;
  teamError: string;
  loadTeamPersonals: () => Promise<void>;
  searchTeamPersonals: (query: string) => Promise<void>;
  searchLinkedTeamPersonals: (query: string) => Promise<void>;
  loadPersonalProfile: (personalId: string) => Promise<void>;
  linkTeamPersonal: (personalId: string) => Promise<void>;
  unlinkTeamPersonal: (personalId: string) => Promise<void>;
  searchStudentByIdentifier: (identifier: string) => Promise<void>;
  clearStudentSearchResult: () => void;
  searchActiveMembers: (query: string) => Promise<void>;
  clearActiveMembers: () => void;
  reset: () => void;
}

function markSearchLinked(
  results: GymPersonalSearchResult[],
  personalId: string,
  alreadyLinked: boolean,
) {
  return results.map((result) =>
    result.id === personalId ? { ...result, alreadyLinked } : result,
  );
}

export const useGymDirectoryStore = create<GymDirectoryState>()((set, get) => ({
  teamPersonals: [],
  teamSearchResults: [],
  linkedPersonalSearchResults: [],
  personalProfilesById: {},
  studentSearchResult: null,
  activeMembers: [],
  isLoadingTeam: false,
  isSearchingTeam: false,
  isSearchingLinkedPersonals: false,
  isSearchingStudents: false,
  isSearchingActiveMembers: false,
  loadingPersonalProfileIds: {},
  teamError: "",

  loadTeamPersonals: async () => {
    set({ isLoadingTeam: true, teamError: "" });
    try {
      const response = await apiClient.get<{ personals: GymTeamPersonal[] }>(
        "/api/gym/personals",
      );
      set({ teamPersonals: response.data.personals ?? [] });
    } catch (error) {
      set({
        teamError:
          error instanceof Error ? error.message : "Erro ao carregar equipe",
      });
    } finally {
      set({ isLoadingTeam: false });
    }
  },

  searchTeamPersonals: async (query) => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      set({ teamSearchResults: [] });
      return;
    }
    set({ isSearchingTeam: true });
    try {
      const response = await apiClient.get<{ personals: GymPersonalSearchResult[] }>(
        `/api/gym/personals/search?q=${encodeURIComponent(normalizedQuery)}&limit=8`,
      );
      set({ teamSearchResults: response.data.personals ?? [] });
    } catch {
      set({ teamSearchResults: [] });
    } finally {
      set({ isSearchingTeam: false });
    }
  },

  searchLinkedTeamPersonals: async (query) => {
    const params = new URLSearchParams();
    params.set("linkedOnly", "true");
    params.set("limit", "12");
    if (query.trim()) params.set("q", query.trim());

    set({ isSearchingLinkedPersonals: true });
    try {
      const response = await apiClient.get<{ personals: GymPersonalSearchResult[] }>(
        `/api/gym/personals/search?${params.toString()}`,
      );
      set({ linkedPersonalSearchResults: response.data.personals ?? [] });
    } catch {
      set({ linkedPersonalSearchResults: [] });
    } finally {
      set({ isSearchingLinkedPersonals: false });
    }
  },

  loadPersonalProfile: async (personalId) => {
    set((state) => ({
      loadingPersonalProfileIds: {
        ...state.loadingPersonalProfileIds,
        [personalId]: true,
      },
    }));
    try {
      const response = await apiClient.get<GymPersonalProfile>(
        `/api/gym/personals/${personalId}/profile`,
      );
      set((state) => ({
        personalProfilesById: {
          ...state.personalProfilesById,
          [personalId]: response.data,
        },
      }));
    } catch {
      set((state) => ({
        personalProfilesById: {
          ...state.personalProfilesById,
          [personalId]: null,
        },
      }));
    } finally {
      set((state) => ({
        loadingPersonalProfileIds: {
          ...state.loadingPersonalProfileIds,
          [personalId]: false,
        },
      }));
    }
  },

  linkTeamPersonal: async (personalId) => {
    set({ teamError: "" });
    await apiClient.post("/api/gym/personals", { personalId });
    set((state) => ({
      teamSearchResults: markSearchLinked(state.teamSearchResults, personalId, true),
      linkedPersonalSearchResults: markSearchLinked(
        state.linkedPersonalSearchResults,
        personalId,
        true,
      ),
    }));
    await get().loadTeamPersonals();
  },

  unlinkTeamPersonal: async (personalId) => {
    set({ teamError: "" });
    const previousTeam = get().teamPersonals;
    set((state) => ({
      teamPersonals: state.teamPersonals.filter(
        (item) => item.personal.id !== personalId,
      ),
      teamSearchResults: markSearchLinked(
        state.teamSearchResults,
        personalId,
        false,
      ),
      linkedPersonalSearchResults: markSearchLinked(
        state.linkedPersonalSearchResults,
        personalId,
        false,
      ),
    }));

    try {
      await apiClient.delete("/api/gym/personals", {
        data: { personalId },
      });
    } catch (error) {
      set({
        teamPersonals: previousTeam,
        teamError:
          error instanceof Error ? error.message : "Erro ao remover personal",
      });
      throw error;
    }
  },

  searchStudentByIdentifier: async (identifier) => {
    const normalizedIdentifier = identifier.trim();
    if (normalizedIdentifier.length < 3) {
      set({ studentSearchResult: null });
      return;
    }

    set({ isSearchingStudents: true });
    try {
      const searchQuery = normalizedIdentifier.startsWith("@")
        ? normalizedIdentifier
        : `@${normalizedIdentifier}`;
      const response = await apiClient.get<GymStudentSearchResult>(
        `/api/gyms/students/search?email=${encodeURIComponent(searchQuery)}`,
      );
      set({ studentSearchResult: response.data });
    } catch (error) {
      set({
        studentSearchResult: null,
        teamError:
          error instanceof Error ? error.message : "Erro ao buscar aluno",
      });
    } finally {
      set({ isSearchingStudents: false });
    }
  },

  clearStudentSearchResult: () => {
    set({ studentSearchResult: null, teamError: "" });
  },

  searchActiveMembers: async (query) => {
    if (query.trim().length < 2) {
      set({ activeMembers: [] });
      return;
    }

    set({ isSearchingActiveMembers: true });
    try {
      const response = await apiClient.get<{
        members?: Array<{
          student: {
            id: string;
            avatar?: string | null;
            user?: { name?: string | null } | null;
          };
          studentName?: string;
        }>;
      }>(`/api/gyms/members?status=active&search=${encodeURIComponent(query)}`);

      set({
        activeMembers: (response.data.members ?? []).map((member) => ({
          id: member.student.id,
          name: member.student.user?.name ?? member.studentName ?? "Aluno",
          avatar: member.student.avatar ?? null,
        })),
      });
    } catch {
      set({ activeMembers: [] });
    } finally {
      set({ isSearchingActiveMembers: false });
    }
  },

  clearActiveMembers: () => {
    set({ activeMembers: [] });
  },

  reset: () => {
    set({
      teamPersonals: [],
      teamSearchResults: [],
      linkedPersonalSearchResults: [],
      personalProfilesById: {},
      studentSearchResult: null,
      activeMembers: [],
      isLoadingTeam: false,
      isSearchingTeam: false,
      isSearchingLinkedPersonals: false,
      isSearchingStudents: false,
      isSearchingActiveMembers: false,
      loadingPersonalProfileIds: {},
      teamError: "",
    });
  },
}));
