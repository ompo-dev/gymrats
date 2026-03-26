import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { assignmentFixture } from "./personal-student-detail-story-fixtures";
import { PersonalStudentHeaderCard } from "./personal-student-header-card";

const meta = {
  title: "Organisms/Personal/StudentDetail/PersonalStudentHeaderCard",
  component: PersonalStudentHeaderCard,
  tags: ["autodocs"],
  args: {
    assignment: assignmentFixture,
    onAssignWorkout: fn(),
    onAssignDiet: fn(),
    onRemoveAssignment: fn(),
    isRemovingAssignment: false,
  },
} satisfies Meta<typeof PersonalStudentHeaderCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Desvincular Aluno/i }));
    await expect(args.onRemoveAssignment).toHaveBeenCalled();
  },
};

export const IndependentStudent: Story = {
  args: {
    assignment: {
      ...assignmentFixture,
      gym: null,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Independente/i)).toBeVisible();
  },
};
