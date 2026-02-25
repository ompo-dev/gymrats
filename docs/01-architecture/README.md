# 01-architecture

- Caminho: `docs/01-architecture`
- Finalidade: documentação técnica e funcional organizada por domínio.

## Subpastas
- Nenhuma subpasta.

## Arquivos
- `ANALISE_COMPLETA_PROJETO.md`: Arquivo da camada local.
- `ARQUITETURA_COMPLETA_SISTEMA.md`: Arquivo da camada local.
- `plan.md`: Arquivo da camada local.

## Detalhamento técnico por arquivo

### `ANALISE_COMPLETA_PROJETO.md`
- O que faz: documenta decisões e operação referentes a `docs/01-architecture/ANALISE_COMPLETA_PROJETO.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: sem imports relevantes detectados.
- Expõe: sem exports nomeados (ou apenas default).
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Serviços de IA, Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `ARQUITETURA_COMPLETA_SISTEMA.md`
- O que faz: documenta decisões e operação referentes a `docs/01-architecture/ARQUITETURA_COMPLETA_SISTEMA.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: `@/hooks/use-load-prioritized`, `@/hooks/use-load-prioritized`, `@/hooks/use-student`
- Expõe: `getStudentProgressHandler`, `GET`, `syncManager`, `createIndexedDBStorage`, `LearningPath`, `requireStudent`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

### `plan.md`
- O que faz: documenta decisões e operação referentes a `docs/01-architecture/plan.md`.
- Como: organiza instruções, contexto de arquitetura e referências de manutenção para o time.
- Por que: reduz custo de onboarding e evita conhecimento implícito disperso.
- Importa principalmente: `elysia`, `../plugins/auth`, `elysia`, `./routes/students`, `./routes/gyms`, `elysia`, `@/lib/auth-config`, `@elysiajs/cors`, `elysia`, `@/lib/auth-config`, `elysia`, `../plugins/auth-roles`
- Expõe: `getStudentProfileHandler`, `getStudentProfile`, `betterAuthPlugin`, `authMacro`, `requireStudentMacro`, `studentsRoutes`
- Comunica com: Banco de dados (Prisma), Autenticação/sessão, HTTP interno/externo, Offline/sincronização, Runtime Elysia
- Onde é usado/importado: nenhuma referência direta detectada (pode ser uso dinâmico/entrypoint/framework).

## Observações
- Leitura gerada por análise estática de símbolos, chamadas e imports do diretório e vizinhança de uso.
- Para operação em produção, complementar com contratos de payload, códigos de erro, invariantes e cenários de falha.
