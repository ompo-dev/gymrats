import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { BackButton } from "@/components/organisms/navigation/back-button";

const meta = {
  title: "Organisms/Navigation/BackButton",
  component: BackButton,
  tags: ["autodocs"],
  args: {
    onClick: () => undefined,
    color: "duo-blue",
  },
} satisfies Meta<typeof BackButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Voltar/i });
    await expect(button).toBeVisible();
    await userEvent.click(button);
  },
};
