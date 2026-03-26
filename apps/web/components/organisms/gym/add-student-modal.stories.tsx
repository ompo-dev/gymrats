import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { fn } from "storybook/test";
import { expect, within } from "storybook/test";
import { useGymDirectoryStore } from "@/stores/gym-directory-store";
import { AddStudentModal } from "./add-student-modal";

function AddStudentModalStory(
  args: React.ComponentProps<typeof AddStudentModal>,
) {
  useEffect(() => {
    useGymDirectoryStore.setState({
      studentSearchResult: {
        found: true,
        isAlreadyMember: false,
        student: {
          id: "student-1",
          name: "Ana Souza",
          email: "ana@gymrats.local",
          avatar: "/placeholder.svg",
          currentLevel: 12,
          currentStreak: 8,
        },
      },
      isSearchingStudents: false,
    });

    return () => {
      useGymDirectoryStore.setState({
        studentSearchResult: null,
        isSearchingStudents: false,
      });
    };
  }, []);

  return <AddStudentModal {...args} />;
}

const meta = {
  title: "Organisms/Gym/AddStudentModal",
  component: AddStudentModalStory,
  args: {
    isOpen: true,
    onClose: fn(),
    onSuccess: fn(),
    membershipPlans: [
      {
        id: "plan-1",
        name: "Plano Mensal",
        type: "monthly",
        price: 129.9,
        duration: 30,
        benefits: ["Acesso livre"],
        isActive: true,
      },
    ],
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AddStudentModalStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Adicionar Aluno/i)).toBeVisible();
    await expect(canvas.getByText(/Ana Souza/i)).toBeVisible();
  },
};
