import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { gymStudentFixture } from "./gym-student-detail-story-fixtures";
import { DietTab } from "./diet-tab";

const meta = {
  title: "Organisms/Gym/StudentDetail/DietTab",
  component: DietTab,
  args: {
    student: gymStudentFixture,
    dailyNutrition: {
      date: "2026-03-26",
      meals: [],
      totalCalories: 1240,
      totalProtein: 108,
      totalCarbs: 132,
      totalFats: 38,
      waterIntake: 1800,
      targetCalories: 2000,
      targetProtein: 150,
      targetCarbs: 250,
      targetFats: 65,
      targetWater: 3000,
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
} satisfies Meta<typeof DietTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ReadOnlyHistory: Story = {
  args: {
    isCurrentDate: false,
    nutritionDate: "2026-03-20",
  },
};
