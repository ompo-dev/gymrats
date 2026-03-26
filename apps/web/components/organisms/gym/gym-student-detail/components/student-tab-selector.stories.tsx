import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { StudentTabSelector } from "./student-tab-selector";

const meta = {
  title: "Organisms/Gym/StudentDetail/StudentTabSelector",
  component: StudentTabSelector,
  tags: ["autodocs"],
  args: {
    activeTab: "overview",
    onTabChange: fn(),
    tabOptions: [
      { value: "overview", label: "Resumo", emoji: "📋" },
      { value: "workouts", label: "Treinos", emoji: "🏋️" },
      { value: "diet", label: "Dieta", emoji: "🥗" },
      { value: "progress", label: "Progresso", emoji: "📈" },
    ],
  },
} satisfies Meta<typeof StudentTabSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Selecione a Categoria/i)).toBeVisible();
    await expect(canvas.getByRole("combobox")).toBeVisible();
  },
};

export const Interactive: Story = {
  args: {
    onTabChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(await canvas.findByText(/Treinos/i));
    await expect(args.onTabChange).toHaveBeenCalledWith("workouts");
  },
};
