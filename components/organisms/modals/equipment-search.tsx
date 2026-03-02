"use client";

import { Minus, Plus, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { DuoButton, DuoSelect } from "@/components/duo";
import type { EquipmentItem } from "@/lib/equipment-database";
import { equipmentDatabase } from "@/lib/equipment-database";

interface EquipmentSearchProps {
  onAddEquipment: (
    equipment: Array<{ equipment: EquipmentItem; quantity: number }>,
  ) => void;
  onClose: () => void;
  selectedEquipment?: EquipmentItem[];
}

function EquipmentSearchSimple({
  onAddEquipment,
  onClose,
  selectedEquipment = [],
}: EquipmentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>(
    () => selectedEquipment.map((eq) => eq.id),
  );
  const [equipmentQuantities, setEquipmentQuantities] = useState<
    Record<string, number>
  >(() => {
    const initial: Record<string, number> = {};
    selectedEquipment.forEach((eq) => {
      initial[eq.id] = 1;
    });
    return initial;
  });

  const filteredEquipment = equipmentDatabase.filter((equipment) =>
    equipment.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleEquipmentSelection = (equipmentId: string) => {
    setSelectedEquipmentIds((prev) => {
      if (prev.includes(equipmentId)) {
        const newQuantities = { ...equipmentQuantities };
        delete newQuantities[equipmentId];
        setEquipmentQuantities(newQuantities);
        return prev.filter((id) => id !== equipmentId);
      } else {
        setEquipmentQuantities((prev) => ({ ...prev, [equipmentId]: 1 }));
        return [...prev, equipmentId];
      }
    });
  };

  const handleQuantityChange = (equipmentId: string, delta: number) => {
    setEquipmentQuantities((prev) => {
      const current = prev[equipmentId] || 1;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [equipmentId]: newValue };
    });
  };

  const handleAddEquipment = () => {
    if (selectedEquipmentIds.length > 0) {
      const equipmentToAdd = selectedEquipmentIds
        .map((id) => {
          const equipment = equipmentDatabase.find((eq) => eq.id === id);
          if (!equipment) return null;
          return {
            equipment,
            quantity: equipmentQuantities[id] || 1,
          };
        })
        .filter(Boolean) as Array<{
        equipment: EquipmentItem;
        quantity: number;
      }>;

      if (equipmentToAdd.length > 0) {
        onAddEquipment(equipmentToAdd);
        onClose();
      }
    }
  };

  const hasSelectedEquipment = selectedEquipmentIds.length > 0;

  const equipmentOptions = filteredEquipment.map((equipment) => ({
    value: equipment.id,
    label: equipment.name,
    description: `${equipment.category} • ${equipment.type}`,
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="w-full max-w-2xl rounded-t-3xl bg-duo-bg-card sm:rounded-3xl sm:scale-100"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="border-b-2 border-duo-border p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-duo-fg">
                Adicionar Equipamentos
              </h2>
              <DuoButton
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
              >
                ✕
              </DuoButton>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-fg-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar equipamentos..."
                className="w-full rounded-xl border-2 border-duo-border bg-duo-bg-card py-3 pl-12 pr-4 font-bold text-duo-fg placeholder:text-duo-fg-muted focus:border-duo-orange focus:outline-none"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex-1 overflow-y-auto p-6"
            style={{ maxHeight: "50vh" }}
          >
            {filteredEquipment.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center text-duo-fg-muted"
              >
                Nenhum equipamento encontrado
              </motion.div>
            ) : (
              <DuoSelect.Simple
                options={equipmentOptions}
                value={selectedEquipmentIds}
                onChange={handleEquipmentSelection}
                multiple
                placeholder="Selecione os equipamentos"
              />
            )}
          </motion.div>

          <AnimatePresence>
            {hasSelectedEquipment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="border-t-2 border-duo-border p-6 space-y-4"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="mb-3 block text-sm font-bold text-duo-fg-muted">
                    Ajustar Quantidade ({selectedEquipmentIds.length}{" "}
                    equipamento
                    {selectedEquipmentIds.length !== 1 ? "s" : ""} selecionado
                    {selectedEquipmentIds.length !== 1 ? "s" : ""})
                  </label>
                  <div
                    className="space-y-3 overflow-y-auto scrollbar-hide"
                    style={{ maxHeight: "240px" }}
                  >
                    <AnimatePresence>
                      {selectedEquipmentIds.map((equipmentId, index) => {
                        const equipment = equipmentDatabase.find(
                          (eq) => eq.id === equipmentId,
                        );
                        if (!equipment) return null;
                        const quantity = equipmentQuantities[equipmentId] || 1;
                        return (
                          <motion.div
                            key={equipmentId}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, height: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            className="flex items-center justify-between rounded-xl border-2 border-duo-border bg-duo-bg-elevated p-3"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-bold text-duo-fg">
                                {equipment.name}
                              </div>
                              <div className="text-xs text-duo-fg-muted">
                                {equipment.category} • {equipment.type}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  handleQuantityChange(equipmentId, -1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-border bg-duo-bg-card text-duo-fg transition-all hover:bg-duo-bg-elevated active:scale-90"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <div className="w-16 text-center">
                                <div className="text-sm font-bold text-duo-fg">
                                  {quantity}
                                </div>
                                <div className="text-xs text-duo-fg-muted">
                                  {quantity === 1 ? "unidade" : "unidades"}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleQuantityChange(equipmentId, 1)
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-duo-orange bg-duo-orange text-white transition-all hover:bg-duo-orange/90 active:scale-90"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
                <DuoButton
                  onClick={handleAddEquipment}
                  variant="primary"
                  className="w-full"
                >
                  <Plus className="h-5 w-5" />
                  ADICIONAR {selectedEquipmentIds.length} EQUIPAMENTO
                  {selectedEquipmentIds.length !== 1 ? "S" : ""}
                </DuoButton>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const EquipmentSearch = { Simple: EquipmentSearchSimple };
