import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, ChartColumn, Home } from "lucide-react";
import { expect, within } from "storybook/test";
import { AppLayout } from "./app-layout";

const meta = {
  title: "Templates/Layouts/AppLayout",
  component: AppLayout.Simple,
  args: {
    userType: "student",
    defaultTab: "home",
    basePath: "/student",
    showLogo: true,
    stats: {
      streak: 14,
      xp: 1840,
      level: 12,
    },
    tabs: [
      { id: "home", icon: Home, label: "Inicio" },
      { id: "learn", icon: BookOpen, label: "Aprender" },
      { id: "stats", icon: ChartColumn, label: "Stats" },
    ],
    children: (
      <div className="space-y-4 p-4">
        <section className="rounded-3xl border border-[var(--duo-border)] bg-[var(--duo-bg-card)] p-6">
          <h2 className="text-xl font-bold text-[var(--duo-fg)]">
            Resumo do dia
          </h2>
          <p className="mt-2 text-sm text-[var(--duo-fg-muted)]">
            Conteudo de exemplo para validar o shell da aplicacao.
          </p>
        </section>
      </div>
    ),
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppLayout.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StudentShell: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/GymRats/i)).toBeVisible();
    await expect(canvas.getByText(/Resumo do dia/i)).toBeVisible();
    await expect(canvas.getByText(/Aprender/i)).toBeVisible();
  },
};

export const PersonalShell: Story = {
  args: {
    userType: "personal",
    showLogo: false,
    stats: {
      streak: 0,
      xp: 3200,
      level: 18,
    },
  },
};
