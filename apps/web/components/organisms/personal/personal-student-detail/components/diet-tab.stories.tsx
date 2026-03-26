import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PersonalDietTab } from "./diet-tab";

const meta = {
  title: "Organisms/Personal/StudentDetail/DietTab",
  component: PersonalDietTab,
  args: {
    profile: {
      targetCalories: 2100,
      targetProtein: 155,
      targetCarbs: 240,
      targetFats: 70,
      targetWater: 3200,
    },
    dailyNutrition: {
      date: "2026-03-26",
      meals: [],
      totalCalories: 1430,
      totalProtein: 121,
      totalCarbs: 148,
      totalFats: 42,
      waterIntake: 2000,
      targetCalories: 2100,
      targetProtein: 155,
      targetCarbs: 240,
      targetFats: 70,
      targetWater: 3200,
    },
    nutritionDate: "2026-03-26",
    isCurrentDate: true,
    isLoadingNutrition: false,
    onNutritionDateChange: () => undefined,
    onFetchNutrition: () => undefined,
    onMealComplete: () => undefined,
    onAddMeal: async () => undefined,
    onAddFood: async () => undefined,
    onApplyNutrition: async () => undefined,
    onUpdateTargetWater: async () => undefined,
    onRemoveMeal: async () => undefined,
    onRemoveFood: async () => undefined,
    onToggleWaterGlass: async () => undefined,
    onOpenLibrary: () => undefined,
  },
} satisfies Meta<typeof PersonalDietTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
