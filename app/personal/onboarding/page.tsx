"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DuoButton, DuoCard, DuoInput } from "@/components/duo";
import { submitPersonalOnboarding } from "./actions";

export default function PersonalOnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [atendimentoPresencial, setAtendimentoPresencial] = useState(true);
  const [atendimentoRemoto, setAtendimentoRemoto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await submitPersonalOnboarding({
      name,
      phone,
      bio,
      atendimentoPresencial,
      atendimentoRemoto,
    });

    if (!result.success) {
      setError(result.error || "Erro ao salvar");
      setLoading(false);
      return;
    }

    router.push("/personal");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-duo-bg p-4">
      <DuoCard.Root className="w-full max-w-xl" padding="lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-duo-fg">Onboarding do Personal</h1>
          <p className="mt-1 text-sm text-duo-fg-muted">
            Configure seu perfil profissional para começar a atender alunos.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <DuoInput.Simple
            label="Nome"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            required
          />

          <DuoInput.Simple
            label="Telefone"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
          />

          <div className="space-y-1.5">
            <label className="text-sm font-bold uppercase tracking-wider text-duo-fg-muted">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-24 w-full rounded-xl border-2 border-duo-border bg-duo-bg-card px-4 py-3 text-base text-duo-fg outline-none focus:border-duo-primary focus:ring-2 focus:ring-(--duo-primary)/20"
              placeholder="Fale sobre seu método de trabalho, especialidades e experiência."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-duo-border p-3">
              <input
                type="checkbox"
                checked={atendimentoPresencial}
                onChange={(e) => setAtendimentoPresencial(e.target.checked)}
              />
              <span className="text-sm text-duo-fg">Atendimento presencial</span>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-duo-border p-3">
              <input
                type="checkbox"
                checked={atendimentoRemoto}
                onChange={(e) => setAtendimentoRemoto(e.target.checked)}
              />
              <span className="text-sm text-duo-fg">Atendimento remoto</span>
            </label>
          </div>

          {error ? (
            <div className="rounded-lg border border-duo-danger/40 bg-duo-danger/10 px-3 py-2 text-sm text-duo-danger">
              {error}
            </div>
          ) : null}

          <DuoButton type="submit" disabled={loading || !name.trim()}>
            {loading ? "Salvando..." : "Concluir onboarding"}
          </DuoButton>
        </form>
      </DuoCard.Root>
    </div>
  );
}
