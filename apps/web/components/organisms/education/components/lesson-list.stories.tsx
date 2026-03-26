import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { LessonList } from "./lesson-list";
import {
  educationCategoryColors,
  educationLessonLibrary,
  educationLessonsByCategory,
  getEducationCategoryIcon,
  getEducationCategoryLabel,
} from "./education-story-fixtures";

const meta = {
  title: "Organisms/Education/LessonList",
  component: LessonList.Simple,
  tags: ["autodocs"],
  args: {
    lessons: educationLessonLibrary,
    lessonsByCategory: educationLessonsByCategory,
    categoryColors: educationCategoryColors,
    onLessonSelect: fn(),
    getCategoryIcon: getEducationCategoryIcon,
    getCategoryLabel: getEducationCategoryLabel,
  },
} satisfies Meta<typeof LessonList.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Ciencia da Hipertrofia/i)).toBeVisible();
    await expect(canvas.getByText(/Proteina e Sintese Muscular/i)).toBeVisible();
  },
};

export const SearchResults: Story = {
  args: {
    lessons: educationLessonLibrary.slice(0, 2),
    lessonsByCategory: null,
  },
};

export const Empty: Story = {
  args: {
    lessons: [],
    lessonsByCategory: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nenhuma lica/i)).toBeVisible();
  },
};
