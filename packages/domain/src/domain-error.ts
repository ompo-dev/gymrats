export type DomainErrorDetails =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>
  | unknown[];

export type DomainErrorInput = {
  status: number;
  code: string;
  message: string;
  details?: DomainErrorDetails;
};

export class DomainError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: DomainErrorDetails;

  constructor(input: DomainErrorInput) {
    super(input.message);
    this.name = "DomainError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
  }
}

function isValidHttpStatus(status: unknown): status is number {
  return (
    typeof status === "number" &&
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
  );
}

export function isDomainError(error: unknown): error is DomainError {
  if (error instanceof DomainError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: unknown;
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  return (
    candidate.name === "DomainError" &&
    isValidHttpStatus(candidate.status) &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}
