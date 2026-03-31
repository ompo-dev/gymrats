import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExerciseAlternativeSelector } from "./exercise-alternative-selector";

const meta = {
  title: "Organisms/Modals/ExerciseAlternativeSelector",
  component: ExerciseAlternativeSelector,
  args: {
    exercise: {
      id: "exercise-1",
      name: "Supino Reto",
      educationalId: "exercise-1",
      selectedAlternative: undefined,
      alternatives: [
        {
          id: "exercise-2",
          name: "Supino com Halteres",
          reason: "Alternativa com halteres",
          educationalId: "exercise-2",
        },
      ],
    } as never,
    onSelect: () => undefined,
    onCancel: () => undefined,
    onViewEducation: () => undefined,
  },
} satisfies Meta<typeof ExerciseAlternativeSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
