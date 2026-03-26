import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { assignmentFixture } from "./personal-student-detail-story-fixtures";
import { PersonalRecordsTab } from "./records-tab";

const meta = {
  title: "Organisms/Personal/StudentDetail/PersonalRecordsTab",
  component: PersonalRecordsTab,
  tags: ["autodocs"],
  args: {
    records: assignmentFixture.student.records,
  },
} satisfies Meta<typeof PersonalRecordsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Recordes Pessoais/i)).toBeVisible();
    await expect(canvas.getByText(/Agachamento Livre/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    records: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhum recorde pessoal registrado/i),
    ).toBeVisible();
  },
};
