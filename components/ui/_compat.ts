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
export type { DuoButtonProps } from "../duo/atoms/duo-button";
export { DuoButton, duoButtonVariants } from "../duo/atoms/duo-button";
export { Input } from "../atoms/inputs/input";
export { Select, SelectOption } from "../atoms/inputs/select";
export { Textarea } from "../atoms/inputs/textarea";
export { Progress } from "../atoms/progress/progress";
export { ProgressRing } from "../atoms/progress/progress-ring";
export { Badge } from "../molecules/badges/badge";
export { StatusBadge } from "../molecules/badges/status-badge";
export type { SubscriptionBadgeProps } from "../molecules/badges/subscription-badge";
export { SubscriptionBadge } from "../molecules/badges/subscription-badge";
// Re-exportar molecules
export { DuoCard } from "@/components/duo";
export type { HistoryCardProps } from "../molecules/cards/history-card";
export { HistoryCard } from "../molecules/cards/history-card";
export type { MealCardProps } from "../molecules/cards/meal-card";
export type { MealCardProps } from "../molecules/cards/meal-card";
export { MealCard } from "../molecules/cards/meal-card";
export type { RecordCardProps } from "../molecules/cards/record-card";
export { RecordCard } from "../molecules/cards/record-card";
export type { StatCardProps } from "../molecules/cards/stat-card";
export { StatCard } from "../molecules/cards/stat-card";
export { StepCard } from "../molecules/cards/step-card";
export type { WaterIntakeCardProps } from "../molecules/cards/water-intake-card";
export { WaterIntakeCard } from "../molecules/cards/water-intake-card";
export { Field } from "../molecules/forms/field";
export { Form } from "../molecules/forms/form";
export { FormInput } from "../molecules/forms/form-input";
export { InputGroup } from "../molecules/forms/input-group";
export { Label } from "../molecules/forms/label";
export type { DuoSelectOption } from "../duo/molecules/duo-select";
export { DuoSelect } from "../duo/molecules/duo-select";
