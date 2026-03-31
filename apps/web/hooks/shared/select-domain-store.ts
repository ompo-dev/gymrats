"use client";

interface DomainSelectionOptions<TState, TActions, TLoaders> {
  getActions: (state: TState) => TActions;
  getLoaders: (state: TState) => TLoaders;
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
