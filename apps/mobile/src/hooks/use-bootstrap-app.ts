import { useEffect } from "react";
import { useAppStore } from "../store/app-store";

export function useBootstrapApp() {
  const hydrated = useAppStore((state) => state.hydrated);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    if (hydrated) {
      return;
    }

    void hydrate();
  }, [hydrate, hydrated]);

  return hydrated;
}
