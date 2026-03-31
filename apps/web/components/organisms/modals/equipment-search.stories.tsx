import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EquipmentSearch } from "./equipment-search";

const meta = {
  title: "Organisms/Modals/EquipmentSearch",
  component: EquipmentSearch.Simple,
  args: {
    onAddEquipment: () => undefined,
    onClose: () => undefined,
  },
} satisfies Meta<typeof EquipmentSearch.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
