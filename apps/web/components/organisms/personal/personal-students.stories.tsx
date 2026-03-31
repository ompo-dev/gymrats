import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PersonalStudentsPage } from "./personal-students";

const meta = {
  title: "Organisms/Personal/PersonalStudentsPage",
  component: PersonalStudentsPage,
  args: {
    students: [
      {
        id: "assignment-1",
        student: {
          id: "student-1",
          avatar: "/placeholder.svg",
          user: {
            id: "user-1",
            name: "Ana Souza",
            email: "ana@gymrats.local",
          },
        },
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
        },
      },
      {
        id: "assignment-2",
        student: {
          id: "student-2",
          avatar: "/placeholder.svg",
          user: {
            id: "user-2",
            name: "Bruno Lima",
            email: "bruno@gymrats.local",
          },
        },
        gym: null,
      },
    ],
    affiliations: [
      {
        id: "affiliation-1",
        gym: {
          id: "gym-1",
          name: "GymRats Paulista",
        },
      },
    ],
    onRefresh: async () => undefined,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PersonalStudentsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
