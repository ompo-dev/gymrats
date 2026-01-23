/**
 * @deprecated Este arquivo é temporário para manter compatibilidade durante a migração Atomic Design
 * 
 * Os componentes foram movidos para a estrutura Atomic Design:
 * - Atoms: components/atoms/
 * - Molecules: components/molecules/
 * - Organisms: components/organisms/
 * - Templates: components/templates/
 * 
 * Atualize seus imports para usar os novos caminhos.
 */

// Re-exportar atoms
export { Button, buttonVariants } from "../atoms/buttons/button";
export { DuoButton, duoButtonVariants } from "../atoms/buttons/duo-button";
export type { DuoButtonProps } from "../atoms/buttons/duo-button";
export { Input } from "../atoms/inputs/input";
export { Textarea } from "../atoms/inputs/textarea";
export { Select, SelectOption } from "../atoms/inputs/select";
export { Progress } from "../atoms/progress/progress";
export { ProgressRing } from "../atoms/progress/progress-ring";

// Re-exportar molecules
export { DuoCard, duoCardVariants } from "../molecules/cards/duo-card";
export type { DuoCardProps } from "../molecules/cards/duo-card";
export { SectionCard } from "../molecules/cards/section-card";
export type { SectionCardProps } from "../molecules/cards/section-card";
export { StatCardLarge } from "../molecules/cards/stat-card-large";
export type { StatCardLargeProps } from "../molecules/cards/stat-card-large";
export { StatCard } from "../molecules/cards/stat-card";
export type { StatCardProps } from "../molecules/cards/stat-card";
export { MacroCard } from "../molecules/cards/macro-card";
export type { MacroCardProps } from "../molecules/cards/macro-card";
export { MealCard } from "../molecules/cards/meal-card";
export type { MealCardProps } from "../molecules/cards/meal-card";
export { HistoryCard } from "../molecules/cards/history-card";
export type { HistoryCardProps } from "../molecules/cards/history-card";
export { RecordCard } from "../molecules/cards/record-card";
export type { RecordCardProps } from "../molecules/cards/record-card";
export { OptionSelector } from "../molecules/selectors/option-selector";
export type { OptionSelectorProps } from "../molecules/selectors/option-selector";
export { FormInput } from "../molecules/forms/form-input";
export { InputGroup } from "../molecules/forms/input-group";
export { Form } from "../molecules/forms/form";
export { Field } from "../molecules/forms/field";
export { Label } from "../molecules/forms/label";
export { Badge } from "../molecules/badges/badge";
export { StatusBadge } from "../molecules/badges/status-badge";
export { SubscriptionBadge } from "../molecules/badges/subscription-badge";
export type { SubscriptionBadgeProps } from "../molecules/badges/subscription-badge";
export { WaterIntakeCard } from "../molecules/cards/water-intake-card";
export type { WaterIntakeCardProps } from "../molecules/cards/water-intake-card";
export { StepCard } from "../molecules/cards/step-card";

