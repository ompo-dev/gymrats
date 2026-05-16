import { afterEach, describe, expect, it } from "vitest";
import {
  getPayoutExecutionMode,
  shouldSimulatePayout,
} from "./payout-execution";

const originalMode = process.env.PAYOUT_EXECUTION_MODE;

describe("payout execution mode", () => {
  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env.PAYOUT_EXECUTION_MODE;
      return;
    }
    process.env.PAYOUT_EXECUTION_MODE = originalMode;
  });

  it("defaults to fake mode", () => {
    delete process.env.PAYOUT_EXECUTION_MODE;
    expect(getPayoutExecutionMode()).toBe("fake");
    expect(shouldSimulatePayout()).toBe(true);
  });

  it("uses real mode when configured", () => {
    process.env.PAYOUT_EXECUTION_MODE = "real";
    expect(getPayoutExecutionMode()).toBe("real");
    expect(shouldSimulatePayout()).toBe(false);
  });
});
