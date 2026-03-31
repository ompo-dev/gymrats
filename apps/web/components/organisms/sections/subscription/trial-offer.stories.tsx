import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { TrialOffer } from "@/components/organisms/sections/subscription/trial-offer";

const meta = {
  title: "Organisms/Sections/Subscription/TrialOffer",
  component: TrialOffer.Simple,
  tags: ["autodocs"],
  args: {
    title: "Experimente 14 dias gratis",
    description: "Teste todas as funcionalidades premium antes de assinar.",
    buttonText: "Iniciar trial",
    isLoading: false,
    onStartTrial: async () => undefined,
  },
} satisfies Meta<typeof TrialOffer.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Experimente 14 dias gratis/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Iniciar trial/i })).toBeVisible();
  },
};
