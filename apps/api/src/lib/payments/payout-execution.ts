export type PayoutExecutionMode = "fake" | "real";

const DEFAULT_MODE: PayoutExecutionMode = "fake";

export function getPayoutExecutionMode(): PayoutExecutionMode {
  const mode = process.env.PAYOUT_EXECUTION_MODE?.trim().toLowerCase();
  if (mode === "real") {
    return "real";
  }

  return DEFAULT_MODE;
}

export function shouldSimulatePayout() {
  return getPayoutExecutionMode() === "fake";
}
