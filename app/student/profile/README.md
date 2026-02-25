# profile

- Caminho: `app/student/profile`
- Finalidade: raiz do App Router com páginas, layouts e endpoints por filesystem routing.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `actions.ts`: Arquivo da camada local.
- `profile-content.tsx`: Arquivo da camada local.
- `profile-page.tsx`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `actions.ts`
- O que faz: implementa o módulo `actions.ts` da camada `profile`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `@/lib/services/student/student-profile.service`, `@/lib/services/student/student-progress.service`, `@/lib/services/student/student-workout.service`
- Expõe: `getStudentProfileData`
- Comunica com: camada local sem integrações explícitas detectadas.
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `profile-content.tsx`
- O que faz: implementa o módulo `profile-content.tsx` da camada `profile`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `lucide-react`, `motion/react`, `next/navigation`, `react`, `@/components/ui/button`, `@/components/ui/duo-card`, `@/components/ui/history-card`, `@/components/ui/profile-header`, `@/components/ui/record-card`, `@/components/ui/section-card`, `@/components/ui/stat-card-large`, `@/hooks/use-load-prioritized`
- Expõe: `ProfilePageContent`
- Comunica com: Autenticação/sessão, HTTP interno/externo, Offline/sincronização
- Onde é usado/importado: `app/student/profile/profile-page.tsx`

### `profile-page.tsx`
- O que faz: implementa o módulo `profile-page.tsx` da camada `profile`.
- Como: declara tipos, funções e contratos utilizados por outras partes do sistema.
- Por que: mantém coesão técnica e facilita evolução segura do código.
- Importa principalmente: `./profile-content`
- Expõe: `ProfilePage`
- Comunica com: Offline/sincronização
- Onde é usado/importado: `app/student/page-content.tsx`

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
