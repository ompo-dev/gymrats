import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  createSwaggerDocsFixture,
  SwaggerDocsScreen,
} from "@/components/screens/public";

const meta = {
  title: "Screens/Public/SwaggerDocs",
  component: SwaggerDocsScreen,
  args: createSwaggerDocsFixture(),
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SwaggerDocsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: createSwaggerDocsFixture({
    spec: null,
  }),
};

export const Error: Story = {
  args: createSwaggerDocsFixture({
    spec: null,
    error: "Falha ao carregar o contrato da API.",
  }),
};
