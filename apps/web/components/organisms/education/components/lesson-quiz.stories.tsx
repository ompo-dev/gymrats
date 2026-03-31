import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { LessonQuiz } from "./lesson-quiz";
import { educationLessonLibrary } from "./education-story-fixtures";

const meta = {
  title: "Organisms/Education/LessonQuiz",
  component: LessonQuiz.Simple,
  tags: ["autodocs"],
  args: {
    lesson: educationLessonLibrary[0],
    onComplete: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof LessonQuiz.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /Tensao mecanica/i }),
    );
    await userEvent.click(canvas.getByRole("button", { name: /^10 a 20$/i }));
    await userEvent.click(
      canvas.getByRole("button", { name: /ENVIAR RESPOSTAS/i }),
    );
    await expect(canvas.getByText("100%")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /CONTINUAR/i }),
    ).toBeVisible();
  },
};
