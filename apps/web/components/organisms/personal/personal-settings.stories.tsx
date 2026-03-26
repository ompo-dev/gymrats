import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { createPersonalSettingsFixture } from "@/components/screens/personal";
import {
  PersonalSettingsPage,
  type PersonalSettingsPageProps,
} from "./personal-settings";

function createPersonalSettingsPageFixture(
  overrides: Partial<PersonalSettingsPageProps> = {},
): PersonalSettingsPageProps {
  const screenArgs = createPersonalSettingsFixture();

  return {
    profile: {
      name: screenArgs.form.name,
      email: screenArgs.form.email,
      phone: screenArgs.form.phone,
      bio: screenArgs.form.bio,
      address: screenArgs.form.address,
      cref: screenArgs.form.cref,
      pixKeyType: screenArgs.form.pixKeyType,
      pixKey: screenArgs.form.pixKey,
      atendimentoPresencial: screenArgs.form.atendimentoPresencial,
      atendimentoRemoto: screenArgs.form.atendimentoRemoto,
    },
    plans: [],
    onRefresh: async () => undefined,
    ...overrides,
  };
}

const meta = {
  title: "Organisms/Personal/PersonalSettingsPage",
  component: PersonalSettingsPage,
  args: createPersonalSettingsPageFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalSettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Configuracoes/i)).toBeVisible();
    await expect(canvas.getByText(/Planos de Assinatura/i)).toBeVisible();
  },
};
