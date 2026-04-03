import { GymAccessEligibilityService } from "@gymrats/domain/services/gym/gym-access-eligibility.service";

export async function runMembershipBillingWorkflow() {
  const result = await GymAccessEligibilityService.runRecurringBilling();

  return {
    success: true,
    ...result,
    message: "Membership billing workflow executed",
  };
}
