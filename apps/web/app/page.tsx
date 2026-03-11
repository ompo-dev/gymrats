"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/marketing/landing-page";
import { LoadingScreen } from "@/components/organisms/loading-screen";
import { useUserSession } from "@/hooks/use-user-session";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { userSession, role, isLoading: isValidating } = useUserSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isValidating || !role) return;

    if (role === "PENDING") {
      router.replace("/auth/register/user-type");
      return;
    }

    if (role === "STUDENT" || role === "ADMIN") {
      router.replace("/student");
      return;
    }

    if (role === "GYM") {
      router.replace("/gym");
      return;
    }

    if (role === "PERSONAL") {
      router.replace("/personal");
    }
  }, [router, mounted, isValidating, role]);

  if (!mounted || isValidating) {
    return (
      <LoadingScreen.Simple variant="student" message="Iniciando GymRats..." />
    );
  }

  if (userSession) {
    return (
      <LoadingScreen.Simple variant="student" message="Redirecionando..." />
    );
  }

  return <LandingPage />;
}
