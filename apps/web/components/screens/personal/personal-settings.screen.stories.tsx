import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DuoButton, DuoCard } from "@/components/duo";
import {
  createPersonalSettingsFixture,
  PersonalSettingsScreen,
} from "@/components/screens/personal";

function PersonalPlansPreview() {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-duo-fg">
            Planos de Assinatura
          </h2>
          <DuoButton variant="primary">Novo Plano</DuoButton>
        </div>
      </DuoCard.Header>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            id: "plan-1",
            name: "Consultoria Premium",
            price: "R$ 249,90",
            description: "Mensal • 30 dias",
          },
          {
            id: "plan-2",
            name: "Acompanhamento Online",
            price: "R$ 179,90",
            description: "Mensal • 30 dias",
          },
        ].map((plan) => (
          <DuoCard.Root key={plan.id} variant="default" size="default">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-duo-fg">{plan.name}</p>
                  <p className="text-sm text-duo-fg-muted">
                    {plan.description}
                  </p>
                </div>
                <span className="text-sm font-bold text-duo-primary">
                  {plan.price}
                </span>
              </div>
              <div className="flex gap-2">
                <DuoButton variant="outline" size="sm" fullWidth>
                  Editar
                </DuoButton>
                <DuoButton variant="danger" size="sm">
                  Remover
                </DuoButton>
              </div>
            </div>
          </DuoCard.Root>
        ))}
      </div>
    </DuoCard.Root>
  );
}

const meta = {
  title: "Screens/Personal/PersonalSettings",
  component: PersonalSettingsScreen,
  args: createPersonalSettingsFixture(),
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => (
    <PersonalSettingsScreen
      {...args}
      plansSlot={<PersonalPlansPreview />}
    />
  ),
} satisfies Meta<typeof PersonalSettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnsavedChanges: Story = {
  args: createPersonalSettingsFixture({
    form: {
      ...createPersonalSettingsFixture().form,
      bio: "Personal focado em hipertrofia, consultoria remota e reabilitação.",
    },
    hasChanges: true,
  }),
};

export const WithoutStudentSwitch: Story = {
  args: createPersonalSettingsFixture({
    canSwitchToStudent: false,
  }),
};
