"use client";

import { DuoCard } from "@/components/duo";

const CARD_VARIANTS = [
  {
    variant: "default" as const,
    title: "Card Default",
    desc: "Card com borda e fundo padrão.",
  },
  {
    variant: "elevated" as const,
    title: "Card Elevated",
    desc: "Card com sombra elevada.",
  },
  {
    variant: "outlined" as const,
    title: "Card Outlined",
    desc: "Card apenas com borda.",
  },
  {
    variant: "interactive" as const,
    title: "Card Interactive",
    desc: "Card clicável com hover.",
  },
];

export function CardsSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CARD_VARIANTS.map(({ variant, title, desc }) => (
        <DuoCard.Root key={variant} variant={variant}>
          <DuoCard.Header>
            <span className="font-bold">{title}</span>
          </DuoCard.Header>
          <DuoCard.Content>
            <p className="text-sm text-[var(--duo-fg-muted)]">{desc}</p>
          </DuoCard.Content>
        </DuoCard.Root>
      ))}
    </div>
  );
}
