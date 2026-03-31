import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import {
  getStatusColor,
  getStatusIcon,
  getStatusText,
  type EquipmentStatus,
} from "./equipment-status";

const statuses: EquipmentStatus[] = [
  "available",
  "in-use",
  "maintenance",
  "broken",
];

function EquipmentStatusGallery() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {statuses.map((status) => (
        <div
          key={status}
          className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold ${getStatusColor(
            status,
          )}`}
        >
          {getStatusIcon(status)}
          <span>{getStatusText(status)}</span>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Organisms/Gym/EquipmentDetail/EquipmentStatus",
  component: EquipmentStatusGallery,
  tags: ["autodocs"],
} satisfies Meta<typeof EquipmentStatusGallery>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Em Uso/i)).toBeVisible();
    await expect(canvas.getByText(/Quebrado/i)).toBeVisible();
  },
};
