import { actionClient as apiClient } from "@/lib/actions/client";

export type JobStatus =
  | "waiting"
  | "waiting-children"
  | "delayed"
  | "prioritized"
  | "active"
  | "completed"
  | "failed"
  | "unknown";

type JobStatusResponse<T> = {
  jobId: string;
  status: JobStatus;
  result?: T | null;
  error?: string | null;
};

async function getJobStatus<T>(jobId: string) {
  const response = await apiClient.get<JobStatusResponse<T>>(
    `/api/jobs/${jobId}`,
    {
      timeout: 30000,
    },
  );
  return response.data;
}

export async function waitForJobCompletion<T>(
  jobId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
  } = {},
) {
  const intervalMs = options.intervalMs ?? 800;
  const timeoutMs = options.timeoutMs ?? 90_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = await getJobStatus<T>(jobId);

    if (status.status === "completed") {
      return status.result ?? null;
    }

    if (status.status === "failed") {
      throw new Error(status.error || "Job falhou");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Timeout aguardando processamento do job");
}
