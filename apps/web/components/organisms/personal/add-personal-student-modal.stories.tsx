import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { usePersonalDirectoryStore } from "@/stores/personal-directory-store";
import { AddPersonalStudentModal } from "./add-personal-student-modal";

function AddPersonalStudentModalStory(
  args: React.ComponentProps<typeof AddPersonalStudentModal>,
) {
  useEffect(() => {
    usePersonalDirectoryStore.setState({
      studentSearchResult: {
        found: true,
        assignedGymIds: [],
        student: {
          id: "student-1",
          name: "Ana Souza",
          email: "ana@gymrats.local",
          avatar: "/placeholder.svg",
          currentLevel: 9,
          currentStreak: 5,
        },
      },
      isSearchingStudents: false,
    });

    return () => {
      usePersonalDirectoryStore.setState({
        studentSearchResult: null,
        isSearchingStudents: false,
      });
    };
  }, []);

  return <AddPersonalStudentModal {...args} />;
}

const meta = {
  title: "Organisms/Personal/AddPersonalStudentModal",
  component: AddPersonalStudentModalStory,
  args: {
    isOpen: true,
    onClose: fn(),
    onSuccess: fn(),
    affiliations: [
      { id: "aff-1", gym: { id: "gym-1", name: "GymRats Paulista" } },
      { id: "aff-2", gym: { id: "gym-2", name: "Arena Norte" } },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AddPersonalStudentModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Atribuir Aluno/i)).toBeVisible();
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
  },
};
