import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import type { StudentData } from "@/lib/types";
import { StudentHeaderCard } from "./student-header-card";

const studentFixture = {
  id: "student-ana-01",
  name: "Ana Souza",
  email: "ana@gymrats.local",
  avatar: "/placeholder.svg",
  age: 29,
  gender: "female",
  phone: "(11) 99999-1000",
  membershipStatus: "active",
  joinDate: new Date("2025-09-15T00:00:00.000Z"),
  totalVisits: 84,
  currentStreak: 12,
  profile: {},
  progress: {},
  workoutHistory: [],
  personalRecords: [],
  currentWeight: 62.4,
  weightHistory: [],
  attendanceRate: 92,
  favoriteEquipment: ["Leg Press", "Bike"],
  assignedTrainer: "Rafa Moreira",
  gymMembership: {
    id: "membership-1",
    gymId: "gym-1",
    gymName: "GymRats Paulista",
    gymAddress: "Av. Paulista, 1500",
    planId: "plan-1",
    planName: "Plano Premium",
    planType: "monthly",
    startDate: new Date("2025-09-15T00:00:00.000Z"),
    nextBillingDate: new Date("2026-04-15T00:00:00.000Z"),
    amount: 149.9,
    status: "active",
    autoRenew: true,
    benefits: ["Acesso livre"],
  },
} as unknown as StudentData;

const meta = {
  title: "Organisms/Gym/StudentDetail/StudentHeaderCard",
  component: StudentHeaderCard,
  tags: ["autodocs"],
  args: {
    student: studentFixture,
    membershipStatus: "active",
    isUpdatingStatus: false,
    onMembershipAction: fn(),
    onAssignWorkout: fn(),
    onAssignDiet: fn(),
    onAssignPersonal: fn(),
    isAssigningPersonal: false,
  },
} satisfies Meta<typeof StudentHeaderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ActiveMembership: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Suspender/i }));
    await expect(args.onMembershipAction).toHaveBeenCalledWith("suspended");
  },
};

export const SuspendedMembership: Story = {
  args: {
    membershipStatus: "suspended",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Reativar/i }));
    await expect(args.onMembershipAction).toHaveBeenCalledWith("active");
  },
};
