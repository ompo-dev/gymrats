# steps

- Caminho: `app/gym/onboarding/steps`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `step1.tsx`: Arquivo da camada local.
- `step2.tsx`: Arquivo da camada local.
- `step3.tsx`: Arquivo da camada local.
- `step4.tsx`: Arquivo da camada local.
- `types.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `step1.tsx`
- O que faz: implementa o módulo `step1.tsx` da camada `steps`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/components/molecules/cards/step-card`, `@/components/molecules/forms/form-input`, `./types`
- Expõe: `Step1`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/page.tsx`

### `step2.tsx`
- O que faz: implementa o módulo `step2.tsx` da camada `steps`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `axios`, `lucide-react`, `motion/react`, `react`, `@/components/molecules/cards/step-card`, `@/components/molecules/forms/form-input`, `./types`
- Expõe: `Step2`
- Comunica com: HTTP interno/externo
- Onde é usado/importado: `app/gym/onboarding/page.tsx`

### `step3.tsx`
- O que faz: implementa o módulo `step3.tsx` da camada `steps`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `motion/react`, `@/components/molecules/cards/step-card`, `@/components/molecules/forms/form-input`, `./types`
- Expõe: `Step3`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/page.tsx`

### `step4.tsx`
- O que faz: implementa o módulo `step4.tsx` da camada `steps`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `react`, `@/components/atoms/buttons/button`, `@/components/molecules/cards/step-card`, `@/components/organisms/modals/equipment-search`, `@/lib/equipment-database`, `./types`
- Expõe: `Step4`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/page.tsx`

### `types.ts`
- O que faz: implementa o módulo `types.ts` da camada `steps`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/equipment-database`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/gym/onboarding/actions.ts`, `app/gym/onboarding/page.tsx`, `app/gym/onboarding/steps/step1.tsx`, `app/gym/onboarding/steps/step2.tsx`, `app/gym/onboarding/steps/step3.tsx`, `app/gym/onboarding/steps/step4.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
