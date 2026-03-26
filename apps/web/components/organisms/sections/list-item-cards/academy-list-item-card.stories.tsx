import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "storybook/test";
import { AcademyListItemCard } from "./academy-list-item-card";

const meta = {
  title: "Organisms/Sections/ListItemCards/AcademyListItemCard",
  component: AcademyListItemCard,
  tags: ["autodocs"],
  args: {
    image: "/placeholder.svg",
    name: "GymRats Paulista",
    onClick: fn(),
    badge: { label: "Top", variant: "green" },
    address: "Av. Paulista, 1500",
    rating: 4.8,
    totalReviews: 210,
    distance: 1.2,
  },
} satisfies Meta<typeof AcademyListItemCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MapVariant: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats Paulista/i)).toBeVisible();
    await expect(canvas.getByText(/1.2 km/i)).toBeVisible();
  },
};

export const PlanVariant: Story = {
  args: {
    badge: undefined,
    planName: "Plano Black",
    rating: undefined,
    totalReviews: undefined,
    distance: undefined,
  },
};
