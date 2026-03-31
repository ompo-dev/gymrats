import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, within } from "storybook/test";
import { LessonFilters } from "./lesson-filters";
import { educationCategoryOptions } from "./education-story-fixtures";

const meta = {
  title: "Organisms/Education/LessonFilters",
  component: LessonFilters.Simple,
  tags: ["autodocs"],
  args: {
    searchQuery: "",
    selectedCategory: "all",
    categoryOptions: educationCategoryOptions,
    onSearchChange: () => undefined,
    onCategoryChange: () => undefined,
  },
} satisfies Meta<typeof LessonFilters.Simple>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulLessonFilters(
  args: React.ComponentProps<typeof LessonFilters.Simple>,
) {
  const [searchQuery, setSearchQuery] = useState(args.searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(args.selectedCategory);

  return (
    <LessonFilters.Simple
      {...args}
      searchQuery={searchQuery}
      selectedCategory={selectedCategory}
      onSearchChange={setSearchQuery}
      onCategoryChange={setSelectedCategory}
    />
  );
}

export const Default: Story = {
  render: (args) => <StatefulLessonFilters {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Buscar e Filtrar/i)).toBeVisible();
    await expect(
      canvas.getByPlaceholderText(/Buscar lica|Buscar li/i),
    ).toBeVisible();
  },
};

export const WithActiveSearch: Story = {
  args: {
    searchQuery: "proteina",
    selectedCategory: "nutrition",
  },
  render: (args) => <StatefulLessonFilters {...args} />,
};
