import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { CreateGymButton } from "./create-gym-button";

const meta = {
  title: "Organisms/Gym/Academias/CreateGymButton",
  component: CreateGymButton,
  tags: ["autodocs"],
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof CreateGymButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", {
      name: /Criar Nova Academia/i,
    });
    await expect(button).toBeVisible();
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();
  },
};
