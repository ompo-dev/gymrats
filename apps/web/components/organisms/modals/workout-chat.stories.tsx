import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WorkoutChat } from "./workout-chat";

const meta = {
  title: "Organisms/Modals/WorkoutChat",
  component: WorkoutChat,
  args: {
    onClose: () => undefined,
    workouts: [],
  },
} satisfies Meta<typeof WorkoutChat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
