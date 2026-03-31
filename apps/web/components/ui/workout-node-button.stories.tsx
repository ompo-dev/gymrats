import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { WorkoutNodeButton } from "@/components/ui/workout-node-button";

const meta = {
  title: "UI/WorkoutNodeButton",
  component: WorkoutNodeButton,
  tags: ["autodocs"],
  args: {
    onClick: () => undefined,
    isLocked: false,
    isCompleted: false,
    isCurrent: true,
  },
} satisfies Meta<typeof WorkoutNodeButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Current: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button")).toBeVisible();
  },
};

export const StateMatrix: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <WorkoutNodeButton
        onClick={() => undefined}
        isLocked={false}
        isCompleted={false}
        isCurrent
      />
      <WorkoutNodeButton
        onClick={() => undefined}
        isLocked={false}
        isCompleted
        isCurrent={false}
      />
      <WorkoutNodeButton
        onClick={() => undefined}
        isLocked
        isCompleted={false}
        isCurrent={false}
      />
      <WorkoutNodeButton
        onClick={() => undefined}
        isLocked={false}
        isCompleted={false}
        isCurrent={false}
        isMissed
      />
    </div>
  ),
};
