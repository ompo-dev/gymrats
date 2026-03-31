import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SearchBar } from "./search-bar";

const meta = {
  title: "Organisms/Education/Muscle/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  args: {
    value: "",
    placeholder: "Buscar musculos ou exercicios",
    onChange: () => undefined,
  },
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulSearchBar(args: React.ComponentProps<typeof SearchBar>) {
  const [value, setValue] = useState(args.value);

  return <SearchBar {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <StatefulSearchBar {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/Buscar musculos/i);
    await expect(input).toBeVisible();
    await userEvent.type(input, "peito");
    await expect(input).toHaveValue("peito");
  },
};
