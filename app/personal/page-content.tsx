"use client";

import { motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useMemo, useState } from "react";
import { DuoCard } from "@/components/duo";
import { apiClient } from "@/lib/api/client";

interface PersonalProfile {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  atendimentoPresencial?: boolean;
  atendimentoRemoto?: boolean;
}

interface PersonalAffiliation {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

interface PersonalStudentAssignment {
  id: string;
  student: {
    id: string;
    user?: { id: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

function PersonalHomeContent() {
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [affiliations, setAffiliations] = useState<PersonalAffiliation[]>([]);
  const [students, setStudents] = useState<PersonalStudentAssignment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, affiliationsRes, studentsRes] = await Promise.all([
          apiClient.get<{ personal: PersonalProfile | null }>("/api/personals"),
          apiClient.get<{ affiliations: PersonalAffiliation[] }>(
            "/api/personals/affiliations",
          ),
          apiClient.get<{ students: PersonalStudentAssignment[] }>(
            "/api/personals/students",
          ),
        ]);

        setProfile(profileRes.data.personal);
        setAffiliations(affiliationsRes.data.affiliations || []);
        setStudents(studentsRes.data.students || []);
      } finally {
        setLoading(false);
      }
    }

    load().catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const studentsViaGym = students.filter((item) => item.gym?.id).length;
    const independentStudents = students.length - studentsViaGym;
    return {
      gyms: affiliations.length,
      students: students.length,
      studentsViaGym,
      independentStudents,
    };
  }, [affiliations.length, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-duo-fg-muted">Carregando área do personal...</p>
      </div>
    );
  }

  return (
    <motion.div
      key={tab}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="px-4 py-6"
    >
      {tab === "dashboard" && (
        <div className="mx-auto max-w-2xl space-y-4">
          <DuoCard.Root>
            <h1 className="text-2xl font-bold text-duo-fg">
              Olá, {profile?.name?.split(" ")[0] || "Personal"}!
            </h1>
            <p className="mt-1 text-sm text-duo-fg-muted">
              Sua área foi organizada no mesmo padrão dos módulos principais.
            </p>
          </DuoCard.Root>

          <DuoCard.Root>
            <h2 className="text-lg font-bold text-duo-fg">Resumo</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-duo-border p-3">
                <p className="text-duo-fg-muted">Academias</p>
                <p className="text-xl font-bold text-duo-fg">{stats.gyms}</p>
              </div>
              <div className="rounded-xl border border-duo-border p-3">
                <p className="text-duo-fg-muted">Alunos</p>
                <p className="text-xl font-bold text-duo-fg">{stats.students}</p>
              </div>
              <div className="rounded-xl border border-duo-border p-3">
                <p className="text-duo-fg-muted">Via academia</p>
                <p className="text-xl font-bold text-duo-fg">
                  {stats.studentsViaGym}
                </p>
              </div>
              <div className="rounded-xl border border-duo-border p-3">
                <p className="text-duo-fg-muted">Independentes</p>
                <p className="text-xl font-bold text-duo-fg">
                  {stats.independentStudents}
                </p>
              </div>
            </div>
          </DuoCard.Root>
        </div>
      )}

      {tab === "students" && (
        <div className="mx-auto max-w-2xl space-y-3">
          <DuoCard.Root>
            <h2 className="text-lg font-bold text-duo-fg">Alunos atendidos</h2>
            <p className="mt-1 text-sm text-duo-fg-muted">
              Separação entre atendimento independente e vínculo via academia.
            </p>
          </DuoCard.Root>

          {students.length === 0 ? (
            <DuoCard.Root>
              <p className="text-sm text-duo-fg-muted">Nenhum aluno atribuído.</p>
            </DuoCard.Root>
          ) : (
            students.map((item) => (
              <DuoCard.Root key={item.id}>
                <p className="font-semibold text-duo-fg">
                  {item.student?.user?.name || "Aluno"}
                </p>
                <p className="mt-1 text-sm text-duo-fg-muted">
                  {item.gym?.name ? `Via ${item.gym.name}` : "Atendimento independente"}
                </p>
              </DuoCard.Root>
            ))
          )}
        </div>
      )}

      {tab === "gyms" && (
        <div className="mx-auto max-w-2xl space-y-3">
          <DuoCard.Root>
            <h2 className="text-lg font-bold text-duo-fg">Academias vinculadas</h2>
            <p className="mt-1 text-sm text-duo-fg-muted">
              Academias onde você atua e pode gerenciar recursos conforme vínculo.
            </p>
          </DuoCard.Root>

          {affiliations.length === 0 ? (
            <DuoCard.Root>
              <p className="text-sm text-duo-fg-muted">
                Nenhuma academia vinculada no momento.
              </p>
            </DuoCard.Root>
          ) : (
            affiliations.map((item) => (
              <DuoCard.Root key={item.id}>
                <p className="font-semibold text-duo-fg">{item.gym?.name || "Academia"}</p>
              </DuoCard.Root>
            ))
          )}
        </div>
      )}

      {tab === "more" && (
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
      )}
    </motion.div>
  );
}

export default function PersonalHome() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">Carregando...</div>
      }
    >
      <PersonalHomeContent />
    </Suspense>
  );
}
