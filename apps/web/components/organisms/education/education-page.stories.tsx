import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { EducationPage } from "./education-page";

const meta = {
  title: "Organisms/Education/EducationPage",
  component: EducationPage.Simple,
  tags: ["autodocs"],
  args: {
    onSelectView: fn(),
  },
} satisfies Meta<typeof EducationPage.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Central de Aprendizado/i)).toBeVisible();
    await expect(canvas.getByText(/Licoes de Ciencia/i)).toBeVisible();
  },
};
