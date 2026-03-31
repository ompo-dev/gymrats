import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { expect, within } from "storybook/test";
import { personalFinancialFixture } from "@/components/organisms/gym/financial/financial-story-fixtures";
import { usePersonalUnifiedStore } from "@/stores/personal-unified-store";
import { PersonalFinancialPage } from "./personal-financial";

function PersonalFinancialPageStory() {
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

  return <PersonalFinancialPage />;
}

const meta = {
  title: "Organisms/Personal/PersonalFinancialPage",
  component: PersonalFinancialPageStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalFinancialPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Gestao Financeira/i)).toBeVisible();
    await expect(canvas.getByText(/Categoria/i)).toBeVisible();
  },
};
