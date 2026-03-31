import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createPersonalMoreMenuFixture,
  PersonalMoreMenuScreen,
} from "@/components/screens/personal";

const meta = {
  title: "Screens/Personal/PersonalMoreMenu",
  component: PersonalMoreMenuScreen,
  args: createPersonalMoreMenuFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalMoreMenuScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
