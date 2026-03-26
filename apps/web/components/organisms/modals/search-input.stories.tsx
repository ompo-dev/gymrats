import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SearchInput } from "./search-input";

const meta = {
  title: "Organisms/Modals/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  args: {
    value: "",
    placeholder: "Buscar alimento",
    onChange: () => undefined,
  },
} satisfies Meta<typeof SearchInput>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulSearchInput(args: React.ComponentProps<typeof SearchInput>) {
  const [value, setValue] = useState(args.value);

  return <SearchInput {...args} value={value} onChange={setValue} />;
}

export const Default: Story = {
  render: (args) => <StatefulSearchInput {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/Buscar alimento/i);
    await userEvent.type(input, "frango");
    await expect(input).toHaveValue("frango");
  },
};
