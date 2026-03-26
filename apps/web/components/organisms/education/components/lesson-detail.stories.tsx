import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { LessonDetail } from "./lesson-detail";
import {
  educationLessonLibrary,
  getEducationCategoryColor,
  getEducationCategoryIcon,
  getEducationCategoryLabel,
} from "./education-story-fixtures";

const meta = {
  title: "Organisms/Education/LessonDetail",
  component: LessonDetail.Simple,
  tags: ["autodocs"],
  args: {
    lesson: educationLessonLibrary[0],
    onBack: fn(),
    onComplete: fn(),
    getCategoryIcon: getEducationCategoryIcon,
    getCategoryLabel: getEducationCategoryLabel,
    getCategoryColor: getEducationCategoryColor,
  },
} satisfies Meta<typeof LessonDetail.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ciencia da Hipertrofia/i)).toBeVisible();
    await expect(canvas.getByText(/Pontos-Chave/i)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /FAZER QUIZ/i }),
    ).toBeVisible();
  },
};
