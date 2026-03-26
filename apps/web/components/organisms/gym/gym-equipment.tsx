"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { GymEquipmentScreen } from "@/components/screens/gym";
import type { Equipment } from "@/lib/types";
import {
  normalizeEquipmentItem,
  normalizeEquipmentList,
} from "@/lib/utils/gym/normalize-equipment";
import { AddEquipmentModal } from "./add-equipment-modal";
import { GymEquipmentDetail } from "./gym-equipment-detail";

interface GymEquipmentPageProps {
  equipment: Equipment[];
}

type EquipmentStatusFilter =
  | "all"
  | "available"
  | "in-use"
  | "maintenance"
  | "broken";

export function GymEquipmentPage({
  equipment: initialEquipment,
}: GymEquipmentPageProps) {
  const [equipmentList, setEquipmentList] = useState(() =>
    normalizeEquipmentList(initialEquipment),
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("all"),
  );
  const [equipmentId, setEquipmentId] = useQueryState("equipmentId");

  useEffect(() => {
    setEquipmentList(normalizeEquipmentList(initialEquipment));
  }, [initialEquipment]);

  const filteredEquipment = equipmentList.filter((item) => {
    const name = item.name ?? "";
    const type = item.type ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statsOverview = {
    total: equipmentList.length,
    available: equipmentList.filter((item) => item.status === "available")
      .length,
    inUse: equipmentList.filter((item) => item.status === "in-use").length,
    maintenance: equipmentList.filter(
      (item) => item.status === "maintenance",
    ).length,
  };

  if (equipmentId) {
    const equipmentItem = equipmentList.find((item) => item.id === equipmentId);

    return (
      <GymEquipmentDetail
        equipment={equipmentItem || null}
        onBack={() => setEquipmentId(null)}
      />
    );
  }

  return (
    <>
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newEquipment) => {
          setEquipmentList((current) => [
            normalizeEquipmentItem(newEquipment),
            ...current,
          ]);
          setIsAddModalOpen(false);
        }}
      />

      <GymEquipmentScreen
        equipment={filteredEquipment}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        statsOverview={statsOverview}
        onSearchQueryChange={setSearchQuery}
        onStatusFilterChange={(value) =>
          setStatusFilter(value as EquipmentStatusFilter)
        }
        onOpenAddEquipment={() => setIsAddModalOpen(true)}
        onSelectEquipment={(nextEquipmentId) => setEquipmentId(nextEquipmentId)}
      />
    </>
  );
}
