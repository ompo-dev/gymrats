"use client";

import { Search, X, Filter } from "lucide-react";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { SlideIn } from "@/components/animations/slide-in";

interface LessonFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categoryOptions: { value: string; label: string; emoji: string }[];
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: string) => void;
}

export function LessonFilters({
  searchQuery,
  selectedCategory,
  categoryOptions,
  onSearchChange,
  onCategoryChange,
}: LessonFiltersProps) {
  return (
    <SlideIn delay={0.1}>
      <SectionCard title="Buscar e Filtrar" icon={Filter}>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar lições..."
              className="w-full rounded-xl border-2 border-gray-300 bg-white py-3 pl-12 pr-10 font-semibold text-duo-text placeholder:text-duo-gray-dark focus:border-duo-blue focus:outline-none focus:ring-2 focus:ring-duo-blue/20"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-duo-gray-dark transition-colors hover:bg-gray-100 hover:text-duo-text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <div className="mb-2 text-xs font-bold text-duo-gray-dark">
              CATEGORIA
            </div>
            <OptionSelector
              options={categoryOptions}
              value={selectedCategory}
              onChange={onCategoryChange}
              layout="grid"
              columns={3}
              size="sm"
              textAlign="center"
              animate={true}
            />
          </div>
        </div>
      </SectionCard>
    </SlideIn>
  );
}
