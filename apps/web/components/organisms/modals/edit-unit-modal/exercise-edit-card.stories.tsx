import { Reorder } from "motion/react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { workoutExerciseFixture } from "./edit-unit-modal-story-fixtures";
import { ExerciseEditCard } from "./exercise-edit-card";

const meta = {
  title: "Organisms/Modals/EditUnitModal/ExerciseEditCard",
  component: ExerciseEditCard,
  tags: ["autodocs"],
  args: {
    exercise: workoutExerciseFixture,
    index: 0,
    onUpdate: fn(),
    onDelete: fn(),
  },
  render: (args) => (
    <Reorder.Group
      axis="y"
      values={[args.exercise]}
      onReorder={() => undefined}
      className="space-y-3"
    >
      <ExerciseEditCard {...args} />
    </Reorder.Group>
  ),
} satisfies Meta<typeof ExerciseEditCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByDisplayValue(/Supino Reto/i);
    await userEvent.clear(input);
    await userEvent.type(input, "Supino Inclinado");
    await userEvent.tab();
    await expect(args.onUpdate).toHaveBeenCalled();
  },
};

export const Delete: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Remover exercicio/i }),
    );
    await expect(args.onDelete).toHaveBeenCalledWith("exercise-1");
  },
};
