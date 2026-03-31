import type { Meta, StoryObj } from "@storybook/react";
import { HeartPulse } from "lucide-react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { LimitationSelector } from "@/components/molecules/limitation-selector";

function LimitationSelectorStory({
  withSelection = true,
}: {
  withSelection?: boolean;
}) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    withSelection ? ["joelho"] : [],
  );
  const [details, setDetails] = useState<Record<string, string | string[]>>(
    withSelection ? { joelho: "Dor leve ao agachar" } : {},
  );

  return (
    <div className="max-w-2xl rounded-3xl bg-[var(--duo-bg-card)] p-6 shadow-sm ring-1 ring-[var(--duo-border)]">
      <LimitationSelector.Simple
        title="Limitacoes fisicas"
        icon={HeartPulse}
        iconColor="text-duo-danger"
        borderColor="border-duo-danger/40"
        bgColor="bg-duo-danger/5"
        options={[
          { value: "joelho", label: "Joelho" },
          { value: "ombro", label: "Ombro" },
          { value: "coluna", label: "Coluna" },
          { value: "tornozelo", label: "Tornozelo" },
        ]}
        selectedValues={selectedValues}
        onChange={setSelectedValues}
        limitationDetails={details}
        onDetailChange={(limitationKey, detailValue) =>
          setDetails((current) => ({
            ...current,
            [limitationKey]: detailValue,
          }))
        }
        detailConfig={{
          joelho: {
            type: "text",
            label: "Descreva o que acontece no joelho",
            placeholder: "Ex.: dor leve ao agachar profundo",
          },
          ombro: {
            type: "selector",
            label: "Qual tipo de restricao voce sente no ombro?",
            options: [
              { value: "mobilidade", label: "Mobilidade reduzida" },
              { value: "dor", label: "Dor ao elevar o braco" },
            ],
          },
        }}
      />
    </div>
  );
}

const meta = {
  title: "Molecules/LimitationSelector",
  component: LimitationSelectorStory,
  tags: ["autodocs"],
} satisfies Meta<typeof LimitationSelectorStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Selected: Story = {
  render: () => <LimitationSelectorStory />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Limitacoes fisicas/i)).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Joelho" })).toBeVisible();
  },
};

export const Empty: Story = {
  render: () => <LimitationSelectorStory withSelection={false} />,
};
