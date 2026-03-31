interface RunOptimisticMutationOptions<Snapshot, Result> {
  getSnapshot: () => Snapshot;
  applyOptimistic: () => void;
  rollback: (snapshot: Snapshot) => void;
  execute: () => Promise<Result>;
  onSuccess?: (result: Result, snapshot: Snapshot) => Promise<void> | void;
}

export async function runOptimisticMutation<Snapshot, Result>({
  getSnapshot,
  applyOptimistic,
  rollback,
  execute,
  onSuccess,
}: RunOptimisticMutationOptions<Snapshot, Result>): Promise<Result> {
  const snapshot = getSnapshot();
  applyOptimistic();

  try {
    const result = await execute();
    await onSuccess?.(result, snapshot);
    return result;
  } catch (error) {
    rollback(snapshot);
    throw error;
  }
}
