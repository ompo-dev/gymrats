"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StepCard } from "@/components/ui/step-card";
import { EquipmentSearch } from "@/components/equipment-search";
import { Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepProps } from "./types";
import type { EquipmentItem } from "@/lib/equipment-database";

export function Step4({ formData, setFormData }: StepProps) {
  const [showEquipmentSearch, setShowEquipmentSearch] = useState(false);

  const equipmentGroups = useMemo(() => {
    const groups: Record<
      string,
      { equipment: EquipmentItem; quantity: number }
    > = {};

    formData.equipment.forEach((eq) => {
      if (groups[eq.id]) {
        groups[eq.id].quantity += 1;
      } else {
        groups[eq.id] = { equipment: eq, quantity: 1 };
      }
    });

    return Object.values(groups);
  }, [formData.equipment]);

  const handleAddEquipment = (
    equipmentWithQuantity: Array<{ equipment: EquipmentItem; quantity: number }>
  ) => {
    const newEquipment: EquipmentItem[] = [];

    equipmentWithQuantity.forEach(({ equipment, quantity }) => {
      for (let i = 0; i < quantity; i++) {
        newEquipment.push(equipment);
      }
    });

    setFormData({
      ...formData,
      equipment: [...formData.equipment, ...newEquipment],
    });
  };

  const handleRemoveEquipment = (equipmentId: string) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((eq) => eq.id !== equipmentId),
    });
  };

  const handleQuantityChange = (equipmentId: string, delta: number) => {
    const currentQuantity =
      equipmentGroups.find((g) => g.equipment.id === equipmentId)?.quantity ||
      0;

    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      handleRemoveEquipment(equipmentId);
      return;
    }

    const equipment = formData.equipment.find((eq) => eq.id === equipmentId);
    if (!equipment) return;

    const filtered = formData.equipment.filter((eq) => eq.id !== equipmentId);
    const toAdd: EquipmentItem[] = [];

    for (let i = 0; i < newQuantity; i++) {
      toAdd.push(equipment);
    }

    setFormData({
      ...formData,
      equipment: [...filtered, ...toAdd],
    });
  };

  return (
    <>
      <StepCard
        title="Equipamentos"
        description="Quais equipamentos sua academia possui?"
      >
        <div className="space-y-5">
          <Button
            onClick={() => setShowEquipmentSearch(true)}
            variant="default"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            ADICIONAR EQUIPAMENTOS
          </Button>

          {equipmentGroups.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="block text-sm font-bold text-gray-600">
                Equipamentos Adicionados ({equipmentGroups.length} tipo
                {equipmentGroups.length !== 1 ? "s" : ""} •{" "}
                {formData.equipment.length} total):
              </label>
              <div
                className="space-y-3 overflow-y-auto scrollbar-hide"
                style={{ maxHeight: "400px" }}
              >
                <AnimatePresence>
                  {equipmentGroups.map((group, index) => (
                    <motion.div
                      key={group.equipment.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900">
                          {group.equipment.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {group.equipment.category} • {group.equipment.type}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleQuantityChange(group.equipment.id, -1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-700 transition-all hover:bg-gray-100 active:scale-90"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-16 text-center">
                          <div className="text-sm font-bold text-gray-900">
                            {group.quantity}
                          </div>
                          <div className="text-xs text-gray-600">
                            {group.quantity === 1 ? "unidade" : "unidades"}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleQuantityChange(group.equipment.id, 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-orange bg-duo-orange text-white transition-all hover:bg-duo-orange/90 active:scale-90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveEquipment(group.equipment.id)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-300 bg-red-50 text-red-700 transition-all hover:bg-red-100 active:scale-90"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {formData.equipment.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center"
            >
              <p className="text-sm text-gray-600">
                Nenhum equipamento adicionado ainda. Clique no botão acima para
                adicionar.
              </p>
            </motion.div>
          )}
        </div>
      </StepCard>

      {showEquipmentSearch && (
        <EquipmentSearch
          onAddEquipment={handleAddEquipment}
          onClose={() => setShowEquipmentSearch(false)}
          selectedEquipment={formData.equipment}
        />
      )}
    </>
  );
}
