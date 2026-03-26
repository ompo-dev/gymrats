import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps } from "react";
import { expect, within } from "storybook/test";
import { createGymSettingsFixture } from "@/components/screens/gym";
import { GymSettingsPage } from "./gym-settings";

type GymSettingsPageProps = ComponentProps<typeof GymSettingsPage>;

function createGymSettingsPageFixture(
  overrides: Partial<GymSettingsPageProps> = {},
): GymSettingsPageProps {
  const screenArgs = createGymSettingsFixture();

  return {
    profile: {
      id: "gym-1",
      name: screenArgs.profile.name,
      email: screenArgs.profile.email,
      plan: screenArgs.profile.plan,
      address: screenArgs.info.address,
      phone: screenArgs.info.phone,
      cnpj: screenArgs.info.cnpj,
      pixKeyType: screenArgs.info.pixKeyType,
      pixKey: screenArgs.info.pixKey,
      totalStudents: 164,
      activeStudents: 147,
      equipmentCount: 58,
      createdAt: new Date("2025-01-10T12:00:00.000Z"),
      gamification: {
        enabled: true,
        xpMultiplier: 1,
      },
      openingHours: {
        open: "06:00",
        close: "22:00",
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ],
        byDay: {
          monday: screenArgs.daySchedules.monday,
          tuesday: screenArgs.daySchedules.tuesday,
          wednesday: screenArgs.daySchedules.wednesday,
          thursday: screenArgs.daySchedules.thursday,
          friday: screenArgs.daySchedules.friday,
          saturday: screenArgs.daySchedules.saturday,
        },
      },
    } as unknown as GymSettingsPageProps["profile"],
    plans: [],
    ...overrides,
  };
}

const meta = {
  title: "Organisms/Gym/GymSettingsPage",
  component: GymSettingsPage,
  args: createGymSettingsPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymSettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Configuracoes da Academia/i)).toBeVisible();
    await expect(canvas.getByText(/Planos de Matricula/i)).toBeVisible();
  },
};
