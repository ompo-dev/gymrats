export interface BridgeAuthorizationRequest {
  requestId: string;
  occurredAt: string;
  identifierType: string;
  identifierValue: string;
  metadata?: Record<string, unknown>;
}

export interface BridgeAuthorizationResponse {
  allowed: boolean;
  reasonCode: string;
  authorizationStatus: string;
  financialStatus: string;
  unlockWindowMs: number;
}

export interface BridgeAdapter {
  name: string;
  authorizePassage(input: BridgeAuthorizationResponse): Promise<void>;
  sendHeartbeat(): Promise<void>;
}
