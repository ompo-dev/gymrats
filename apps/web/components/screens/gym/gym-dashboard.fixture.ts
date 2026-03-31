"use client";

import type {
  CheckIn,
  Equipment,
  GymProfile,
  GymStats,
  StudentData,
} from "@/lib/types";
import type { GymDashboardScreenProps } from "./gym-dashboard.screen";

export function createGymDashboardFixture(
  overrides: Partial<GymDashboardScreenProps> = {},
): GymDashboardScreenProps {
  const students = [
    {
      id: "student-1",
      name: "Ana Souza",
      avatar: "/placeholder.svg",
      attendanceRate: 92,
      totalVisits: 28,
    } as StudentData,
    {
      id: "student-2",
      name: "Marcos Lima",
      avatar: "/placeholder.svg",
      attendanceRate: 87,
      totalVisits: 24,
    } as StudentData,
  ];

  const equipment = [
    {
      id: "equipment-1",
      name: "Bike Indoor 07",
      status: "in-use",
      currentUser: {
        studentId: "student-1",
        studentName: "Ana Souza",
        startTime: new Date(Date.now() - 15 * 60 * 1000),
      },
    } as Equipment,
    {
      id: "equipment-2",
      name: "Leg Press 45",
      status: "maintenance",
    } as Equipment,
    {
      id: "equipment-3",
      name: "Supino Inclinado",
      status: "available",
    } as Equipment,
  ];

  const recentCheckIns = [
    {
      id: "checkin-1",
      studentId: "student-1",
      studentName: "Ana Souza",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    } as CheckIn,
    {
      id: "checkin-2",
      studentId: "student-2",
      studentName: "Marcos Lima",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
    } as CheckIn,
  ];

  return {
    profile: {
      id: "gym-profile-1",
      name: "GymRats Paulista",
      totalStudents: 164,
    } as GymProfile,
    stats: {
      today: {
        checkins: 48,
        peakHour: "18:00",
        activeStudents: 39,
        equipmentInUse: 11,
      },
      week: {
        newMembers: 6,
        totalCheckins: 298,
        avgDailyCheckins: 43,
      },
      month: {
        retentionRate: 88,
        topStudents: students.map((student, index) => ({
          id: student.id,
          name: student.name,
          avatar: student.avatar,
          totalVisits: 20 - index * 3,
          attendanceRate: student.attendanceRate,
        })),
      },
    } as GymStats,
    students,
    equipment,
    recentCheckIns,
    subscription: {
      id: "subscription-1",
      plan: "premium",
      status: "active",
      currentPeriodEnd: new Date("2026-04-20T00:00:00.000Z"),
    },
    onOpenCheckIn: () => undefined,
    ...overrides,
  };
}
