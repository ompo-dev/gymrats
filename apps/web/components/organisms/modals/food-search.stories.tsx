import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FoodSearch } from "./food-search";

const meta = {
  title: "Organisms/Modals/FoodSearch",
  component: FoodSearch.Simple,
  args: {
    onAddFood: () => undefined,
    onClose: () => undefined,
    meals: [],
    onSelectMeal: () => undefined,
    onAddMeal: () => undefined,
    onApplyNutrition: () => undefined,
    contextMode: "external",
  },
} satisfies Meta<typeof FoodSearch.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
