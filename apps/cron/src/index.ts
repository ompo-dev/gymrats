import {
  resetStudentWeeklyOverride,
  runMembershipBillingWorkflow,
} from "@gymrats/workflows";
import { log } from "@gymrats/domain/log";

process.env.GYMRATS_RUNTIME_ROLE ??= "cron";

async function main() {
  const [weekReset, membershipBilling] = await Promise.all([
    resetStudentWeeklyOverride(),
    runMembershipBillingWorkflow(),
  ]);

  log.info("Cron week-reset completed", { result: weekReset });
  log.info("Cron membership-billing completed", { result: membershipBilling });
}

main().catch((error) => {
  log.error("Cron runtime failed", { error });
  process.exitCode = 1;
});
