"use client";

import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { DuoButton, DuoCard } from "@/components/duo";
import { EquipmentSearch } from "@/components/organisms/modals/equipment-search";
import type { EquipmentItem } from "@/lib/equipment-database";
import type { StepProps } from "./types";

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
    equipmentWithQuantity: Array<{
      equipment: EquipmentItem;
      quantity: number;
    }>,
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
      <motion.div
        initial={{ opacity: 0, x: 50, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <DuoCard.Root
          variant="outlined"
          padding="lg"
          className="border-2 border-duo-border bg-duo-bg-card shadow-2xl backdrop-blur-md"
        >
          <div className="mb-6 text-center">
            <h2 className="mb-2 text-2xl font-bold text-duo-fg">
              Equipamentos
            </h2>
            <p className="text-sm text-duo-fg-muted">
              Quais equipamentos sua academia possui?
            </p>
          </div>
          <div className="space-y-5">
            <DuoButton
              onClick={() => setShowEquipmentSearch(true)}
              variant="primary"
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              ADICIONAR EQUIPAMENTOS
            </DuoButton>

            {equipmentGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <span className="block text-sm font-bold text-duo-fg-muted">
                  Equipamentos Adicionados ({equipmentGroups.length} tipo
                  {equipmentGroups.length !== 1 ? "s" : ""} •{" "}
                  {formData.equipment.length} total):
                </span>
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
                        className="flex items-center justify-between rounded-xl border-2 border-duo-border bg-duo-bg-card p-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-bold text-duo-fg">
                            {group.equipment.name}
                          </div>
                          <div className="text-xs text-duo-fg-muted">
                            {group.equipment.category} • {group.equipment.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(group.equipment.id, -1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-border bg-duo-bg-card text-duo-fg transition-all hover:bg-duo-bg-elevated active:scale-90"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <div className="w-16 text-center">
                            <div className="text-sm font-bold text-duo-fg">
                              {group.quantity}
                            </div>
                            <div className="text-xs text-duo-fg-muted">
                              {group.quantity === 1 ? "unidade" : "unidades"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(group.equipment.id, 1)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-orange bg-duo-orange text-white transition-all hover:bg-duo-orange/90 active:scale-90"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveEquipment(group.equipment.id)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-danger/50 bg-duo-danger/10 text-duo-danger transition-all hover:bg-duo-danger/20 active:scale-90"
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
                className="rounded-xl border-2 border-dashed border-duo-border bg-duo-bg-elevated p-8 text-center"
              >
                <p className="text-sm text-duo-fg-muted">
                  Nenhum equipamento adicionado ainda. Clique no botão acima
                  para adicionar.
                </p>
              </motion.div>
            )}
          </div>
        </DuoCard.Root>
      </motion.div>

      {showEquipmentSearch && (
        <EquipmentSearch.Simple
          onAddEquipment={handleAddEquipment}
          onClose={() => setShowEquipmentSearch(false)}
          selectedEquipment={formData.equipment}
        />
      )}
    </>
  );
}
