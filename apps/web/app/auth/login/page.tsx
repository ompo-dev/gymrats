import { redirect } from "next/navigation";
import { redirectAuthenticatedUser } from "@/lib/auth/server-route-guard";

/**
 * A rota /auth/login existe como ponto canonico de entrada.
 * Usuario autenticado vai para a area da role.
 * Usuario anonimo cai na experiencia publica em /welcome.
 */
export default async function LoginRedirectPage() {
  await redirectAuthenticatedUser();
  redirect("/welcome");
}
