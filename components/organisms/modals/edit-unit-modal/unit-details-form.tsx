"use client";

import { Loader2, RotateCcw, Save } from "lucide-react";
import { DuoButton } from "@/components/duo";

export interface UnitDetailsFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTitleFocus?: () => void;
  onTitleBlur?: () => void;
  onDescriptionFocus?: () => void;
  onDescriptionBlur?: () => void;
  onSave: () => void;
  isWeeklyPlanMode?: boolean;
  onResetWeek?: () => void;
  resetting?: boolean;
  onSaveAsTemplate?: () => void;
  savingTemplate?: boolean;
}

export function UnitDetailsForm({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onTitleFocus,
  onTitleBlur,
  onDescriptionFocus,
  onDescriptionBlur,
  onSave,
  isWeeklyPlanMode,
  onResetWeek,
  resetting = false,
  onSaveAsTemplate,
  savingTemplate = false,
}: UnitDetailsFormProps) {
  return (
    <div className="space-y-4 bg-duo-bg-card p-6 rounded-2xl shadow-sm border border-duo-border">
      <div>
        <label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
          Nome do Plano
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onFocus={onTitleFocus}
          onBlur={onTitleBlur}
          className="w-full px-4 py-3 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all font-bold text-lg"
          placeholder="Ex: Treino de Hipertrofia"
        />
      </div>
      <div>
        <label className="text-xs font-bold text-duo-fg-muted uppercase tracking-wider mb-2 block">
          Descrição
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onFocus={onDescriptionFocus}
          onBlur={onDescriptionBlur}
          className="w-full px-4 py-3 rounded-xl bg-duo-bg-elevated border border-duo-border focus:outline-none focus:ring-2 focus:ring-duo-green/20 focus:border-duo-green transition-all resize-none h-24"
          placeholder="Descreva o objetivo deste plano..."
        />
      </div>
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex justify-end gap-2">
          {isWeeklyPlanMode && onResetWeek && (
            <DuoButton
              variant="outline"
              onClick={onResetWeek}
              disabled={resetting}
              className="font-bold flex items-center gap-2 w-full"
            >
              {resetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Resetar
            </DuoButton>
          )}
          <DuoButton
            onClick={onSave}
            className="bg-duo-green hover:bg-duo-green-dark text-white font-bold flex items-center gap-2 w-full"
          >
            <Save className="h-4 w-4" />
            Salvar
          </DuoButton>
        </div>
        
        {isWeeklyPlanMode && onSaveAsTemplate && (
          <DuoButton
            variant="ghost"
            onClick={onSaveAsTemplate}
            disabled={savingTemplate}
            className="font-bold flex items-center justify-center gap-2 w-full border border-dashed border-duo-green text-duo-green hover:bg-duo-green/10"
          >
            {savingTemplate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar como Modelo na Biblioteca
          </DuoButton>
        )}
      </div>
    </div>
  );
}
