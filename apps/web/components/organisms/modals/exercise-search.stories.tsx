import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExerciseSearch } from "./exercise-search";

const meta = {
  title: "Organisms/Modals/ExerciseSearch",
  component: ExerciseSearch.Simple,
  args: {
    workoutId: "workout-1",
    onClose: () => undefined,
  },
} satisfies Meta<typeof ExerciseSearch.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
