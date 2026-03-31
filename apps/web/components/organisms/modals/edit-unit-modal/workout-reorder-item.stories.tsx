import { Reorder } from "motion/react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { workoutSessionFixture } from "./edit-unit-modal-story-fixtures";
import { WorkoutReorderItem } from "./workout-reorder-item";

const meta = {
  title: "Organisms/Modals/EditUnitModal/WorkoutReorderItem",
  component: WorkoutReorderItem,
  tags: ["autodocs"],
  args: {
    workout: workoutSessionFixture,
    index: 0,
    onEdit: fn(),
    onDelete: fn(),
  },
  render: (args) => (
    <Reorder.Group
      axis="y"
      values={[args.workout]}
      onReorder={() => undefined}
      className="space-y-3"
    >
      <WorkoutReorderItem {...args} />
    </Reorder.Group>
  ),
} satisfies Meta<typeof WorkoutReorderItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Editar dia/i }));
    await expect(args.onEdit).toHaveBeenCalledWith("workout-1");
  },
};

export const Delete: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Remover dia/i }));
    await expect(args.onDelete).toHaveBeenCalledWith("workout-1");
  },
};
