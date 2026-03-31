import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createLoginRedirectFixture,
  LoginRedirectScreen,
} from "@/components/screens/public";

const meta = {
  title: "Screens/Public/LoginRedirect",
  component: LoginRedirectScreen,
  args: createLoginRedirectFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof LoginRedirectScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoadingCopy: Story = {
  args: createLoginRedirectFixture({
    message: "Abrindo fluxo de autenticacao...",
  }),
};
