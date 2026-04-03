"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface FormBaseline<T> {
  baseline: T;
  draft: T;
  isDirty: boolean;
  setDraft: Dispatch<SetStateAction<T>>;
  rebaseOnSuccess: (nextDraft?: T) => void;
  rebaseFromExternalSnapshot: (nextDraft: T) => void;
  resetDraft: () => void;
}

interface UseFormBaselineOptions<TSnapshot, TDraft> {
  snapshot: TSnapshot;
  toDraft: (snapshot: TSnapshot) => TDraft;
  isEqual: (current: TDraft, next: TDraft) => boolean;
}

export function useFormBaseline<TSnapshot, TDraft>({
  snapshot,
  toDraft,
  isEqual,
}: UseFormBaselineOptions<TSnapshot, TDraft>): FormBaseline<TDraft> {
  const initialDraft = useMemo(() => toDraft(snapshot), [snapshot, toDraft]);
  const [baseline, setBaselineState] = useState<TDraft>(initialDraft);
  const [draft, setDraftState] = useState<TDraft>(initialDraft);

  const draftRef = useRef(draft);
  const baselineRef = useRef(baseline);
  const snapshotDraftRef = useRef(initialDraft);

  const setBaseline = useCallback((nextBaseline: TDraft) => {
    baselineRef.current = nextBaseline;
    setBaselineState(nextBaseline);
  }, []);

  const setDraft = useCallback<Dispatch<SetStateAction<TDraft>>>((value) => {
    setDraftState((current) => {
      const nextDraft =
        typeof value === "function"
          ? (value as (draft: TDraft) => TDraft)(current)
          : value;
      draftRef.current = nextDraft;
      return nextDraft;
    });
  }, []);

  const rebaseFromExternalSnapshot = useCallback(
    (nextDraft: TDraft) => {
      snapshotDraftRef.current = nextDraft;
      setBaseline(nextDraft);
      draftRef.current = nextDraft;
      setDraftState(nextDraft);
    },
    [setBaseline],
  );

  const rebaseOnSuccess = useCallback(
    (nextDraft?: TDraft) => {
      const resolvedDraft = nextDraft ?? draftRef.current;
      rebaseFromExternalSnapshot(resolvedDraft);
    },
    [rebaseFromExternalSnapshot],
  );

  const resetDraft = useCallback(() => {
    draftRef.current = baselineRef.current;
    setDraftState(baselineRef.current);
  }, []);

  useEffect(() => {
    const nextSnapshotDraft = toDraft(snapshot);

    if (isEqual(nextSnapshotDraft, snapshotDraftRef.current)) {
      return;
    }

    snapshotDraftRef.current = nextSnapshotDraft;

    if (!isEqual(draftRef.current, baselineRef.current)) {
      return;
    }

    rebaseFromExternalSnapshot(nextSnapshotDraft);
  }, [isEqual, rebaseFromExternalSnapshot, snapshot, toDraft]);

  return {
    baseline,
    draft,
    isDirty: !isEqual(draft, baseline),
    setDraft,
    rebaseOnSuccess,
    rebaseFromExternalSnapshot,
    resetDraft,
  };
}
