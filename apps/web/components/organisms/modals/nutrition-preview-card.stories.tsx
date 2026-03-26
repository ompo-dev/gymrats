import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NutritionPreviewCard } from "./nutrition-preview-card";

const meta = {
  title: "Organisms/Modals/NutritionPreviewCard",
  component: NutritionPreviewCard,
  args: {
    meal: {
      type: "lunch",
      name: "Almoco Balanceado",
      time: "12:30",
      foods: [
        {
          mealType: "lunch",
          name: "Frango grelhado",
          category: "protein",
          confidence: 0.98,
          servings: 1,
          servingSize: "150g",
          calories: 240,
          protein: 32,
          carbs: 0,
          fats: 8,
        },
      ],
      totalCalories: 520,
      totalProtein: 36,
      totalCarbs: 42,
      totalFats: 14,
    },
    index: 0,
    defaultExpanded: true,
  },
} satisfies Meta<typeof NutritionPreviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
