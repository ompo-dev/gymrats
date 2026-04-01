import type { BridgeAdapter, BridgeAuthorizationRequest } from "./types";

class NoopAdapter implements BridgeAdapter {
  name = "noop";

  async authorizePassage() {
    return;
  }

  async sendHeartbeat() {
    return;
  }
}

async function main() {
  const adapter = new NoopAdapter();
  const sampleRequest: BridgeAuthorizationRequest = {
    requestId: "sample-request",
    occurredAt: new Date().toISOString(),
    identifierType: "rfid",
    identifierValue: "CARD-001",
  };

  console.log("[bridge] runtime started", {
    adapter: adapter.name,
    sampleRequest,
  });
  await adapter.sendHeartbeat();
}

main().catch((error) => {
  console.error("[bridge] failed", error);
  process.exitCode = 1;
});
