"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    actions.hydrateInitial({ equipment });
  }, [actions, equipment]);

  return <GymEquipmentPage equipment={storeEquipment ?? equipment} />;
}
