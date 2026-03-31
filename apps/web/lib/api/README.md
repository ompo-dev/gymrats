# api

- Caminho: `lib/api`
- Finalidade: núcleo compartilhado de domínio/aplicação (clientes API, serviços, utilitários, offline e casos de uso).

## Subpastas
- `handlers/`: subdomínio de `lib/api/handlers`.
- `middleware/`: subdomínio de `lib/api/middleware`.
- `schemas/`: subdomínio de `lib/api/schemas`.
- `utils/`: subdomínio de `lib/api/utils`.

## Arquivos
- `abacatepay.ts`: Arquivo da camada local.
- `auth.ts`: Arquivo da camada local.
- `client.ts`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `abacatepay.ts`
- O que faz: implementa o módulo `abacatepay.ts` da camada `api`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `axios`
- Expõe: `abacatePay`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/api/webhooks/abacatepay/route.ts`, `lib/actions/abacate-pay.ts`, `lib/utils/subscription.ts`

### `auth.ts`
- O que faz: implementa o módulo `auth.ts` da camada `api`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./client`
- Expõe: `authApi`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/auth/callback/page.tsx`, `app/welcome/page.tsx`

### `client.ts`
- O que faz: implementa o módulo `client.ts` da camada `api`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `axios`
- Expõe: `apiClient`
- Comunica com: Autenticação/sessão, HTTP interno/externo
- Onde é usado/importado: `app/auth/register/user-type/page.tsx`, `app/gym/academias/page-content.tsx`, `app/gym/components/gym-settings.tsx`, `app/page.tsx`, `app/student/onboarding/page.tsx`, `app/student/page-content.tsx`, `app/student/payments/student-payments-page.tsx`, `app/student/profile/profile-content.tsx`, `components/organisms/modals/exercise-search.tsx`, `components/organisms/modals/food-search.tsx`, `components/organisms/modals/workout-chat.tsx`, `contexts/active-gym-context.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
