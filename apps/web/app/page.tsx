import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";
import { readAuthSession } from "@/lib/actions/auth-readers";
import { getDefaultRouteForRole } from "@/lib/auth/route-access";

export default async function Home() {
  const session = await readAuthSession().catch(() => null);
  const role = session?.user?.role ?? null;

  if (role) {
    redirect(getDefaultRouteForRole(role));
  }

  return <LandingPage />;
}
