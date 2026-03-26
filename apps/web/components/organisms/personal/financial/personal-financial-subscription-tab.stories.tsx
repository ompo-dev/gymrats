import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { expect, within } from "storybook/test";
import { personalFinancialFixture } from "@/components/organisms/gym/financial/financial-story-fixtures";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";
import { PersonalFinancialSubscriptionTab } from "./personal-financial-subscription-tab";

function PersonalFinancialSubscriptionTabStory() {
  useEffect(() => {
    usePersonalUnifiedStore.setState((state) => ({
      ...state,
      data: {
        ...state.data,
        subscription: personalFinancialFixture.subscription,
      },
    }));

    return () => {
      usePersonalUnifiedStore.setState((state) => ({
        ...state,
        data: {
          ...state.data,
          subscription: null,
        },
      }));
    };
  }, []);

  return <PersonalFinancialSubscriptionTab />;
}

const meta = {
  title: "Organisms/Personal/Financial/PersonalFinancialSubscriptionTab",
  component: PersonalFinancialSubscriptionTabStory,
  tags: ["autodocs"],
} satisfies Meta<typeof PersonalFinancialSubscriptionTabStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Status da Assinatura/i)).toBeVisible();
    await expect(canvas.getByText(/Escolha seu Plano/i)).toBeVisible();
  },
};
