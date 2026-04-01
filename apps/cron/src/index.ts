import {
  resetStudentWeeklyOverride,
  runMembershipBillingWorkflow,
} from "@gymrats/workflows";

process.env.GYMRATS_RUNTIME_ROLE ??= "cron";

async function main() {
  const [weekReset, membershipBilling] = await Promise.all([
    resetStudentWeeklyOverride(),
    runMembershipBillingWorkflow(),
  ]);

  console.log("[cron] week-reset completed", weekReset);
  console.log("[cron] membership-billing completed", membershipBilling);
}

main().catch((error) => {
  console.error("[cron] week-reset failed", error);
  process.exitCode = 1;
});
