import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { QueryProvider } from "@/components/providers/query-provider";

function QueryPreview() {
  return (
    <div className="rounded-2xl bg-[var(--duo-bg-card)] p-6 shadow-sm ring-1 ring-[var(--duo-border)]">
      <h3 className="text-xl font-black text-[var(--duo-fg)]">
        Provider pronto
      </h3>
      <p className="mt-2 text-sm text-[var(--duo-fg-muted)]">
        O wrapper agora e neutro no runtime do produto.
      </p>
      <p className="mt-1 text-sm text-[var(--duo-fg-muted)]">
        Historico legado de React Query foi removido.
      </p>
    </div>
  );
}

const meta = {
  title: "Providers/QueryProvider",
  component: QueryProvider,
  args: {
    children: undefined,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof QueryProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <QueryProvider>
      <QueryPreview />
    </QueryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Provider pronto/i)).toBeVisible();
    await expect(
      canvas.getByText(/wrapper agora e neutro no runtime/i),
    ).toBeVisible();
  },
};
