import type { Meta, StoryObj } from "@storybook/react";
import { BookOpen, ChartColumn, Home } from "lucide-react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { AppBottomNav } from "@/components/organisms/navigation/app-bottom-nav";

function AppBottomNavStory() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-[160px] bg-[var(--duo-bg)] pb-20">
      <AppBottomNav.Simple
        userType="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
          { id: "home", icon: Home, label: "Inicio" },
          { id: "learn", icon: BookOpen, label: "Aprender" },
          { id: "stats", icon: ChartColumn, label: "Stats" },
        ]}
      />
    </div>
  );
}

const meta = {
  title: "Organisms/Navigation/AppBottomNav",
  component: AppBottomNavStory,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppBottomNavStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => <AppBottomNavStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Inicio")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Aprender/i }));
    await expect(canvas.getByText("Aprender")).toBeVisible();
  },
};
