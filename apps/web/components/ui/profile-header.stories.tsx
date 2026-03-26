import type { Meta, StoryObj } from "@storybook/react";
import { Pencil } from "lucide-react";
import { expect, within } from "storybook/test";
import { DuoButton } from "@/components/duo";
import { ProfileHeader } from "@/components/ui/profile-header";

const meta = {
  title: "UI/ProfileHeader",
  component: ProfileHeader,
  tags: ["autodocs"],
  args: {
    name: "Marina Alves",
    username: "@marina.fit",
    memberSince: "jan/2024",
    stats: {
      workouts: 148,
      streak: 19,
    },
    quickStats: [
      { value: "72 kg", label: "Peso atual" },
      { value: "18%", label: "Gordura", highlighted: true },
      { value: "5x", label: "Freq. semanal" },
      { value: "11", label: "PRs no mes" },
    ],
    quickStatsButtons: (
      <DuoButton variant="outline" className="col-span-2">
        <Pencil className="size-4" />
        Editar perfil
      </DuoButton>
    ),
  },
} satisfies Meta<typeof ProfileHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Marina Alves/i)).toBeVisible();
    await expect(canvas.getByText(/148/i)).toBeVisible();
  },
};
