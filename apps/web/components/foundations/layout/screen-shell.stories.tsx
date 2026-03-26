import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoButton, DuoCard } from "@/components/duo";
import { ScreenShell } from "@/components/foundations";

const meta = {
  title: "Foundations/ScreenShell",
  component: ScreenShell.Root,
  tags: ["autodocs"],
} satisfies Meta<typeof ScreenShell.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    screenId: "screen-shell-story",
  },
  render: () => (
    <ScreenShell.Root screenId="screen-shell-story">
      <ScreenShell.Header>
        <ScreenShell.Heading>
          <ScreenShell.Title>Dashboard Shell</ScreenShell.Title>
          <ScreenShell.Description>
            Estrutura canônica para screens do web.
          </ScreenShell.Description>
        </ScreenShell.Heading>
        <ScreenShell.Actions>
          <DuoButton size="sm">Nova acao</DuoButton>
        </ScreenShell.Actions>
      </ScreenShell.Header>
      <ScreenShell.Body>
        <ScreenShell.SectionGrid>
          <DuoCard.Root padding="md">
            <p className="text-sm text-[var(--duo-fg-muted)]">Coluna 1</p>
          </DuoCard.Root>
          <DuoCard.Root padding="md">
            <p className="text-sm text-[var(--duo-fg-muted)]">Coluna 2</p>
          </DuoCard.Root>
        </ScreenShell.SectionGrid>
      </ScreenShell.Body>
    </ScreenShell.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Dashboard Shell")).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Nova acao/i })).toBeVisible();
  },
};
