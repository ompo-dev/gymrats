"use client";

interface DomainSelectionOptions<TState, TActions, TLoaders> {
  getActions: (state: TState) => TActions;
  getLoaders: (state: TState) => TLoaders;
}

function isSelectionObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSelectionRecord(value: Record<string, unknown>) {
  return value as Record<string, unknown>;
}

function areSelectionObjectsEqual(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
) {
  const previousRecord = toSelectionRecord(previous);
  const nextRecord = toSelectionRecord(next);
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);

  if (previousKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of previousKeys) {
    if (!Object.hasOwn(next, key)) {
      return false;
    }

    const previousValue = previousRecord[key];
    const nextValue = nextRecord[key];

    if (key === "actions" || key === "loaders") {
      if (!isSelectionObject(previousValue) || !isSelectionObject(nextValue)) {
        return false;
      }

      const previousNestedKeys = Object.keys(previousValue);
      const nextNestedKeys = Object.keys(nextValue);
      const previousNestedRecord = toSelectionRecord(previousValue);
      const nextNestedRecord = toSelectionRecord(nextValue);

      if (previousNestedKeys.length !== nextNestedKeys.length) {
        return false;
      }

      for (const nestedKey of previousNestedKeys) {
        if (
          !Object.hasOwn(nextValue, nestedKey) ||
          !Object.is(
            previousNestedRecord[nestedKey],
            nextNestedRecord[nestedKey],
          )
        ) {
          return false;
        }
      }

      continue;
    }

    if (!Object.is(previousValue, nextValue)) {
      return false;
    }
  }

  return true;
}

export function areDomainSelectionsEqual(previous: unknown, next: unknown) {
  if (Object.is(previous, next)) {
    return true;
  }

  if (!isSelectionObject(previous) || !isSelectionObject(next)) {
    return false;
  }

  return areSelectionObjectsEqual(previous, next);
}

export function selectDomainStoreSlice<
  TState extends { data: TData },
  TData extends object,
  TSelector extends keyof TData | "actions" | "loaders",
  TActions,
  TLoaders,
>(
  state: TState,
  selectors: readonly TSelector[],
  {
    getActions,
    getLoaders,
  }: DomainSelectionOptions<TState, TActions, TLoaders>,
): unknown {
  if (selectors.length === 0) {
    return state.data;
  }

  if (selectors.length === 1) {
    const selector = selectors[0];

    if (selector === "actions") {
      return getActions(state);
    }

    if (selector === "loaders") {
      return getLoaders(state);
    }

    const dataSelector = selector as Exclude<TSelector, "actions" | "loaders"> &
      keyof TData;
    return state.data[dataSelector];
  }

  const result: Record<string, unknown> = {};

  for (const selector of selectors) {
    if (selector === "actions") {
      result.actions = getActions(state);
      continue;
    }

    if (selector === "loaders") {
      result.loaders = getLoaders(state);
      continue;
    }

    const dataSelector = selector as Exclude<TSelector, "actions" | "loaders"> &
      keyof TData;
    result[String(dataSelector)] = state.data[dataSelector];
  }

  return result;
}

export function createStableDomainSelector<
  TState extends { data: TData },
  TData extends object,
  TSelector extends keyof TData | "actions" | "loaders",
  TActions,
  TLoaders,
>(
  selectors: readonly TSelector[],
  options: DomainSelectionOptions<TState, TActions, TLoaders>,
) {
  let previousSelection: unknown;
  let hasPreviousSelection = false;

  return (state: TState) => {
    const nextSelection = selectDomainStoreSlice<
      TState,
      TData,
      TSelector,
      TActions,
      TLoaders
    >(state, selectors, options);

    if (
      hasPreviousSelection &&
      areDomainSelectionsEqual(previousSelection, nextSelection)
    ) {
      return previousSelection;
    }

    previousSelection = nextSelection;
    hasPreviousSelection = true;
    return nextSelection;
  };
}
