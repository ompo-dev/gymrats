import type { AuthRole } from "../store/types";

export function getRoleHomePath(role: AuthRole | null) {
  if (!role) {
    return "";
  }

  if (role === "PENDING") {
    return "/auth/register/user-type";
  }

  if (role === "GYM") {
    return "/gym";
  }

  if (role === "PERSONAL") {
    return "/personal";
  }

  return "/student";
}
