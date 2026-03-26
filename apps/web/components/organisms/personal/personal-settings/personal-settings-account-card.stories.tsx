import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";
import { PersonalSettingsAccountCard } from "./personal-settings-account-card";

const meta = {
  title: "Organisms/Personal/PersonalSettings/PersonalSettingsAccountCard",
  component: PersonalSettingsAccountCard,
  tags: ["autodocs"],
  args: {
    canSwitchToStudent: true,
    onSwitchToStudent: fn(),
    onLogout: fn(),
  },
} satisfies Meta<typeof PersonalSettingsAccountCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CanSwitch: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText(/Trocar para Perfil de Aluno/i));
    await expect(args.onSwitchToStudent).toHaveBeenCalled();
  },
};

export const LogoutOnly: Story = {
  args: {
    canSwitchToStudent: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByText(/Trocar para Perfil de Aluno/i),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByText(/^Sair$/i));
    await expect(args.onLogout).toHaveBeenCalled();
  },
};
