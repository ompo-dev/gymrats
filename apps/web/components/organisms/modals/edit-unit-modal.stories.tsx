import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EditUnitModal } from "./edit-unit-modal";

const meta = {
  title: "Organisms/Modals/EditUnitModal",
  component: EditUnitModal,
  args: {
    isOpen: false,
  },
} satisfies Meta<typeof EditUnitModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
