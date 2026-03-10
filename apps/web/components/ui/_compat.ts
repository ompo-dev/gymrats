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

// Re-exportar molecules
export { DuoCard } from "@/components/duo";
export { Textarea } from "../atoms/inputs/textarea";
export { Progress } from "../atoms/progress/progress";
export { ProgressRing } from "../atoms/progress/progress-ring";
export { DuoBadge } from "../duo/atoms/duo-badge";
// Re-exportar atoms (Duo é canônico)
export {
  DuoButton as Button,
  DuoButton,
  type DuoButtonProps,
  duoButtonVariants as buttonVariants,
  duoButtonVariants,
} from "../duo/atoms/duo-button";
export { DuoSelect, type DuoSelectOption } from "../duo/molecules/duo-select";
export type { SubscriptionBadgeProps } from "../molecules/badges/subscription-badge";
export { SubscriptionBadge } from "../molecules/badges/subscription-badge";
export type { HistoryCardProps } from "../molecules/cards/history-card";
export { HistoryCard } from "../molecules/cards/history-card";
export type { MealCardProps } from "../molecules/cards/meal-card";
export { MealCard } from "../molecules/cards/meal-card";
export type { RecordCardProps } from "../molecules/cards/record-card";
export { RecordCard } from "../molecules/cards/record-card";
export { StepCard } from "../molecules/cards/step-card";
export type { WaterIntakeCardProps } from "../molecules/cards/water-intake-card";
export { WaterIntakeCard } from "../molecules/cards/water-intake-card";
export { Field } from "../molecules/forms/field";
export { Form } from "../molecules/forms/form";
export { InputGroup } from "../molecules/forms/input-group";
export { Label } from "../molecules/forms/label";
