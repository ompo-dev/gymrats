# ui

- Caminho: `components/ui`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `_compat.ts`: Arquivo da camada local.
- `alert-dialog.tsx`: Arquivo da camada local.
- `badge.tsx`: Arquivo da camada local.
- `button-group.tsx`: Arquivo da camada local.
- `button.tsx`: Arquivo da camada local.
- `calendar.tsx`: Arquivo da camada local.
- `card.tsx`: Arquivo da camada local.
- `carousel.tsx`: Arquivo da camada local.
- `command.tsx`: Arquivo da camada local.
- `custom-checkbox.tsx`: Arquivo da camada local.
- `dialog.tsx`: Arquivo da camada local.
- `duo-button.tsx`: Arquivo da camada local.
- `duo-card.tsx`: Arquivo da camada local.
- `field.tsx`: Arquivo da camada local.
- `food-item-card.tsx`: Arquivo da camada local.
- `form-input.tsx`: Arquivo da camada local.
- `form.tsx`: Arquivo da camada local.
- `history-card.tsx`: Arquivo da camada local.
- `input-group.tsx`: Arquivo da camada local.
- `input.tsx`: Arquivo da camada local.
- `item.tsx`: Arquivo da camada local.
- `label.tsx`: Arquivo da camada local.
- `macro-card.tsx`: Arquivo da camada local.
- `meal-card.tsx`: Arquivo da camada local.
- `navigation-button-card.tsx`: Arquivo da camada local.
- `option-selector.tsx`: Arquivo da camada local.
- `pagination.tsx`: Arquivo da camada local.
- `profile-header.tsx`: Arquivo da camada local.
- `progress-ring.tsx`: Arquivo da camada local.
- `progress.tsx`: Arquivo da camada local.
- `range-slider.tsx`: Arquivo da camada local.
- `record-card.tsx`: Arquivo da camada local.
- `section-card.tsx`: Arquivo da camada local.
- `select.tsx`: Arquivo da camada local.
- `separator.tsx`: Arquivo da camada local.
- `sheet.tsx`: Arquivo da camada local.
- `sidebar.tsx`: Arquivo da camada local.
- `skeleton.tsx`: Arquivo da camada local.
- `stat-card-large.tsx`: Arquivo da camada local.
- `stat-card.tsx`: Arquivo da camada local.
- `status-badge.tsx`: Arquivo da camada local.
- `step-card.tsx`: Arquivo da camada local.
- `tabs.tsx`: Arquivo da camada local.
- `textarea.tsx`: Arquivo da camada local.
- `toast.tsx`: Arquivo da camada local.
- `toaster.tsx`: Arquivo da camada local.
- `toggle-group.tsx`: Arquivo da camada local.
- `toggle.tsx`: Arquivo da camada local.
- `tooltip.tsx`: Arquivo da camada local.
- `unit-section-card.tsx`: Arquivo da camada local.
- `use-toast.ts`: Hook React de orquestração.
- `water-intake-card.tsx`: Arquivo da camada local.
- `workout-node-button.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `_compat.ts`
- O que faz: implementa o componente `_compat`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `../atoms/buttons/button`, `../atoms/buttons/duo-button`, `../atoms/buttons/duo-button`, `../atoms/inputs/input`, `../atoms/inputs/select`, `../atoms/inputs/textarea`, `../atoms/progress/progress`, `../atoms/progress/progress-ring`, `../molecules/badges/badge`, `../molecules/badges/status-badge`, `../molecules/badges/subscription-badge`, `../molecules/badges/subscription-badge`
- Expõe: `Button`, `buttonVariants`, `DuoButton`, `duoButtonVariants`, `Input`, `Select`, `SelectOption`, `Textarea`, `Progress`, `ProgressRing`, `Badge`, `StatusBadge`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `alert-dialog.tsx`
- O que faz: implementa o componente `alert-dialog`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogPortal`, `AlertDialogOverlay`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-alert-dialog`, `react`, `@/components/ui/button`, `@/lib/utils`
- Expõe: `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/membership-plans-page.tsx`, `components/organisms/modals/subscription-cancel-dialog.tsx`

### `badge.tsx`
- O que faz: implementa o componente `badge`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `Badge`, `cn`, `badgeVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `Badge`, `badgeVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `button-group.tsx`
- O que faz: implementa o componente `button-group`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `not`, `ButtonGroup`, `cn`, `buttonGroupVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `@/components/ui/separator`, `@/lib/utils`
- Expõe: `ButtonGroup`, `ButtonGroupSeparator`, `ButtonGroupText`, `buttonGroupVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `button.tsx`
- O que faz: implementa o componente `button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `not`, `Button`, `cn`, `buttonVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `Button`, `buttonVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/academias/page-content.tsx`, `app/gym/components/add-equipment-modal.tsx`, `app/gym/components/add-student-modal.tsx`, `app/gym/components/checkin-modal.tsx`, `app/gym/components/gym-dashboard.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-settings.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/gym/components/gym-students.tsx`, `app/gym/components/maintenance-modal.tsx`, `app/gym/components/membership-plans-page.tsx`

### `calendar.tsx`
- O que faz: implementa o componente `calendar`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Calendar`, `getDefaultClassNames`, `cn`, `spacing`, `toLocaleString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `react-day-picker`, `@/components/ui/button`, `@/lib/utils`
- Expõe: `Calendar`, `CalendarDayButton`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `card.tsx`
- O que faz: implementa o componente `card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Card`, `cn`, `CardHeader`, `CardTitle`, `CardDescription`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`
- Expõe: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/dashboard/page-content.tsx`, `app/gym/equipment/[id]/page-content.tsx`, `app/gym/equipment/page-content.tsx`, `app/gym/gamification/page-content.tsx`, `app/gym/students/[id]/page.tsx`, `app/gym/students/page-content.tsx`, `components/molecules/cards/step-card.tsx`, `components/ui/step-card.tsx`

### `carousel.tsx`
- O que faz: implementa o componente `carousel`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useCarousel`, `useContext`, `Error`, `Carousel`, `useEmblaCarousel`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `embla-carousel-react`, `lucide-react`, `react`, `@/components/ui/button`, `@/lib/utils`
- Expõe: `type CarouselApi`, `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `command.tsx`
- O que faz: implementa o componente `command`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Command`, `cn`, `CommandDialog`, `not`, `CommandInput`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `cmdk`, `lucide-react`, `react`, `@/components/ui/dialog`, `@/lib/utils`
- Expõe: `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `custom-checkbox.tsx`
- O que faz: implementa o componente `custom-checkbox`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `CustomCheckbox`, `useRef`, `random`, `toString`, `substr`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/lib/utils`
- Expõe: `CustomCheckbox`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/step1.tsx`

### `dialog.tsx`
- O que faz: implementa o componente `dialog`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-dialog`, `lucide-react`, `react`, `@/lib/utils`
- Expõe: `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/academias/page-content.tsx`, `app/gym/components/add-equipment-modal.tsx`, `components/organisms/modals/streak-modal.tsx`, `components/ui/command.tsx`

