import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import {
  EnvironmentProvider,
  useEnvironment,
} from "@/components/providers/environment-provider";

function EnvironmentProviderPreview() {
  const { environment, setEnvironment } = useEnvironment();

  return (
    <div className="grid gap-4 rounded-2xl bg-[var(--duo-bg-card)] p-6 shadow-sm ring-1 ring-[var(--duo-border)]">
      <div>
        <p className="text-sm font-semibold text-[var(--duo-fg-muted)]">
          Ambiente ativo
        </p>
        <h3 className="text-xl font-black text-[var(--duo-fg)]">
          {environment?.type ?? "NONE"} / {environment?.plan ?? "sem plano"}
        </h3>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-xl bg-[var(--duo-primary)] px-4 py-2 font-bold text-white"
          onClick={() =>
            setEnvironment({
              type: "GYM",
              id: "gym-01",
              plan: "PREMIUM",
            })
          }
        >
          Gym
        </button>
        <button
          type="button"
          className="rounded-xl bg-[var(--duo-accent)] px-4 py-2 font-bold text-white"
          onClick={() =>
            setEnvironment({
              type: "PERSONAL",
              id: "personal-01",
              plan: "PRO_AI",
            })
          }
        >
          Personal
        </button>
      </div>
    </div>
  );
}

const meta = {
  title: "Providers/EnvironmentProvider",
  component: EnvironmentProvider,
  args: {
    children: undefined,
    initialEnv: undefined,
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EnvironmentProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => (
    <EnvironmentProvider
      initialEnv={{ type: "GYM", id: "gym-01", plan: "PREMIUM" }}
    >
      <EnvironmentProviderPreview />
    </EnvironmentProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GYM \/ PREMIUM/i)).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Personal" }));
    await expect(canvas.getByText(/PERSONAL \/ PRO_AI/i)).toBeVisible();
  },
};
