export function getEnvBoolean(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() !== "false";
}
