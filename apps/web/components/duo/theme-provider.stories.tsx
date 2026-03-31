import type { Meta, StoryObj } from "@storybook/react";
import { useEffect } from "react";
import { expect, within } from "storybook/test";
import { DuoThemeProvider } from "@/components/duo/theme-provider";
import { useThemeStore } from "@/stores/theme-store";

function ThemeProviderPreview({
  presetId,
  colorMode,
  label,
}: {
  presetId: string;
  colorMode: "light" | "dark";
  label: string;
}) {
  const setActivePreset = useThemeStore((state) => state.setActivePreset);
  const setColorMode = useThemeStore((state) => state.setColorMode);

  useEffect(() => {
    setActivePreset(presetId);
    setColorMode(colorMode);
  }, [colorMode, presetId, setActivePreset, setColorMode]);

  return (
    <DuoThemeProvider>
      <div className="grid gap-4 rounded-3xl bg-[var(--duo-bg)] p-6 text-[var(--duo-fg)]">
        <div>
          <p className="text-sm font-semibold text-[var(--duo-fg-muted)]">
            Theme preset
          </p>
          <h3 className="text-2xl font-black">{label}</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[var(--duo-primary)] p-4 text-white">
            Primary
          </div>
          <div className="rounded-2xl bg-[var(--duo-accent)] p-4 text-white">
            Accent
          </div>
          <div className="rounded-2xl bg-[var(--duo-bg-card)] p-4 shadow-sm ring-1 ring-[var(--duo-border)]">
            Surface
          </div>
        </div>
      </div>
    </DuoThemeProvider>
  );
}

const meta = {
  title: "Duo/ThemeProvider",
  component: ThemeProviderPreview,
  tags: ["autodocs"],
  args: {
    presetId: "duo-blue",
    colorMode: "dark",
    label: "Ocean Blue",
  },
} satisfies Meta<typeof ThemeProviderPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DarkBlue: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Ocean Blue")).toBeVisible();
    await expect(canvas.getByText("Primary")).toBeVisible();
  },
};

export const LightClassic: Story = {
  args: {
    presetId: "duo-green-light",
    colorMode: "light",
    label: "Duolingo Classic",
  },
};
