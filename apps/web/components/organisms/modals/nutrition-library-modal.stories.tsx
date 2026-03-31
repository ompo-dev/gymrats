import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NutritionLibraryModal } from "./nutrition-library-modal";

const meta = {
  title: "Organisms/Modals/NutritionLibraryModal",
  component: NutritionLibraryModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
  },
} satisfies Meta<typeof NutritionLibraryModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
