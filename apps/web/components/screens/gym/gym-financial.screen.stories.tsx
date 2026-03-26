import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createGymFinancialFixture,
  GymFinancialScreen,
} from "@/components/screens/gym";

const meta = {
  title: "Screens/Gym/GymFinancial",
  component: GymFinancialScreen,
  args: createGymFinancialFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GymFinancialScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {};

export const Payments: Story = {
  args: createGymFinancialFixture({
    viewMode: "payments",
  }),
};
