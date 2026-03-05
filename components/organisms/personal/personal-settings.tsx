"use client";

import { DuoCard } from "@/components/duo";

export interface PersonalProfileDisplay {
  id?: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  atendimentoPresencial?: boolean;
  atendimentoRemoto?: boolean;
}

export interface PersonalSettingsPageProps {
  profile: PersonalProfileDisplay | null;
}

export function PersonalSettingsPage({ profile }: PersonalSettingsPageProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Meu perfil</h2>
        <p className="mt-1 text-sm text-duo-fg-muted">
          {profile?.name || "Personal"} - {profile?.email || ""}
        </p>
        {profile?.bio ? (
          <p className="mt-3 text-sm text-duo-fg-muted">{profile.bio}</p>
        ) : null}
      </DuoCard.Root>

      <DuoCard.Root>
        <h3 className="font-semibold text-duo-fg">Modalidade de atendimento</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          {profile?.atendimentoPresencial ? (
            <span className="rounded-full border border-duo-border px-3 py-1 text-duo-fg">
              Presencial
            </span>
          ) : null}
          {profile?.atendimentoRemoto ? (
            <span className="rounded-full border border-duo-border px-3 py-1 text-duo-fg">
              Remoto
            </span>
          ) : null}
          {!profile?.atendimentoPresencial && !profile?.atendimentoRemoto ? (
            <span className="rounded-full border border-duo-border px-3 py-1 text-duo-fg-muted">
              Não informado
            </span>
          ) : null}
        </div>
      </DuoCard.Root>
    </div>
  );
}
