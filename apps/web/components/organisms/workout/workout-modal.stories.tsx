import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkoutModal } from "./workout-modal";

const meta = {
  title: "Organisms/Workout/WorkoutModal",
  component: WorkoutModal.Simple,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WorkoutModal.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
