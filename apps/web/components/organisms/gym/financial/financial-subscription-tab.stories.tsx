import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { expect, within } from "storybook/test";
import { useSubscriptionStore } from "@/stores/subscription-store";
import {
  activeGymSubscriptionFixture,
  canceledGymSubscriptionFixture,
  trialGymSubscriptionFixture,
} from "./financial-story-fixtures";
import { FinancialSubscriptionTab } from "./financial-subscription-tab";

function FinancialSubscriptionTabStory(
  args: React.ComponentProps<typeof FinancialSubscriptionTab>,
) {
  useEffect(() => {
    useSubscriptionStore.setState({
      gymSubscription: null,
    });

    return () => {
      useSubscriptionStore.setState({
        gymSubscription: null,
      });
    };
  }, []);

  return <FinancialSubscriptionTab {...args} />;
}

const meta = {
  title: "Organisms/Gym/Financial/FinancialSubscriptionTab",
  component: FinancialSubscriptionTabStory,
  tags: ["autodocs"],
  args: {
    subscription: activeGymSubscriptionFixture,
  },
} satisfies Meta<typeof FinancialSubscriptionTabStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Status da Assinatura/i)).toBeVisible();
    await expect(canvas.getByText(/Escolha seu Plano/i)).toBeVisible();
  },
};

export const Trialing: Story = {
  args: {
    subscription: trialGymSubscriptionFixture,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Status da Assinatura/i)).toBeVisible();
    await expect(canvas.getByText(/Proxima renovacao/i)).toBeVisible();
  },
};

export const Canceled: Story = {
  args: {
    subscription: canceledGymSubscriptionFixture,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Status da Assinatura/i)).toBeVisible();
  },
};
