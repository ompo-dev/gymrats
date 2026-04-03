# Actions And Cache Standard

Padrao oficial do `apps/web` para leituras, mutacoes e invalidacao de cache.

## Fonte da Verdade

- `apps/web/lib/actions/cached-reader.ts`
- `apps/web/lib/actions/web-actions.ts`
- `apps/web/lib/actions/cache-tags.ts`
- `apps/web/lib/actions/cache-tags/resolvers-student.ts`
- `apps/web/lib/actions/bootstrap-readers.ts`
- `apps/web/lib/actions/client.ts`

## Regras

- Leitura server-side: usar `executeWebReadAction(...)` ou `readCachedApi(...)`.
- Mutacao server-side: usar `executeWebMutationAction(...)`.
- Cliente: usar `actionClient`.
- Bootstrap: usar `getStudentBootstrapAction`, `getGymBootstrapAction` ou `getPersonalBootstrapAction`.
- Tags e perfis de cache: inferir via `cache-tags/*`; adicionar tags explicitas apenas quando necessario.
- Invalidacao: deixar `executeWebMutationAction(...)` resolver `updateTag(...)` e `revalidateTag(...)`.

## O Que Nao Deve Ser Usado Diretamente No App

- `serverApiGet`
- `serverApiPost`
- `serverApiPatch`
- `serverApiDelete`

Essas funcoes permanecem apenas como camada base em `apps/web/lib/api/server.ts`.

## Mapeamento Atual

Migrado para o padrao novo:

- `apps/web/app/student/actions.ts`
- `apps/web/app/gym/actions.ts`
- `apps/web/app/personal/actions.ts`
- `apps/web/app/student/onboarding/actions.ts`
- `apps/web/app/gym/onboarding/actions.ts`
- `apps/web/app/personal/onboarding/actions.ts`
- `apps/web/app/student/_profile/actions.ts`

Ja estavam no padrao novo:

- `apps/web/lib/actions/*`
- `apps/web/app/admin/observability/_components/queries.ts`
- stores/client readers que usam `actionClient`

## Excecoes Permitidas

- `apps/web/lib/api/server.ts`
  Base de transporte HTTP server-side.
- `apps/web/lib/actions/cached-reader.ts`
  Implementa `use cache`, `cacheTag` e `cacheLife`.
- `apps/web/lib/actions/web-actions.ts`
  Orquestra leitura, mutacao e invalidacao centralizada.
- `apps/web/app/api/admin/observability/stream/route.ts`
  Proxy de stream/forwarding entre runtimes.

## Observacoes

- Para fluxos sensiveis a staleness imediata, usar `fresh: true` na leitura ou um `profile` curto.
- Para novos dominios, adicionar resolver em `apps/web/lib/actions/cache-tags/` antes de espalhar tags manuais.
