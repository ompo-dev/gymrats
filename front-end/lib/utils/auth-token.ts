export function persistAuthToken(token: string) {
  if (!token || typeof document === "undefined") {
    return;
  }

  const isSecure = window.location.protocol === "https:";
  const secureFlag = isSecure ? "; Secure" : "";
  document.cookie = `auth_token=${encodeURIComponent(
    token
  )}; Path=/; SameSite=Lax${secureFlag}`;
}
