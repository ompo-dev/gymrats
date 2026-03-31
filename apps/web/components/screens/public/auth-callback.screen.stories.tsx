import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  AuthCallbackScreen,
  createAuthCallbackFixture,
} from "@/components/screens/public";

const meta = {
  title: "Screens/Public/AuthCallback",
  component: AuthCallbackScreen,
  args: createAuthCallbackFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AuthCallbackScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Processing: Story = {};

export const Success: Story = {
  args: createAuthCallbackFixture({
    status: "success",
  }),
};

export const Error: Story = {
  args: createAuthCallbackFixture({
    status: "error",
    error: "Erro ao processar autenticacao.",
  }),
};
