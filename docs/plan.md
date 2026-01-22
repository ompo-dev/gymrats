Plano de Migração: npm + Next.js API Routes → Bun + Elysia
Visão Geral
Migração do backend de Next.js API Routes para Elysia rodando em Bun, mantendo:

✅ Arquitetura offline-first do frontend (Zustand, IndexedDB, Service Worker)
✅ Prisma ORM (compatível com Bun)
✅ Better Auth (adaptação necessária)
✅ Todos os handlers e rotas existentes
✅ Sistema de autenticação e middleware
Estrutura Atual vs Nova
Atual
app/api/                    → Next.js API Routes
lib/api/handlers/          → Handlers (NextRequest/NextResponse)
lib/api/middleware/        → Middleware de autenticação
lib/db.ts                  → Prisma Client
lib/auth-config.ts         → Better Auth config
Nova
server/                     → Servidor Elysia
  ├── index.ts             → Entry point do servidor
  ├── plugins/            → Plugins Elysia (auth, db, etc)
  ├── routes/              → Rotas organizadas por domínio
  │   ├── students.ts
  │   ├── gyms.ts
  │   ├── workouts.ts
  │   └── ...
  ├── handlers/            → Handlers adaptados para Elysia
  └── middleware/          → Middleware adaptado
lib/db.ts                  → Prisma Client (mantido)
lib/auth-config.ts         → Better Auth adaptado para Elysia
Fases da Migração
Fase 1: Setup Bun e Elysia
Instalar Bun
Verificar instalação: bun --version
Se não instalado: curl -fsSL https://bun.sh/install | bash
Criar estrutura de servidor
Criar server/ na raiz
Criar server/index.ts como entry point
Configurar package.json com scripts Bun
Instalar dependências Elysia
bun add elysia @elysiajs/cors @elysiajs/swagger @elysiajs/bearer
bun add -d @types/node
Migrar dependências npm → Bun
Converter package.json para usar Bun
Manter todas as dependências (Prisma, Better Auth, etc)
Atualizar scripts para usar bun em vez de npm
Fase 2: Configuração Base
Plugin de Database (Prisma)
Criar server/plugins/db.ts
Exportar instância do Prisma Client
Garantir singleton pattern (compatível com Bun)
Plugin de Autenticação (Better Auth)
Criar server/plugins/auth.ts com .mount(auth.handler)
Configurar CORS para Better Auth
Criar macros de autenticação (server/plugins/auth-macro.ts)
Criar macros por role (server/plugins/auth-roles.ts)
Middleware de autenticação via macros Elysia (type-safe)
Plugin de CORS e Headers
Configurar CORS para frontend Next.js
Headers de segurança
Cache headers (quando necessário)
Plugin OpenAPI/Swagger
Configurar Swagger para documentação
Manter compatibilidade com documentação existente
Fase 3: Migração de Handlers
Estratégia: Converter handlers um por um, mantendo lógica de negócio

Padrão de Conversão:

Antes (Next.js):

// lib/api/handlers/students.handler.ts
export async function getStudentProfileHandler(
  request: NextRequest
): Promise<NextResponse> {
  const auth = await requireStudent(request);
  if ("error" in auth) return auth.response;
  // ... lógica
  return successResponse({ data });
}
Depois (Elysia):

// server/handlers/students.handler.ts
import { Elysia } from 'elysia'
import { requireStudent } from '../plugins/auth'

export const getStudentProfile = (app: Elysia) =>
  app.get('/profile', async ({ user, db }) => {
    // user já vem do plugin de auth
    // ... mesma lógica
    return { data }
  })
Handlers a Migrar (por prioridade):

