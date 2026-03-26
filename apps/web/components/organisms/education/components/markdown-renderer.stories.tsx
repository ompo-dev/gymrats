import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { MarkdownRenderer } from "./markdown-renderer";

const meta = {
  title: "Organisms/Education/MarkdownRenderer",
  component: MarkdownRenderer,
  tags: ["autodocs"],
  args: {
    content: `## Guia rapido

Treino eficiente depende de **consistencia** e **progressao**.

### Checklist

- Dormir bem
- Aumentar carga com criterio
- Revisar tecnica

1. Planejar a semana
2. Executar o treino
3. Revisar o resultado`,
  },
} satisfies Meta<typeof MarkdownRenderer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Guia rapido/i)).toBeVisible();
    await expect(canvas.getByText(/consistencia/i)).toBeVisible();
    await expect(canvas.getByText(/Planejar a semana/i)).toBeVisible();
  },
};
