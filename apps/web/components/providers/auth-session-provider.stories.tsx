import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";

const meta = {
  title: "Providers/AuthSessionProvider",
  component: AuthSessionProvider,
  args: {
    children: undefined,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AuthSessionProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AuthSessionProvider>
      <div className="rounded-2xl bg-[var(--duo-bg-card)] p-6 shadow-sm ring-1 ring-[var(--duo-border)]">
        <h3 className="text-lg font-black text-[var(--duo-fg)]">
          Auth hydration boundary
        </h3>
        <p className="mt-2 text-sm text-[var(--duo-fg-muted)]">
          Este provider hidrata sessao apenas quando a rota exige sessao.
        </p>
      </div>
    </AuthSessionProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Auth hydration boundary/i)).toBeVisible();
  },
};
