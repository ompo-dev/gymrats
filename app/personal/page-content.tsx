"use client";

import { motion } from "motion/react";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";
import type {
  PersonalAffiliation,
  PersonalProfile,
  PersonalStudentAssignment,
  PersonalSubscriptionData,
} from "./types";
import { PersonalDashboardPageContent } from "./_dashboard/page-content";
import { PersonalFinancialPageContent } from "./_financial/page-content";
import { PersonalGymsPageContent } from "./_gyms/page-content";
import { PersonalSettingsPageContent } from "./_settings/page-content";
import { PersonalStudentsPageContent } from "./_students/page-content";
import { PersonalMoreMenu } from "@/components/organisms/navigation/personal-more-menu";

function PersonalHomeContent() {
  const [tab] = useQueryState("tab", parseAsString.withDefault("dashboard"));
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [affiliations, setAffiliations] = useState<PersonalAffiliation[]>([]);
  const [students, setStudents] = useState<PersonalStudentAssignment[]>([]);
  const [subscription, setSubscription] =
    useState<PersonalSubscriptionData | null>(null);

  const load = async () => {
    try {
      const [profileRes, affiliationsRes, studentsRes, subscriptionRes] =
        await Promise.all([
          apiClient.get<{ personal: PersonalProfile | null }>(
            "/api/personals",
          ),
          apiClient.get<{ affiliations: PersonalAffiliation[] }>(
            "/api/personals/affiliations",
          ),
          apiClient.get<{ students: PersonalStudentAssignment[] }>(
            "/api/personals/students",
          ),
          apiClient
            .get<{ subscription: PersonalSubscriptionData | null }>(
              "/api/personals/subscription",
            )
            .catch(() => ({ data: { subscription: null } })),
        ]);

      setProfile(profileRes.data.personal);
      setAffiliations(affiliationsRes.data.affiliations || []);
      setStudents(studentsRes.data.students || []);
      setSubscription(subscriptionRes.data.subscription ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <p className="text-sm text-duo-fg-muted">
          Carregando área do personal...
        </p>
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
        <PersonalDashboardPageContent profile={profile} stats={stats} />
      )}
      {tab === "students" && (
        <PersonalStudentsPageContent
          students={students}
          affiliations={affiliations}
          onRefresh={load}
        />
      )}
      {tab === "gyms" && (
        <PersonalGymsPageContent
          affiliations={affiliations}
          onRefresh={load}
        />
      )}
      {tab === "financial" && (
        <PersonalFinancialPageContent
          subscription={subscription}
          onRefresh={load}
        />
      )}
      {tab === "settings" && (
        <PersonalSettingsPageContent profile={profile} />
      )}
      {tab === "more" && <PersonalMoreMenu.Simple />}
    </motion.div>
  );
}

export default function PersonalHome() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          Carregando...
        </div>
      }
    >
      <PersonalHomeContent />
    </Suspense>
  );
}
