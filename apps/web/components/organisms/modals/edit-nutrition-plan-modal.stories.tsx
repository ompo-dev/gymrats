import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditNutritionPlanModal } from "./edit-nutrition-plan-modal";

const meta = {
  title: "Organisms/Modals/EditNutritionPlanModal",
  component: EditNutritionPlanModal,
  args: {
    isOpen: true,
    nutritionPlan: null,
    onClose: () => undefined,
  },
} satisfies Meta<typeof EditNutritionPlanModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
