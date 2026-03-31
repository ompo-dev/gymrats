import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StudentLandingPage } from "@/components/marketing/student-landing-page";

const meta = {
  title: "Marketing/StudentLandingPage",
  component: StudentLandingPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof StudentLandingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