### `duo-button.tsx`
- O que faz: implementa o componente `duo-button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `cn`, `duoButtonVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `motion/react`, `react`, `@/lib/utils`
- Expõe: `DuoButton`, `duoButtonVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `duo-card.tsx`
- O que faz: implementa o componente `duo-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `DuoCard`, `cn`, `duoCardVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `DuoCard`, `duoCardVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/add-student-modal.tsx`, `app/gym/components/checkin-modal.tsx`, `app/gym/components/gym-dashboard.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-gamification.tsx`, `app/gym/components/gym-settings.tsx`, `app/gym/components/gym-stats.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/gym/components/gym-students.tsx`, `app/gym/components/maintenance-modal.tsx`, `app/gym/components/membership-plans-page.tsx`

### `field.tsx`
- O que faz: implementa o componente `field`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FieldSet`, `cn`, `FieldLegend`, `FieldGroup`, `cva`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `react`, `@/components/ui/label`, `@/components/ui/separator`, `@/lib/utils`
- Expõe: `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `food-item-card.tsx`
- O que faz: implementa o componente `food-item-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FoodItemCard`, `cn`, `stopPropagation`, `onToggle`, `preventDefault`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/lib/types`, `@/lib/utils`
- Expõe: `FoodItemCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/cards/meal-card.tsx`, `components/ui/meal-card.tsx`

