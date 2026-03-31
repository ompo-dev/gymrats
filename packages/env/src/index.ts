export function getEnvBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}

export function getEnvString(
  value: string | undefined,
  fallback: string,
): string {
  if (value == null || value.trim() === "") {
    return fallback;
  }

  return value.trim();
}
