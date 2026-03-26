import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { gymFinancialFixture, personalFinancialFixture } from "./financial-story-fixtures";
import { FinancialAdsTab } from "./financial-ads-tab";

const meta = {
  title: "Organisms/Gym/Financial/FinancialAdsTab",
  component: FinancialAdsTab,
  tags: ["autodocs"],
  args: {
    campaigns: gymFinancialFixture.campaigns,
    coupons: gymFinancialFixture.coupons,
    plans: gymFinancialFixture.plans?.map((plan) => ({
      id: plan.id,
      name: plan.name,
    })),
    variant: "gym",
  },
} satisfies Meta<typeof FinancialAdsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Open Week/i)).toBeVisible();
    await expect(canvas.getByText(/Ativo/i)).toBeVisible();
    await expect(canvas.getByText(/Novo anuncio/i)).toBeVisible();
  },
};

export const PersonalVariant: Story = {
  args: {
    campaigns: personalFinancialFixture.campaigns,
    coupons: personalFinancialFixture.coupons,
    plans: personalFinancialFixture.plans,
    variant: "personal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Avaliacao Gratis/i)).toBeVisible();
    await expect(canvas.getByText(/Destaque seu perfil/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    campaigns: [],
    coupons: [],
    plans: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Voce ainda nao tem campanhas/i),
    ).toBeVisible();
  },
};