### `form-input.tsx`
- O que faz: implementa o componente `form-input`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `onChange`, `test`, `parseFloat`, `isNaN`, `useEffect`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/components/ui/input`, `@/components/ui/label`, `@/lib/utils`
- Expõe: `FormInput`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/step1.tsx`, `app/student/onboarding/steps/step6.tsx`, `components/molecules/limitation-selector.tsx`

### `form.tsx`
- O que faz: implementa o componente `form`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useContext`, `useFormContext`, `useFormState`, `getFieldState`, `Error`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-label`, `@radix-ui/react-slot`, `react`, `react-hook-form`, `@/components/ui/label`, `@/lib/utils`
- Expõe: `useFormField`, `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `history-card.tsx`
- O que faz: implementa o componente `history-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `HistoryCard`, `isNaN`, `getTime`, `setDate`, `getDate`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`, `./status-badge`
- Expõe: `HistoryCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/profile/profile-content.tsx`

### `input-group.tsx`
- O que faz: implementa o componente `input-group`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `InputGroup`, `cn`, `cva`, `not`, `calc`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/textarea`, `@/lib/utils`
- Expõe: `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `input.tsx`
- O que faz: implementa o componente `input`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Input`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`
- Expõe: `Input`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/academias/page-content.tsx`, `app/gym/components/add-equipment-modal.tsx`, `app/gym/components/add-student-modal.tsx`, `app/gym/components/checkin-modal.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-students.tsx`, `app/gym/components/maintenance-modal.tsx`, `app/gym/components/membership-plans-page.tsx`, `app/gym/equipment/page-content.tsx`, `app/gym/students/page-content.tsx`, `components/molecules/forms/form-input.tsx`, `components/molecules/forms/input-group.tsx`

### `item.tsx`
- O que faz: implementa o componente `item`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ItemGroup`, `cn`, `ItemSeparator`, `cva`, `Item`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `react`, `@/components/ui/separator`, `@/lib/utils`
- Expõe: `Item`, `ItemMedia`, `ItemContent`, `ItemActions`, `ItemGroup`, `ItemSeparator`, `ItemTitle`, `ItemDescription`, `ItemHeader`, `ItemFooter`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `label.tsx`
- O que faz: implementa o componente `label`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Label`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-label`, `react`, `@/lib/utils`
- Expõe: `Label`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/academias/page-content.tsx`, `app/gym/components/add-equipment-modal.tsx`, `components/molecules/forms/field.tsx`, `components/molecules/forms/form-input.tsx`, `components/molecules/forms/form.tsx`, `components/ui/field.tsx`, `components/ui/form-input.tsx`, `components/ui/form.tsx`

### `macro-card.tsx`
- O que faz: implementa o componente `macro-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MacroCard`, `round`, `cn`, `min`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `MacroCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `meal-card.tsx`
- O que faz: implementa o componente `meal-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `MealCard`, `includes`, `cn`, `getMealIcon`, `stopPropagation`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/lib/types`, `@/lib/utils`, `./duo-card`, `./food-item-card`
- Expõe: `MealCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `navigation-button-card.tsx`
- O que faz: implementa o componente `navigation-button-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `NavigationButtonCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./duo-card`
- Expõe: `NavigationButtonCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/more/student-more-menu.tsx`, `components/organisms/navigation/gym-more-menu.tsx`

### `option-selector.tsx`
- O que faz: implementa o componente `option-selector`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useState`, `setIsTapping`, `isArray`, `OptionSelector`, `useMemo`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `react`, `@/lib/utils`
- Expõe: `OptionSelector`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/add-equipment-modal.tsx`, `app/gym/components/add-student-modal.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-financial.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/gym/components/gym-students.tsx`, `app/gym/components/maintenance-modal.tsx`, `app/gym/components/membership-plans-page.tsx`, `app/student/education/components/lesson-filters.tsx`, `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/consolidated-step3.tsx`

### `pagination.tsx`
- O que faz: implementa o componente `pagination`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Pagination`, `cn`, `PaginationContent`, `PaginationItem`, `PaginationLink`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/components/ui/button`, `@/lib/utils`
- Expõe: `Pagination`, `PaginationContent`, `PaginationLink`, `PaginationItem`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `profile-header.tsx`
- O que faz: implementa o componente `profile-header`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ProfileHeader`, `cn`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`, `./stat-card`
- Expõe: `ProfileHeader`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/profile/profile-content.tsx`

