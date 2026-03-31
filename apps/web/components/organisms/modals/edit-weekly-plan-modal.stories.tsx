import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditWeeklyPlanModal } from "./edit-weekly-plan-modal";

const meta = {
  title: "Organisms/Modals/EditWeeklyPlanModal",
  component: EditWeeklyPlanModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
  },
} satisfies Meta<typeof EditWeeklyPlanModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