Auth (lib/api/handlers/auth.handler.ts - se existir)
Rotas: /api/auth/*
Adaptar Better Auth para Elysia
Students (lib/api/handlers/students.handler.ts)
Rotas: /api/students/*
9 handlers principais
Gyms (lib/api/handlers/gyms.handler.ts)
Rotas: /api/gyms/*
5 handlers
Workouts (lib/api/handlers/workouts.handler.ts)
Rotas: /api/workouts/*
6 handlers
Nutrition (lib/api/handlers/nutrition.handler.ts)
Rotas: /api/nutrition/*, /api/foods/*
4 handlers
Subscriptions (lib/api/handlers/subscriptions.handler.ts)
Rotas: /api/subscriptions/*
4 handlers
Gym Subscriptions (lib/api/handlers/gym-subscriptions.handler.ts)
Rotas: /api/gym-subscriptions/*
4 handlers
Payments (lib/api/handlers/payments.handler.ts)
Rotas: /api/payments/*, /api/payment-methods/*, /api/memberships
4 handlers
Fase 4: Middleware e Utils
Middleware de Autenticação
Converter lib/api/middleware/auth.middleware.ts
Criar plugin Elysia: server/plugins/auth.ts
Funções: requireAuth, requireStudent, requireGym, requireAdmin
Utils de Resposta
Adaptar lib/api/utils/response.utils.ts
Elysia usa Response nativo, adaptar helpers
Utils de Erro
Adaptar lib/api/utils/error.utils.ts
Tratamento de erros Elysia
Validação (Zod)
Elysia suporta Zod nativamente
Migrar schemas de lib/api/schemas/
Usar t.Object() do Elysia ou manter Zod
Fase 5: Rotas e Organização
Estrutura de Rotas Elysia:

// server/index.ts
import { Elysia } from 'elysia'
import { studentsRoutes } from './routes/students'
import { gymsRoutes } from './routes/gyms'
// ... outras rotas

const app = new Elysia()
  .use(authPlugin)
  .use(dbPlugin)
  .use(corsPlugin)
  .use(swaggerPlugin)
  .group('/api', (app) =>
    app
      .group('/students', studentsRoutes)
      .group('/gyms', gymsRoutes)
      .group('/workouts', workoutsRoutes)
      // ... outros grupos
  )
  .listen(3001) // Porta diferente do Next.js (3000)
Organização por Domínio:

server/routes/students.ts - Todas rotas de students
server/routes/gyms.ts - Todas rotas de gyms
server/routes/workouts.ts - Todas rotas de workouts
etc.
Fase 6: Integração com Next.js Frontend
Proxy no Next.js
Configurar next.config.mjs para proxy de /api/* para Elysia
OU manter Next.js apenas para frontend e Elysia em porta separada
Atualizar URLs no Frontend
Se Elysia em porta separada: atualizar lib/api/client.ts
Se proxy: manter URLs como estão
Service Worker
Atualizar public/sw.js se necessário
URLs de API devem apontar para Elysia
Fase 7: Better Auth no Elysia
✅ Solução Confirmada: Better Auth tem integração nativa com Elysia via .mount(auth.handler)!

Implementação:

Montar Handler do Better Auth
// server/plugins/auth.ts
import { Elysia } from 'elysia'
import { auth } from '@/lib/auth-config'
import { cors } from '@elysiajs/cors'

export const betterAuthPlugin = new Elysia({ name: 'better-auth' })
  .use(
    cors({
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .mount(auth.handler) // Monta todas as rotas /api/auth/*
Criar Macro para Middleware de Autenticação
// server/plugins/auth-macro.ts
import { Elysia } from 'elysia'
import { auth } from '@/lib/auth-config'

export const authMacro = new Elysia({ name: 'auth-macro' })
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        
        if (!session) {
          return status(401, { error: 'Não autenticado' })
        }

        // Buscar dados completos do usuário
        const { db } = await import('@/lib/db')
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          include: {
            student: { select: { id: true } },
            gyms: { select: { id: true } },
          },
        })

        if (!user) {
          return status(401, { error: 'Usuário não encontrado' })
        }

        return {
          user: {
            ...user,
            student: user.student || undefined,
            gyms: user.gyms || [],
          },
          session: session.session,
          userId: user.id,
        }
      },
    },
  })
Macros Específicos por Role
// server/plugins/auth-roles.ts
export const requireStudentMacro = new Elysia({ name: 'require-student' })
  .macro({
    requireStudent: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        
        if (!session) {
          return status(401, { error: 'Não autenticado' })
        }

        const { db } = await import('@/lib/db')
        const user = await db.user.findUnique({
          where: { id: session.user.id },
          include: { student: true },
        })

        const isAdmin = user?.role === 'ADMIN'
        
        if (!isAdmin && !user?.student) {
          return status(403, { error: 'Acesso negado: requer role STUDENT ou ADMIN' })
        }

        // Para ADMIN sem student, criar automaticamente
        if (isAdmin && !user.student) {
          const student = await db.student.create({
            data: { userId: user.id },
          })
          user.student = student
        }

        return {
          user: {
            ...user,
            student: user.student || { id: user.student?.id! },
          },
          userId: user.id,
          studentId: user.student?.id!,
        }
      },
    },
  })
Uso nas Rotas
// server/routes/students.ts
import { Elysia } from 'elysia'
import { requireStudentMacro } from '../plugins/auth-roles'

export const studentsRoutes = new Elysia()
  .use(requireStudentMacro)
  .get('/profile', ({ user, studentId }) => {
    // user e studentId já disponíveis via macro
    // ... lógica do handler
  }, {
    requireStudent: true, // Ativa o macro
  })
Benefícios:

✅ Better Auth totalmente integrado no Elysia
✅ Rotas /api/auth/* funcionam nativamente
✅ Middleware de autenticação via macros (type-safe)
✅ Compatibilidade total com frontend existente
✅ CORS configurado corretamente
Fase 8: Scripts e Build
Atualizar package.json
{
  "scripts": {
    "dev": "bun run server/index.ts",
    "dev:next": "next dev",
    "dev:all": "concurrently \"bun run dev\" \"bun run dev:next\"",
    "build": "prisma generate && bun run build:server",
    "build:server": "bun build server/index.ts --outdir ./dist",
    "start": "bun run dist/index.js"
  }
}
Configurar Bun para produção
Build otimizado
Variáveis de ambiente
Process manager (PM2, systemd, etc)
Fase 9: Testes e Validação
Testar cada rota migrada
Comparar respostas com versão Next.js
Validar autenticação
Validar validação de dados
Testar integração frontend
Verificar se offline-first continua funcionando
Testar sincronização
Validar Service Worker
Performance
Benchmark Elysia vs Next.js
Verificar latência
Validar throughput
Fase 10: Deploy e Monitoramento
Deploy Elysia
Configurar servidor separado ou container
Porta: 3001 (ou configurável)
Health check endpoint
Deploy Next.js (frontend)
Manter deploy atual
Configurar proxy se necessário
Monitoramento
Logs estruturados
Métricas de performance
Error tracking
Arquivos Principais a Criar/Modificar
Novos Arquivos
server/index.ts - Entry point Elysia
server/plugins/db.ts - Plugin Prisma
server/plugins/auth.ts - Plugin autenticação
server/plugins/cors.ts - Plugin CORS
server/routes/*.ts - Rotas por domínio
server/handlers/*.ts - Handlers adaptados
bunfig.toml - Configuração Bun (opcional)
Arquivos a Modificar
package.json - Scripts e dependências
lib/api/client.ts - URLs de API (se necessário)
next.config.mjs - Proxy para Elysia (se necessário)
.env - Variáveis de ambiente (porta Elysia)
Arquivos a Manter
lib/db.ts - Prisma Client (reutilizar)
lib/offline/* - Sistema offline-first (não muda)
stores/* - Zustand stores (não muda)
hooks/* - React hooks (não muda)
prisma/schema.prisma - Schema (não muda)
Considerações Importantes
Compatibilidade
✅ Prisma funciona nativamente com Bun
✅ Zod funciona com Elysia
✅ Better Auth tem integração nativa com Elysia (.mount(auth.handler))
✅ TypeScript funciona normalmente
✅ Todos os plugins necessários disponíveis (@elysiajs/cors, @elysiajs/swagger, etc)
Performance
Elysia é mais rápido que Next.js API Routes
Bun é mais rápido que Node.js
Redução de latência esperada: 20-40%
Arquitetura
Frontend offline-first não muda
Backend apenas muda de framework
APIs REST mantêm mesma interface
Compatibilidade total com frontend existente
Riscos e Mitigações
Risco 1: Better Auth incompatível
Status: ✅ Resolvido - Better Auth tem integração nativa com Elysia

Solução: Usar .mount(auth.handler) para montar todas as rotas de autenticação diretamente no Elysia

Risco 2: Quebra de compatibilidade de rotas
Mitigação: Testes extensivos, migração gradual

Risco 3: Performance inesperada
Mitigação: Benchmarks antes/depois, rollback plan

Risco 4: Dependências incompatíveis
Mitigação: Verificar compatibilidade antes de migrar

Timeline Estimado
Fase 1-2: 2-3 dias (Setup e configuração)
Fase 3: 5-7 dias (Migração de handlers)
Fase 4-5: 2-3 dias (Middleware e rotas)
Fase 6-7: 1-2 dias (Integração e auth - simplificado com integração nativa)
Fase 8-9: 2-3 dias (Build e testes)
Fase 10: 1-2 dias (Deploy)
Total: ~14-18 dias de desenvolvimento (reduzido devido à integração nativa do Better Auth)

Próximos Passos Imediatos
Instalar Bun e verificar compatibilidade
Criar estrutura básica do servidor Elysia
Migrar 1-2 handlers como POC (proof of concept)
Validar abordagem antes de migração completa
Decidir estratégia para Better Auth