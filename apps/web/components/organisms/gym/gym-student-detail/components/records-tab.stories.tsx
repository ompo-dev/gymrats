import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  createGymStudentDetailFixture,
  gymStudentFixture,
} from "./gym-student-detail-story-fixtures";
import { RecordsTab } from "./records-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/RecordsTab",
  component: RecordsTab,
  tags: ["autodocs"],
  args: {
    student: gymStudentFixture,
  },
} satisfies Meta<typeof RecordsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Agachamento Livre/i)).toBeVisible();
    await expect(canvas.getByText(/Supino Reto/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    student: createGymStudentDetailFixture({
      personalRecords: [],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Recordes Pessoais/i)).toBeVisible();
  },
};
