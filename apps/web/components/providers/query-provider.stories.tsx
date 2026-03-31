import { useQuery } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { QueryProvider } from "@/components/providers/query-provider";

function QueryPreview() {
  const summaryQuery = useQuery({
    queryKey: ["storybook-query-provider"],
    queryFn: async () => ({
      syncedAt: "2026-03-26 10:00",
      students: 128,
    }),
  });

  if (summaryQuery.isPending) {
    return <p>Carregando cache inicial...</p>;
  }

  if (!summaryQuery.data) {
    return <p>Sem dados no cache.</p>;
  }

  return (
    <div className="rounded-2xl bg-[var(--duo-bg-card)] p-6 shadow-sm ring-1 ring-[var(--duo-border)]">
      <h3 className="text-xl font-black text-[var(--duo-fg)]">
        Query cache pronto
      </h3>
      <p className="mt-2 text-sm text-[var(--duo-fg-muted)]">
        Ultima sincronizacao: {summaryQuery.data.syncedAt}
      </p>
      <p className="mt-1 text-sm text-[var(--duo-fg-muted)]">
        Alunos ativos: {summaryQuery.data.students}
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
    await expect(canvas.getByText(/Query cache pronto/i)).toBeVisible();
    await expect(canvas.getByText(/Alunos ativos: 128/i)).toBeVisible();
  },
};
