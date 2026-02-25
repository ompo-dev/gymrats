# onboarding

- Caminho: `app/gym/onboarding`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- `steps/`: subdomínio de `app/gym/onboarding/steps`.

## Arquivos
- `actions.ts`: Arquivo da camada local.
- `layout.tsx`: Layout compartilhado de rota.
- `page.tsx`: Entrypoint de página.

## Detalhamento técnico por arquivo

### `actions.ts`
- O que faz: implementa o módulo `actions.ts` da camada `onboarding`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@prisma/client`, `@/lib/db`, `@/lib/utils/auto-trial`, `@/lib/utils/gym-context`, `./steps/types`, `@/lib/services/gym/gym-inventory.service`
- Expõe: `submitNewGym`, `submitGymOnboarding`
- Comunica com: Banco de dados (Prisma)
- Onde é usado/importado: `app/gym/onboarding/page.tsx`

### `layout.tsx`
- O que faz: define o layout compartilhado do segmento `onboarding`.
- Como: encapsula providers, chrome de navegação e elementos persistentes entre páginas filhas; sinais: `GymOnboardingLayout`.
- Por que: elimina duplicação estrutural e mantém consistência transversal de UX.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `page.tsx`
- O que faz: implementa a página de entrada da rota `app/gym/onboarding/page.tsx`.
- Como: compõe componentes e hooks para executar o fluxo principal da tela; operações detectadas: `Confetti`, `from`, `map`, `random`, `floor`.
- Por que: mantém o entrypoint de navegação explícito e alinhado ao filesystem routing.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `@/components/atoms/buttons/button`, `./steps/step1`, `./steps/step2`, `./steps/step3`, `./steps/step4`, `./steps/types`
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
