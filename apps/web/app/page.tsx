import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { readAuthSession } from "@/lib/actions/auth-readers";

export default async function Home() {
  const session = await readAuthSession().catch(() => null);
  const role = session?.user?.role ?? null;

  if (role === "PENDING") {
    redirect("/auth/register/user-type");
  }

  if (role === "STUDENT" || role === "ADMIN") {
    redirect("/student");
  }

  if (role === "GYM") {
    redirect("/gym");
  }

  if (role === "PERSONAL") {
    redirect("/personal");
  }

  return <LandingPage />;
}