### `progress-ring.tsx`
- O que faz: implementa o componente `progress-ring`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ProgressRing`, `useState`, `useEffect`, `setAnimatedProgress`, `setInterval`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/lib/utils`
- Expõe: `ProgressRing`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `progress.tsx`
- O que faz: implementa o componente `progress`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Progress`, `min`, `max`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-progress`, `react`, `@/lib/utils`
- Expõe: `Progress`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `range-slider.tsx`
- O que faz: implementa o componente `range-slider`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RangeSlider`, `useState`, `useRef`, `random`, `toString`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/lib/utils`
- Expõe: `RangeSlider`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/step2.tsx`, `app/student/onboarding/steps/step6.tsx`

### `record-card.tsx`
- O que faz: implementa o componente `record-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `RecordCard`, `toLocaleDateString`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `RecordCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/profile/profile-content.tsx`

### `section-card.tsx`
- O que faz: implementa o componente `section-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `SectionCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./duo-card`
- Expõe: `SectionCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-dashboard.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-financial.tsx`, `app/gym/components/gym-gamification.tsx`, `app/gym/components/gym-settings.tsx`, `app/gym/components/gym-stats.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/gym/components/gym-students.tsx`, `app/student/education/components/lesson-detail.tsx`, `app/student/education/components/lesson-filters.tsx`, `app/student/education/components/lesson-quiz.tsx`

### `select.tsx`
- O que faz: implementa o componente `select`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `useState`, `find`, `useEffect`, `contains`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `lucide-react`, `react`, `@/lib/utils`
- Expõe: `Select`, `selectTriggerVariants`, `selectDropdownVariants`, `selectItemVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `separator.tsx`
- O que faz: implementa o componente `separator`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Separator`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-separator`, `react`, `@/lib/utils`
- Expõe: `Separator`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/field.tsx`, `components/ui/button-group.tsx`, `components/ui/field.tsx`, `components/ui/item.tsx`, `components/ui/sidebar.tsx`

### `sheet.tsx`
- O que faz: implementa o componente `sheet`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-dialog`, `lucide-react`, `react`, `@/lib/utils`
- Expõe: `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/sidebar.tsx`

### `sidebar.tsx`
- O que faz: implementa o componente `sidebar`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useSidebar`, `useContext`, `Error`, `SidebarProvider`, `useIsMobile`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-slot`, `class-variance-authority`, `lucide-react`, `react`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/separator`, `@/components/ui/sheet`, `@/components/ui/skeleton`, `@/components/ui/tooltip`, `@/hooks/use-mobile`, `@/lib/utils`
- Expõe: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`
- Comunica com: Autenticação/sessão
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `skeleton.tsx`
- O que faz: implementa o componente `skeleton`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Skeleton`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/lib/utils`
- Expõe: `Skeleton`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/sidebar.tsx`

### `stat-card-large.tsx`
- O que faz: implementa o componente `stat-card-large`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StatCardLarge`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./duo-card`
- Expõe: `StatCardLarge`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/components/gym-dashboard.tsx`, `app/gym/components/gym-equipment-detail.tsx`, `app/gym/components/gym-equipment.tsx`, `app/gym/components/gym-gamification.tsx`, `app/gym/components/gym-stats.tsx`, `app/gym/components/gym-student-detail.tsx`, `app/student/profile/profile-content.tsx`

