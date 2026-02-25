# onboarding

- Caminho: `app/student/onboarding`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `steps/`: subdomínio de `app/student/onboarding/steps`.

## Arquivos
- `actions.ts`: Arquivo da camada local.
- `page.tsx`: Entrypoint de página.
- `schemas.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `actions.ts`
- O que faz: implementa o módulo `actions.ts` da camada `onboarding`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/db`, `@/lib/services/email.service`, `@/lib/utils/auto-trial`, `@/lib/utils/student-context`, `./schemas`, `./steps/types`
- Expõe: `submitOnboarding`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/student/onboarding/page.tsx`

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/student/onboarding/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `Confetti`, `from`, `map`, `random`, `floor`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `@/components/ui/button`, `./schemas`, `./steps/consolidated-step1`, `./steps/consolidated-step2`, `./steps/consolidated-step3`, `./steps/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: HTTP interno/externo
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `schemas.ts`
- O que faz: implementa o módulo `schemas.ts` da camada `onboarding`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `zod`
- Expõe: `validateStep1`, `validateStep2`, `validateStep3`, `validateStep4`, `validateStep5`, `validateStep6`, `validateStep7`, `validateOnboarding`, `validateConsolidatedStep1`, `step1Schema`, `step2Schema`, `step3Schema`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: `app/student/onboarding/actions.ts`, `app/student/onboarding/page.tsx`, `app/student/onboarding/steps/consolidated-step1.tsx`, `app/student/onboarding/steps/consolidated-step3.tsx`, `app/student/onboarding/steps/step1.tsx`, `app/student/onboarding/steps/step2.tsx`, `app/student/onboarding/steps/step3.tsx`, `app/student/onboarding/steps/step4.tsx`, `app/student/onboarding/steps/step5.tsx`, `app/student/onboarding/steps/step6.tsx`, `app/student/onboarding/steps/step7.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
