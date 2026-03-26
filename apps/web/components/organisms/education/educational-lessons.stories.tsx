import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { EducationalLessons } from "./educational-lessons";

const meta = {
  title: "Organisms/Education/EducationalLessons",
  component: EducationalLessons.Simple,
  tags: ["autodocs"],
  args: {
    lessonId: undefined,
    onLessonSelect: fn(),
    onBack: fn(),
  },
} satisfies Meta<typeof EducationalLessons.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Library: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Licoes Educacionais/i)).toBeVisible();
    await expect(canvas.getByText(/Buscar e Filtrar/i)).toBeVisible();
  },
};

export const DeepLinkedLesson: Story = {
  args: {
    lessonId: "lesson-hypertrophy",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ciencia da Hipertrofia/i)).toBeVisible();
    await expect(canvas.getByText(/Pontos-Chave/i)).toBeVisible();
  },
};
