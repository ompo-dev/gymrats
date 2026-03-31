import type { Meta, StoryObj } from "@storybook/nextjs-vite";

function GuidelineCard({
  title,
  description,
  rules,
}: {
  title: string;
  description: string;
  rules: string[];
}) {
  return (
    <section className="space-y-4 rounded-[28px] border border-duo-border bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-duo-text">{title}</h2>
        <p className="text-sm text-duo-gray-dark">{description}</p>
      </header>
      <ul className="space-y-3 text-sm text-duo-fg-muted">
        {rules.map((rule) => (
          <li
            key={rule}
            className="rounded-2xl bg-[var(--duo-bg-soft)] px-4 py-3"
          >
            {rule}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReactCompositionGuidelinesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(88,204,2,0.12),_transparent_34%),linear-gradient(180deg,#f6f8fb_0%,#ffffff_100%)] px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <span className="inline-flex rounded-full bg-duo-green/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-duo-green">
            GymRats UI Architecture
          </span>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight text-duo-text">
            Atomic Design + React Composition + Container Queries
          </h1>
          <p className="max-w-3xl text-base text-duo-gray-dark">
            Este Storybook não documenta só aparência. Ele define como a UI deve
            ser montada, testada e evoluída sem reintroduzir acoplamento entre
            domínio, dados e apresentação.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <GuidelineCard
            title="Atomic Design"
            description="Cada camada tem uma responsabilidade clara e não invade a próxima."
            rules={[
              "Atoms não conhecem domínio nem regras de negócio; expõem apenas API visual e semântica.",
              "Molecules combinam atoms para resolver padrões recorrentes, mas não fazem fetch, auth ou navegação.",
              "Organisms montam blocos maiores de tela e podem receber callbacks e dados serializáveis.",
              "Screens concentram a composição visual da tela; containers resolvem bootstrap, stores, router e side effects.",
            ]}
          />
          <GuidelineCard
            title="React Composition Patterns"
            description="Composição primeiro, props booleanas por último."
            rules={[
              "Prefira compound components, slots e children antes de criar variantes rígidas ou componentes-polvo.",
              "Use APIs controladas/não controladas explícitas em tabs, dialogs, selectors e widgets interativos.",
              "Extraia headless hooks quando a lógica puder ser reaproveitada em múltiplas views sem duplicar renderização.",
              "Providers ficam no topo certo; organisms e screens não devem esconder providers internos arbitrários.",
            ]}
          />
          <GuidelineCard
            title="Container Queries"
            description="Adaptação por contexto do componente, não só por viewport."
            rules={[
              "Screen shells, panels e grids devem reagir ao container pai usando contratos de layout locais.",
              "Atoms permanecem previsíveis; molecules e organisms mudam a composição quando o container encolhe.",
              "Quebras de layout em cards, headers e action bars devem nascer do container, não de media queries globais.",
            ]}
          />
          <GuidelineCard
            title="Testability"
            description="Cada screen e fluxo crítico precisa de selectors e estados explícitos."
            rules={[
              "Use roles e ARIA primeiro; complemente com data-testid apenas para superfícies críticas e estáveis.",
              "Toda screen principal expõe um root testável e slots previsíveis para métricas, ações e estados vazios.",
              "Stories devem cobrir default, empty, error, narrow container e role/state variants sempre que aplicável.",
            ]}
          />
        </div>
      </div>
    </main>
  );
}

const meta = {
  title: "Foundations/React Composition Guidelines",
  component: ReactCompositionGuidelinesPage,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Contrato arquitetural para refatoração contínua do GymRats em Atomic Design, React Composition Patterns e Container Queries.",
      },
    },
  },
} satisfies Meta<typeof ReactCompositionGuidelinesPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