### `stat-card.tsx`
- O que faz: implementa o componente `stat-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StatCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`, `./duo-card`
- Expõe: `StatCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/profile-header.tsx`

### `status-badge.tsx`
- O que faz: implementa o componente `status-badge`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `StatusBadge`, `cn`, `statusBadgeVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `StatusBadge`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/history-card.tsx`

### `step-card.tsx`
- O que faz: implementa o componente `step-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `StepCard`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/components/ui/card`
- Expõe: `StepCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `tabs.tsx`
- O que faz: implementa o componente `tabs`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Tabs`, `cn`, `TabsList`, `TabsTrigger`, `calc`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-tabs`, `react`, `@/lib/utils`
- Expõe: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/equipment/[id]/page-content.tsx`, `app/gym/students/[id]/page.tsx`

### `textarea.tsx`
- O que faz: implementa o componente `textarea`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Textarea`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `react`, `@/lib/utils`
- Expõe: `Textarea`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/input-group.tsx`, `components/ui/input-group.tsx`

### `toast.tsx`
- O que faz: implementa o componente `toast`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cn`, `cva`, `var`, `toastVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-toast`, `class-variance-authority`, `lucide-react`, `react`, `@/lib/utils`
- Expõe: `type ToastProps`, `type ToastActionElement`, `ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastClose`, `ToastAction`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/toaster.tsx`, `components/ui/use-toast.ts`, `hooks/use-toast.ts`

### `toaster.tsx`
- O que faz: implementa o componente `toaster`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Toaster`, `useToast`, `map`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@/components/ui/toast`, `@/hooks/use-toast`
- Expõe: `Toaster`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `toggle-group.tsx`
- O que faz: implementa o componente `toggle-group`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `ToggleGroup`, `cn`, `ToggleGroupItem`, `useContext`, `toggleVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-toggle-group`, `class-variance-authority`, `react`, `@/components/ui/toggle`, `@/lib/utils`
- Expõe: `ToggleGroup`, `ToggleGroupItem`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `toggle.tsx`
- O que faz: implementa o componente `toggle`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `cva`, `not`, `Toggle`, `cn`, `toggleVariants`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-toggle`, `class-variance-authority`, `react`, `@/lib/utils`
- Expõe: `Toggle`, `toggleVariants`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/toggle-group.tsx`

### `tooltip.tsx`
- O que faz: implementa o componente `tooltip`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-tooltip`, `react`, `@/lib/utils`
- Expõe: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/ui/sidebar.tsx`

### `unit-section-card.tsx`
- O que faz: implementa o componente `unit-section-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `UnitSectionCard`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `next/link`, `react`, `@/components/atoms/buttons/button`, `@/lib/utils`
- Expõe: `UnitSectionCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/learn/learning-path.tsx`

### `use-toast.ts`
- O que faz: encapsula comportamento reutilizável no hook `use-toast`.
- Como: coordena estado, side-effects e integração com stores/serviços; pontos de execução: `genId`, `toString`, `has`, `delete`, `dispatch`, `set`.
- Por que: separa orquestração da camada de apresentação e reduz acoplamento em componentes.
- Importa principalmente: `react`, `@/components/ui/toast`
- Expõe: `reducer`, `useToast`, `toast`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `water-intake-card.tsx`
- O que faz: implementa o componente `water-intake-card`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WaterIntakeCard`, `min`, `from`, `map`, `onToggleGlass`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `react`, `@/lib/utils`, `./section-card`
- Expõe: `WaterIntakeCard`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `workout-node-button.tsx`
- O que faz: implementa o componente `workout-node-button`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `WorkoutNodeButton`, `preventDefault`, `stopPropagation`, `onClick`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `lucide-react`, `motion/react`, `@/lib/utils`
- Expõe: `WorkoutNodeButton`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/organisms/workout/workout-node.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
