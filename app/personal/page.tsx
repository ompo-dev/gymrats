"use client";

import { useEffect, useState } from "react";
import { DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";

interface PersonalDashboardData {
  personal: {
    id: string;
    name: string;
    email: string;
    bio?: string | null;
  } | null;
  affiliations: Array<{
    id: string;
    gym: { id: string; name: string };
  }>;
  students: Array<{
    id: string;
    student: {
      id: string;
      user?: { name?: string };
    };
    gym?: { id: string; name: string } | null;
  }>;
}

export default function PersonalPage() {
  const [data, setData] = useState<PersonalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, affiliationsRes, studentsRes] = await Promise.all([
          apiClient.get<{ personal: PersonalDashboardData["personal"] }>(
            "/api/personals",
          ),
          apiClient.get<{
            affiliations: PersonalDashboardData["affiliations"];
          }>("/api/personals/affiliations"),
          apiClient.get<{ students: PersonalDashboardData["students"] }>(
            "/api/personals/students",
          ),
        ]);

        setData({
          personal: profileRes.data.personal,
          affiliations: affiliationsRes.data.affiliations || [],
          students: studentsRes.data.students || [],
        });
      } finally {
        setLoading(false);
      }
    }

    load().catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-duo-fg-muted">Carregando área do personal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <DuoCard.Root>
        <h1 className="text-2xl font-bold text-duo-fg">Área do Personal</h1>
        <p className="mt-1 text-sm text-duo-fg-muted">
          Gerencie academias vinculadas e seus alunos acompanhados.
        </p>
      </DuoCard.Root>

      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Perfil</h2>
        <p className="mt-2 text-sm text-duo-fg-muted">
          {data?.personal?.name || "Personal"} - {data?.personal?.email || ""}
        </p>
      </DuoCard.Root>

      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Academias vinculadas</h2>
        <ul className="mt-2 space-y-2 text-sm text-duo-fg-muted">
          {(data?.affiliations || []).map((item) => (
            <li key={item.id}>- {item.gym?.name || "Academia"}</li>
          ))}
          {(data?.affiliations || []).length === 0 ? (
            <li>Nenhuma academia vinculada.</li>
          ) : null}
        </ul>
      </DuoCard.Root>

      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Alunos atendidos</h2>
        <ul className="mt-2 space-y-2 text-sm text-duo-fg-muted">
          {(data?.students || []).map((item) => (
            <li key={item.id}>
              - {item.student?.user?.name || "Aluno"}{" "}
              {item.gym?.name ? `(via ${item.gym.name})` : "(independente)"}
            </li>
          ))}
          {(data?.students || []).length === 0 ? (
            <li>Nenhum aluno atribuído.</li>
          ) : null}
        </ul>
      </DuoCard.Root>
    </div>
  );
}
