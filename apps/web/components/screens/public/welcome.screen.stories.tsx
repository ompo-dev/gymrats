import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createWelcomeFixture, WelcomeScreen } from "@/components/screens/public";

const meta = {
  title: "Screens/Public/Welcome",
  component: WelcomeScreen,
  args: createWelcomeFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WelcomeScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: createWelcomeFixture({
    isLoading: true,
  }),
};

export const Error: Story = {
  args: createWelcomeFixture({
    error: "Erro ao fazer login com Google. Tente novamente.",
  }),
};
