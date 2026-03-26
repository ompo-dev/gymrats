import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs className="max-w-xl" defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Visao geral</TabsTrigger>
        <TabsTrigger value="team">Equipe</TabsTrigger>
        <TabsTrigger value="billing">Cobranca</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="rounded-3xl border p-6 text-sm">
          Indicadores principais do periodo atual.
        </div>
      </TabsContent>
      <TabsContent value="team">
        <div className="rounded-3xl border p-6 text-sm">Times e permissoes.</div>
      </TabsContent>
      <TabsContent value="billing">
        <div className="rounded-3xl border p-6 text-sm">Plano e faturas.</div>
      </TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("tab", { name: "Visao geral" })).toBeVisible();
    await expect(
      canvas.getByText(/Indicadores principais do periodo atual/i),
    ).toBeVisible();
  },
};

