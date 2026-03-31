import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { gymFinancialFixture, personalFinancialFixture } from "./financial-story-fixtures";
import { FinancialCouponsTab } from "./financial-coupons-tab";

const meta = {
  title: "Organisms/Gym/Financial/FinancialCouponsTab",
  component: FinancialCouponsTab,
  tags: ["autodocs"],
  args: {
    coupons: gymFinancialFixture.coupons,
    variant: "gym",
  },
} satisfies Meta<typeof FinancialCouponsTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/^PROMO20$/i)).toBeVisible();
    await expect(canvas.getByText(/Novo cupom/i)).toBeVisible();
  },
};

export const PersonalVariant: Story = {
  args: {
    coupons: personalFinancialFixture.coupons,
    variant: "personal",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/^PERSONAL10$/i)).toBeVisible();
  },
};

export const Empty: Story = {
  args: {
    coupons: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/Nenhum cupom cadastrado/i),
    ).toBeVisible();
  },
};
