import { resetStudentWeeklyOverride } from "@gymrats/workflows";

process.env.GYMRATS_RUNTIME_ROLE ??= "cron";

async function main() {
  const result = await resetStudentWeeklyOverride();
  console.log("[cron] week-reset completed", result);
}

main().catch((error) => {
  console.error("[cron] week-reset failed", error);
  process.exitCode = 1;
});
