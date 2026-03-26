"use client";

import { useCallback, useMemo, useState } from "react";

interface UseControllableStateOptions<TValue> {
  prop?: TValue;
  defaultProp?: TValue;
  onChange?: (value: TValue) => void;
}

export function useControllableState<TValue>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateOptions<TValue>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultProp);
  const isControlled = prop !== undefined;
  const value = useMemo(
    () => (isControlled ? prop : uncontrolledValue),
    [isControlled, prop, uncontrolledValue],
  );

  const setValue = useCallback(
    (nextValue: TValue) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  return [value, setValue] as const;
}
