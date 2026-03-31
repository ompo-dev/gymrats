import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoButton } from "@/components/duo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <DuoButton>Abrir</DuoButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar cancelamento</DialogTitle>
          <DialogDescription>
            Esta acao encerra o plano atual e remove o acesso premium.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DuoButton variant="outline">Voltar</DuoButton>
          <DuoButton variant="primary">Confirmar</DuoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByRole("dialog")).toBeVisible();
    await expect(
      canvas.getByText(/Esta acao encerra o plano atual/i),
    ).toBeVisible();
  },
};
