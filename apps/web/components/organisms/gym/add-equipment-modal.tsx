"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DuoButton, DuoInput, DuoSelect } from "@/components/duo";
import { Label } from "@/components/molecules/forms/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGym } from "@/hooks/use-gym";
import type { Equipment } from "@/lib/types";

const EQUIPMENT_TYPES = [
  "Musculação",
  "Cardio",
  "Funcional",
  "Cross",
  "Pilates",
  "Pesos Livres",
];

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEquipment: Equipment) => void;
  equipmentToEdit?: Equipment | null;
}

export function AddEquipmentModal({
  isOpen,
  onClose,
  onSuccess,
  equipmentToEdit,
}: AddEquipmentModalProps) {
  const { actions, loaders } = useGym("actions", "loaders");
  const [form, setForm] = useState({
    name: "",
    type: "Musculação",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    status: "available",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (equipmentToEdit) {
        setForm({
          name: equipmentToEdit.name,
          type:
            equipmentToEdit.type.charAt(0).toUpperCase() +
            equipmentToEdit.type.slice(1).toLowerCase(),
          brand: equipmentToEdit.brand || "",
          model: equipmentToEdit.model || "",
          serialNumber: equipmentToEdit.serialNumber || "",
          purchaseDate: equipmentToEdit.purchaseDate
            ? new Date(equipmentToEdit.purchaseDate).toISOString().split("T")[0]
            : "",
          status: equipmentToEdit.status,
        });
      } else {
        setForm({
          name: "",
          type: "Musculação",
          brand: "",
          model: "",
          serialNumber: "",
          purchaseDate: "",
          status: "available",
        });
      }
      setError("");
    }
  }, [isOpen, equipmentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        status: form.status as Equipment["status"],
      };
      if (equipmentToEdit) {
        await actions.updateEquipment(equipmentToEdit.id, payload);
      } else {
        await actions.createEquipment(payload);
      }
      await loaders.loadSection("equipment");
      onSuccess({
        id: equipmentToEdit?.id || `${Date.now()}`,
        name: form.name,
        type: form.type,
        brand: form.brand || "",
        model: form.model || "",
        serialNumber: form.serialNumber || "",
        status: form.status as Equipment["status"],
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
        lastMaintenance: equipmentToEdit?.lastMaintenance ?? null,
        nextMaintenance: equipmentToEdit?.nextMaintenance ?? null,
        usageStats: equipmentToEdit?.usageStats ?? {
          totalUses: 0,
          avgUsageTime: 0,
          popularTimes: [],
        },
        maintenanceHistory: equipmentToEdit?.maintenanceHistory ?? [],
      } as Equipment);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {equipmentToEdit ? "Editar Equipamento" : "Adicionar Equipamento"}
          </DialogTitle>
          <DialogDescription>
            {equipmentToEdit
              ? "Atualize os dados do equipamento abaixo."
              : "Preencha os dados do novo equipamento."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <DuoInput.Simple
            id="name"
            label="Nome *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Supino Reto"
          />

          <div className="grid gap-2">
            <Label>Tipo *</Label>
            <DuoSelect.Simple
              options={EQUIPMENT_TYPES.map((t) => ({ value: t, label: t }))}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              placeholder="Selecione o tipo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DuoInput.Simple
              id="brand"
              label="Marca"
              value={form.brand}
              onChange={(e) =>
                setForm((f) => ({ ...f, brand: e.target.value }))
              }
              placeholder="Ex: Technogym"
            />
            <DuoInput.Simple
              id="model"
              label="Modelo"
              value={form.model}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
              placeholder="Ex: Selection 900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DuoInput.Simple
              id="serialNumber"
              label="Nº Série"
              value={form.serialNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, serialNumber: e.target.value }))
              }
              placeholder="Ex: SN123456"
            />
            <DuoInput.Simple
              id="purchaseDate"
              label="Data Aquisição"
              type="date"
              value={form.purchaseDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, purchaseDate: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <DuoSelect.Simple
              options={[
                { value: "available", label: "Disponível" },
                { value: "in-use", label: "Em Uso (Manual)" },
                { value: "maintenance", label: "Manutenção" },
                { value: "broken", label: "Quebrado" },
              ]}
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              placeholder="Status"
            />
          </div>

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </div>

        <DialogFooter>
          <DuoButton variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </DuoButton>
          <DuoButton onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {equipmentToEdit ? "Salvar Alterações" : "Adicionar"}
          </DuoButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
