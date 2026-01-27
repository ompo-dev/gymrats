/**
 * Server Actions unificadas para Student (proxy do back-end).
 */
"use server";

import { backendGet } from "@/lib/api/backend-client";
import {
  mockPersonalRecords,
  mockUnits,
  mockUserProgress,
  mockWeightHistory,
  mockWorkoutHistory,
} from "@/lib/mock-data";
import { mockGymLocations } from "@/lib/gym-mock-data";

type StudentAllData = Record<string, unknown>;

function getMockData() {
  return {
    user: null,
    profile: null,
    progress: mockUserProgress,
    workouts: mockUnits,
    workoutHistory: mockWorkoutHistory,
    weightHistory: mockWeightHistory,
    personalRecords: mockPersonalRecords,
    gyms: mockGymLocations,
  };
}

export async function getAllStudentData(sections?: string[]) {
  try {
    const params =
      sections && sections.length > 0
        ? `?sections=${encodeURIComponent(sections.join(","))}`
        : "";

    const response = await backendGet<StudentAllData>(
      `/api/students/all${params}`
    );

    if (!response) {
      return getMockData();
    }

    return response;
  } catch (error) {
    console.error("[getAllStudentData] Erro ao buscar dados:", error);
    return getMockData();
  }
}
