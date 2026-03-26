import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { DuoButton, DuoCard, DuoStatCard, DuoTabs } from "@/components/duo";

const meta = {
  title: "Foundations/GymRats Design System",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--duo-secondary)]">
          GymRats UI System
        </p>
        <h1 className="text-4xl font-black text-[var(--duo-fg)]">
          Atomic structure, composition-first APIs and adaptive surfaces.
        </h1>
        <p className="max-w-2xl text-base text-[var(--duo-fg-muted)]">
          Storybook agora documenta os blocos canônicos da interface e os
          estados essenciais para a evolução do design system do projeto.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <DuoCard.Root variant="default" padding="lg">
          <DuoCard.Header>
            <h2 className="text-xl font-black text-[var(--duo-fg)]">
              Composition patterns
            </h2>
          </DuoCard.Header>
          <DuoTabs.Simple
            variant="underline"
            tabs={[
              {
                id: "compound",
                label: "Compound",
                content: (
                  <p className="text-sm text-[var(--duo-fg-muted)]">
                    Componentes como tabs, cards e screens agora expõem slots e
                    subcomponentes para composição explícita.
                  </p>
                ),
              },
              {
                id: "adaptive",
                label: "Adaptive",
                content: (
                  <p className="text-sm text-[var(--duo-fg-muted)]">
                    Container queries controlam a adaptação local sem trocar a
                    direção visual consolidada no produto.
                  </p>
                ),
              },
            ]}
          />
        </DuoCard.Root>

        <DuoCard.Root variant="blue" padding="lg" className="space-y-4">
          <DuoStatCard.Simple
            value="280+"
            label="componentes web mapeados"
            badge="inventário"
          />
          <DuoButton className="w-full">Abrir fluxo canônico</DuoButton>
        </DuoCard.Root>
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: /Atomic structure/i }),
    ).toBeVisible();
    await expect(canvas.getByText(/Composition patterns/i)).toBeVisible();
  },
};
