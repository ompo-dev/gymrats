import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { MuscleList } from "./muscle-list";
import { groupedMuscles, muscleGroupLabels, muscleLibrary } from "./muscle-story-fixtures";

const meta = {
  title: "Organisms/Education/Muscle/MuscleList",
  component: MuscleList,
  tags: ["autodocs"],
  args: {
    muscles: muscleLibrary,
    musclesByGroup: groupedMuscles,
    searchQuery: "",
    onMuscleSelect: fn(),
    muscleGroupLabels,
  },
} satisfies Meta<typeof MuscleList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Peito/i)).toBeVisible();
    await expect(canvas.getByText(/Peitoral Maior/i)).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: {
    searchQuery: "dorsal",
    muscles: [muscleLibrary[1]],
  },
};

export const Empty: Story = {
  args: {
    muscles: [],
    musclesByGroup: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nenhum musculo/i)).toBeVisible();
  },
};
