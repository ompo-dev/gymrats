import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";
import { CheckInModal } from "./checkin-modal";

function CheckInModalStory(args: React.ComponentProps<typeof CheckInModal>) {
  useEffect(() => {
    useGymDirectoryStore.setState({
      activeMembers: [
        { id: "student-1", name: "Ana Souza", avatar: "/placeholder.svg" },
        { id: "student-2", name: "Marcos Lima", avatar: null },
      ],
      isSearchingActiveMembers: false,
    });

    return () => {
      useGymDirectoryStore.setState({
        activeMembers: [],
        isSearchingActiveMembers: false,
      });
    };
  }, []);

  return <CheckInModal {...args} />;
}

const meta = {
  title: "Organisms/Gym/CheckInModal",
  component: CheckInModalStory,
  args: {
    isOpen: true,
    onClose: fn(),
    onSuccess: fn(),
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CheckInModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Registrar Check-in/i)).toBeVisible();
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
  },
};
