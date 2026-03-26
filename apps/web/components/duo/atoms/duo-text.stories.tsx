import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoText } from "@/components/duo";

const meta = {
  title: "Atoms/DuoText",
  component: DuoText,
  tags: ["autodocs"],
  args: {
    children: "Titulo de exemplo",
    variant: "h2",
  },
} satisfies Meta<typeof DuoText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Titulo de exemplo")).toBeVisible();
  },
};

export const TypographyScale: Story = {
  render: () => (
    <div className="grid gap-3">
      <DuoText variant="h1">Heading 1</DuoText>
      <DuoText variant="h2">Heading 2</DuoText>
      <DuoText variant="h3">Heading 3</DuoText>
      <DuoText variant="h4">Heading 4</DuoText>
      <DuoText variant="body">Body default text</DuoText>
      <DuoText variant="body-sm" muted>
        Body small muted text
      </DuoText>
      <DuoText color="accent" variant="label">
        Label accent
      </DuoText>
      <DuoText color="secondary" variant="overline">
        Overline secondary
      </DuoText>
    </div>
  ),
};
