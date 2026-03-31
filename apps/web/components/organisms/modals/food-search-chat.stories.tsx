import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FoodSearchChat } from "./food-search-chat";

const meta = {
  title: "Organisms/Modals/FoodSearchChat",
  component: FoodSearchChat,
  args: {
    onAddFood: () => undefined,
    onAddMeal: () => undefined,
    onClose: () => undefined,
    selectedMealId: null,
    meals: [],
    onSelectMeal: () => undefined,
    onApplyNutrition: () => undefined,
    contextMode: "external",
  },
} satisfies Meta<typeof FoodSearchChat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
