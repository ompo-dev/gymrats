import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrainingLibraryModal } from "./training-library-modal";

const meta = {
  title: "Organisms/Modals/TrainingLibraryModal",
  component: TrainingLibraryModal,
} satisfies Meta<typeof TrainingLibraryModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
