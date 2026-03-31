import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createPersonalFinancialFixture,
  PersonalFinancialScreen,
} from "@/components/screens/personal";

const meta = {
  title: "Screens/Personal/PersonalFinancial",
  component: PersonalFinancialScreen,
  args: createPersonalFinancialFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalFinancialScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const Payments: Story = {
  args: createPersonalFinancialFixture({
    viewMode: "payments",
  }),
};
