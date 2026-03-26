import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { CustomCheckbox } from "@/components/ui/custom-checkbox";

function CustomCheckboxStory() {
  const [checked, setChecked] = useState(true);

  return (
    <CustomCheckbox
      checked={checked}
      onChange={setChecked}
      label="Receber notificacoes"
      description="Alertas sobre treino, pagamento e rotina."
    />
  );
}

const meta = {
  title: "UI/CustomCheckbox",
  component: CustomCheckboxStory,
  tags: ["autodocs"],
} satisfies Meta<typeof CustomCheckboxStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CustomCheckboxStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Receber notificacoes/i)).toBeVisible();
  },
};

