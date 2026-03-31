import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PersonalMoreMenu } from "./personal-more-menu";

const meta = {
  title: "Organisms/Navigation/PersonalMoreMenu",
  component: PersonalMoreMenu.Simple,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalMoreMenu.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
