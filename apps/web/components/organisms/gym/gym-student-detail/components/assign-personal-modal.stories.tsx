import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";
import { AssignPersonalModal } from "./assign-personal-modal";

function AssignPersonalModalStory(
  args: React.ComponentProps<typeof AssignPersonalModal>,
) {
  useEffect(() => {
    useGymDirectoryStore.setState({
      linkedPersonalSearchResults: [
        {
          id: "personal-1",
          name: "Rafa Moreira",
          email: "rafa@gymrats.local",
          alreadyLinked: true,
        },
        {
          id: "personal-2",
          name: "Julia Lima",
          email: "julia@gymrats.local",
          alreadyLinked: true,
        },
      ],
      isSearchingLinkedPersonals: false,
    });
  }, []);

  return <AssignPersonalModal {...args} />;
}

const meta = {
  title: "Organisms/Gym/StudentDetail/AssignPersonalModal",
  component: AssignPersonalModalStory,
  args: {
    isOpen: true,
    onClose: () => undefined,
    onAssign: async () => undefined,
    isAssigning: false,
  },
} satisfies Meta<typeof AssignPersonalModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
