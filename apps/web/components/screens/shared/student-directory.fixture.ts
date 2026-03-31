import type { StudentData } from "@/lib/types";
import type { StudentDirectoryScreenProps } from "./student-directory.screen";

interface StudentDirectoryFixtureOverrides
  extends Partial<StudentDirectoryScreenProps> {}

const baseStudents = [
  {
    id: "student-1",
    name: "Ana Souza",
    email: "ana@gymrats.local",
    avatar: "/placeholder.svg",
    membershipStatus: "active",
    currentStreak: 18,
    attendanceRate: 92,
    totalVisits: 46,
    currentWeight: 62,
    assignedTrainer: "Rafa Moreira",
  },
  {
    id: "student-2",
    name: "Marcos Lima",
    email: "marcos@gymrats.local",
    avatar: "/placeholder.svg",
    membershipStatus: "inactive",
    currentStreak: 4,
    attendanceRate: 55,
    totalVisits: 12,
    currentWeight: 84,
    gymMembership: {
      gymId: "gym-1",
      gymName: "GymRats Paulista",
    },
  },
] as unknown as StudentData[];

export function createStudentDirectoryFixture(
  overrides: StudentDirectoryFixtureOverrides = {},
): StudentDirectoryScreenProps {
  return {
    variant: "gym",
    students: baseStudents,
    searchQuery: "",
    statusFilter: "all",
    networkFilter: "all",
    gymFilter: "all",
    personalAffiliations: [
      { id: "aff-1", gym: { id: "gym-1", name: "GymRats Paulista" } },
      { id: "aff-2", gym: { id: "gym-2", name: "Arena Norte" } },
    ],
    onSearchQueryChange: () => {},
    onStatusFilterChange: () => {},
    onNetworkFilterChange: () => {},
    onGymFilterChange: () => {},
    onAddStudent: () => {},
    onViewStudent: () => {},
    ...overrides,
  };
}
