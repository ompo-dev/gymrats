"use client";

import { useEffect, useMemo, useRef } from "react";
import { GymEquipmentPage } from "@/components/organisms/gym/gym-equipment";
import { useGym } from "@/hooks/use-gym";
import { useGymBootstrapBridge } from "@/hooks/use-gym-bootstrap";
import type { Equipment } from "@/lib/types";

interface EquipmentPageContentProps {
  equipment: Equipment[];
}

export default function EquipmentPageContent({
  equipment,
}: EquipmentPageContentProps) {
  useGymBootstrapBridge(["equipment"]);

  const actions = useGym("actions");
  const storeEquipment = useGym("equipment");
  const lastHydrationKeyRef = useRef<string | null>(null);
  const hydrationKey = useMemo(() => JSON.stringify(equipment), [equipment]);

  useEffect(() => {
    if (lastHydrationKeyRef.current === hydrationKey) {
      return;
    }

    lastHydrationKeyRef.current = hydrationKey;
    actions.hydrateInitial({ equipment });
  }, [actions, equipment, hydrationKey]);

  return <GymEquipmentPage equipment={storeEquipment ?? equipment} />;
}
