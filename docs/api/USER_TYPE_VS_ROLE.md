# Role - Documentação

## Resumo

O sistema usa **apenas `role`** como fonte única da verdade para tipos de usuário.

## Role (Fonte da Verdade)

O campo `role` é o **único campo usado para lógica de negócio**. Ele é armazenado no banco de dados no modelo `User` e pode ter os seguintes valores:

- `STUDENT`: Usuário é um aluno
- `GYM`: Usuário é uma academia
- `ADMIN`: Usuário é administrador (tem acesso completo a tudo)

### Onde está definido:

- **Banco de dados**: `prisma/schema.prisma` - enum `UserRole`
- **Modelo**: `User.role` (campo obrigatório, default: STUDENT)

## Migração Completa ✅

O campo `userType` foi **completamente removido** da API. Agora usamos apenas `role`:

- ✅ API de sessão retorna apenas `role`
- ✅ API de login retorna apenas `role`
- ✅ API de atualização de role usa apenas `role`
- ✅ Hooks e stores atualizados para usar `role`
- ✅ Swagger atualizado para remover `userType`

## Recomendação

**Sempre use `role` para lógica de negócio e validações.**

Para converter `role` em valores legíveis, use as funções helper em `lib/utils/role.ts`:

- `isStudent(role)`: Verifica se é student ou admin
- `isGym(role)`: Verifica se é gym ou admin
- `isAdmin(role)`: Verifica se é admin
- `roleToUserType(role)`: Converte role para userType (apenas para compatibilidade com componentes legados)

## ADMIN - Acesso Completo

Usuários com `role === "ADMIN"` têm **acesso completo** a todas as funcionalidades:

- ✅ Acesso a todas as rotas de `STUDENT`
- ✅ Acesso a todas as rotas de `GYM`
- ✅ `hasGym: true` (sempre)
- ✅ `hasStudent: true` (sempre)

### Implementação

1. **Middleware** (`lib/api/middleware/auth.middleware.ts`):

   - `requireStudent()`: Permite ADMIN
   - `requireGym()`: Permite ADMIN

2. **Session** (`lib/utils/session.ts`):

   - Cria automaticamente perfil de `Student` para ADMIN se não existir
   - Cria automaticamente perfil de `Gym` para ADMIN se não existir

3. **API Session** (`app/api/auth/session/route.ts`):
   - Retorna `hasGym: true` e `hasStudent: true` para ADMIN

## Exemplo de Resposta da API

```json
{
  "user": {
    "id": "cmiqt87990004dfvwjr57m352",
    "email": "maicon@gmail.com",
    "name": "Maicon Pereira Barbosa",
    "role": "ADMIN", // ← Fonte única da verdade
    "hasGym": true, // ← Sempre true para ADMIN
    "hasStudent": true // ← Sempre true para ADMIN
  },
  "session": {
    "id": "cmjkozycs0005dfkslwoa8ewe",
    "token": "1766621786283-2559cofrqcm-7jzaepuw2ql"
  }
}
```

## Componentes Internos

Alguns componentes ainda recebem `userType` como prop (ex: `AppLayout`, `SubscriptionSection`). Isso é aceitável pois são props internas dos componentes e não afetam a API. Para converter `role` em `userType` quando necessário, use a função helper `roleToUserType()` em `lib/utils/role.ts`.

## Breaking Changes

⚠️ **Atenção**: Se você estava usando `userType` da API, agora deve usar `role`:

- ❌ `response.user.userType === "student"`
- ✅ `response.user.role === "STUDENT"` ou `isStudent(response.user.role)`

- ❌ `response.user.userType === "gym"`
- ✅ `response.user.role === "GYM"` ou `isGym(response.user.role)`

- ❌ `response.user.userType === "admin"`
- ✅ `response.user.role === "ADMIN"` ou `isAdmin(response.user.role)`
