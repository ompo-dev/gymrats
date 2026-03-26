import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DuoButton, DuoCard } from "@/components/duo";
import {
  createGymSettingsFixture,
  GymSettingsScreen,
} from "@/components/screens/gym";

function GymPlansPreview() {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-duo-fg">
            Planos de Matrícula
          </h2>
          <DuoButton variant="primary">Novo Plano</DuoButton>
        </div>
      </DuoCard.Header>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            id: "plan-1",
            name: "Plano Mensal",
            price: "R$ 129,90",
            description: "Mensal • 30 dias",
          },
          {
            id: "plan-2",
            name: "Plano Anual",
            price: "R$ 1.199,90",
            description: "Anual • 365 dias",
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

function GymTeamPreview() {
  return (
    <DuoCard.Root variant="default" padding="md">
      <DuoCard.Header>
        <h2 className="text-xl font-bold text-duo-fg">Gerenciar Equipe</h2>
      </DuoCard.Header>
      <div className="space-y-3">
        {[
          "Rafa Moreira",
          "Camila Alves",
        ].map((personal) => (
          <DuoCard.Root key={personal} variant="default" size="default">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-duo-fg">{personal}</p>
                <p className="text-sm text-duo-fg-muted">
                  Especialista vinculado à equipe
                </p>
              </div>
              <DuoButton variant="ghost" size="sm">
                Remover
              </DuoButton>
            </div>
          </DuoCard.Root>
        ))}
      </div>
    </DuoCard.Root>
  );
}

const meta = {
  title: "Screens/Gym/GymSettings",
  component: GymSettingsScreen,
  args: createGymSettingsFixture(),
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => (
    <GymSettingsScreen
      {...args}
      plansSlot={<GymPlansPreview />}
      teamSlot={<GymTeamPreview />}
    />
  ),
} satisfies Meta<typeof GymSettingsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const UnsavedInfo: Story = {
  args: createGymSettingsFixture({
    info: {
      ...createGymSettingsFixture().info,
      phone: "(11) 98888-1111",
    },
    hasInfoChanges: true,
  }),
};

export const UnsavedSchedule: Story = {
  args: createGymSettingsFixture({
    daySchedules: {
      ...createGymSettingsFixture().daySchedules,
      friday: {
        open: "07:00",
        close: "23:00",
        enabled: true,
      },
    },
    hasScheduleChanges: true,
  }),
};
