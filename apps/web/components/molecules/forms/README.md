# forms

- Caminho: `components/molecules/forms`
- Finalidade: biblioteca de componentes de UI e composição por camadas.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `field.tsx`: Arquivo da camada local.
- `form-input.tsx`: Arquivo da camada local.
- `form.tsx`: Arquivo da camada local.
- `index.ts`: Arquivo da camada local.
- `input-group.tsx`: Arquivo da camada local.
- `label.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `field.tsx`
- O que faz: implementa o componente `field`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `FieldSet`, `cn`, `FieldLegend`, `FieldGroup`, `cva`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `react`, `@/components/ui/label`, `@/components/ui/separator`, `@/lib/utils`
- Expõe: `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldContent`, `FieldTitle`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/index.ts`, `components/ui/_compat.ts`

### `form-input.tsx`
- O que faz: implementa o componente `form-input`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `parseFloat`, `onChange`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `motion/react`, `react`, `@/components/ui/input`, `@/components/ui/label`, `@/lib/utils`
- Expõe: `FormInput`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/steps/step1.tsx`, `app/gym/onboarding/steps/step2.tsx`, `app/gym/onboarding/steps/step3.tsx`, `components/molecules/forms/index.ts`, `components/ui/_compat.ts`

### `form.tsx`
- O que faz: implementa o componente `form`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `useContext`, `useFormContext`, `useFormState`, `getFieldState`, `Error`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-label`, `@radix-ui/react-slot`, `react`, `react-hook-form`, `@/components/ui/label`, `@/lib/utils`
- Expõe: `useFormField`, `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/index.ts`, `components/ui/_compat.ts`

### `index.ts`
- O que faz: implementa o componente `index`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: sem sinais relevantes detectados.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `./field`, `./form`, `./form-input`, `./input-group`, `./label`
- Expõe: `Field`, `Form`, `FormInput`, `InputGroup`, `Label`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/index.ts`

### `input-group.tsx`
- O que faz: implementa o componente `input-group`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `InputGroup`, `cn`, `cva`, `not`, `calc`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `class-variance-authority`, `@/components/ui/button`, `@/components/ui/input`, `@/components/ui/textarea`, `@/lib/utils`
- Expõe: `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupText`, `InputGroupInput`, `InputGroupTextarea`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/index.ts`, `components/ui/_compat.ts`

### `label.tsx`
- O que faz: implementa o componente `label`.
- Como: renderiza interface e integra eventos/props com hooks e serviços da feature; sinais de execução: `Label`, `cn`.
- Por que: promove composição reutilizável sem deslocar regra de negócio para a UI.
- Importa principalmente: `@radix-ui/react-label`, `react`, `@/lib/utils`
- Expõe: `Label`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `components/molecules/forms/index.ts`, `components/ui/_compat.ts`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
