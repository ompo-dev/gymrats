import { PublicAuthEntry } from "@/app/_public/public-auth-entry";
import { redirectAuthenticatedUser } from "@/lib/auth/server-route-guard";

export default async function LoginPage() {
  await redirectAuthenticatedUser();
  return <PublicAuthEntry />;
}
