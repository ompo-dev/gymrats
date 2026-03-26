import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createPersonalStatsFixture } from "@/components/screens/personal";
import { PersonalStatsPage } from "./personal-stats";

const meta = {
  title: "Organisms/Personal/PersonalStatsPage",
  component: PersonalStatsPage,
  args: createPersonalStatsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalStatsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Academias/i)).toBeVisible();
    await expect(canvas.getByText(/Alunos/i)).toBeVisible();
  },
};

export const IndependentOnly: Story = {
  args: createPersonalStatsFixture({
    gyms: 0,
    students: 8,
    studentsViaGym: 0,
    independentStudents: 8,
  }),
};
