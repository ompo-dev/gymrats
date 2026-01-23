# GymRats
Plataforma open source para gamificacao de treinos, educacao fitness e gestao completa de academias.

## Visao geral
O GymRats une tres frentes em um unico ecossistema:
- Aluno: treino, nutricao e educacao gamificados.
- Academia: operacao, faturamento e retencao com dados em tempo real.
- Comunidade: extensoes e features criadas por devs para evoluir o produto.

## Proposta de valor
- Para alunos: evolucao constante, motivacao diaria e conteudo pratico.
- Para academias: gestao, dados e receita com previsibilidade.
- Para devs: um produto vivo, aberto e com oportunidades reais de receita.

## Open source de verdade
Todo o codigo de front-end, back-end, contratos e plugins e aberto para a comunidade.
Excecoes:
- Banco de dados (Supabase) e seus dados.
- Chaves e segredos em arquivos `.env`.

Isso garante seguranca e conformidade, mantendo o core aberto e evolutivo.

## Edicoes e monetizacao
O core e open source e gratuito para uso e contribuicao. A estrategia de produtos:
- **Free (Community)**: funcionalidades essenciais e acesso ao core aberto.
- **Premium**: recursos avancados, especialmente IA e automacoes complexas.
- **Enterprise**: limites e governanca sob medida (ex.: numero de academias e alunos).

Regras claras:
- O que e core e permanece aberto.
- O que envolve IA e operacoes complexas sera Premium.
- Enterprise limita quantitativos (academias, alunos, uso de recursos).

## Observabilidade e revenue share
O projeto tera integracao nativa com um produto proprio de observabilidade para:
- validar uso real de features criadas pela comunidade;
- medir impacto em retencao e receita;
- permitir repasse de porcentagens de lucro a quem contribuiu com features relevantes.

## Como usuarios podem contribuir
- Feedback de produto e roadmap (issues e discussoes).
- Validacao de features com dados reais (academias parceiras).
- Traducao, documentacao e testes de usabilidade.

## Como devs podem contribuir
- Novas features e melhorias no core.
- Plugins e integracoes para academias.
- Otimizacoes de performance, UX e offline-first.
- Observabilidade, eventos e telemetria de uso.

## Recompensas futuras (community revenue share)
Nossa meta e criar um modelo transparente de recompensa:
- Features aceitas e usadas em producao serao monitoradas.
- O impacto em receita e retencao sera medido.
- Contribuicoes relevantes poderao receber percentual de lucro.

## Arquitetura (macro)
Monorepo com separacao clara de UI, aplicacao, dominio e infraestrutura.

- **Front-end**: Next.js (App Router), React 19, PWA, offline-first.
- **Back-end**: Bun + Elysia, DDD e Clean Architecture.
- **Dados**: Prisma + Postgres (Supabase).
- **Contratos**: schemas tipados compartilhados via `packages/contracts`.

## Estrutura do repositorio
```
gymrats/
├── front-end/        # Next.js App Router + PWA
├── back-end/         # API (Bun + Elysia), DDD e modules
├── package.json      # Raiz (prisma tooling)
└── README.md         # Este arquivo
```

## Como rodar localmente (dev)
Pre-requisitos:
- Bun (runtime e package manager)
- Node.js 18+ (para scripts auxiliares)
- Postgres (ou Supabase)

Passos:
1) Configure variaveis de ambiente em `front-end/.env.local` e `back-end/.env`.
2) Back-end:
   - `cd back-end`
   - `bun install`
   - `bun run dev`
3) Front-end:
   - `cd front-end`
   - `bun install`
   - `bun run dev`

## Configuracoes de ambiente
Nunca versionamos chaves e segredos. Apenas as variaveis abaixo:

### Back-end (`back-end/.env`)
```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?pgbouncer=true
DIRECT_URL=postgresql://<user>:<password>@<host>:<port>/<db>
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=<sua_chave>
GOOGLE_CLIENT_ID=<seu_client_id>
GOOGLE_CLIENT_SECRET=<seu_client_secret>
EMAIL_USER=<seu_email>
EMAIL_PASSWORD=<sua_senha>
DEEPSEEK_API_KEY=<sua_chave>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Front-end (`front-end/.env.local`)
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=<sua_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
```

## Documentacao
- Front-end: `front-end/README.md`
- Swagger: `front-end/SWAGGER.md`

## Contribuicao
Contribuicoes sao bem-vindas e incentivadas.
Pontos-chave:
- Use TypeScript e mantenha tipagem forte.
- Respeite separacao de camadas (UI, aplicacao, dominio, infraestrutura).
- Mantenha regras de negocio fora de frameworks e runtimes.
- Features novas devem incluir telemetria basica de uso.

Boas praticas:
- Abra issue antes de features grandes.
- Documente o objetivo e o impacto esperado.
- Evite acoplamento direto a infraestrutura externa.

## Roadmap (alto nivel)
- Offline-first completo com sincronizacao resiliente.
- Marketplace de plugins com permissao e faturamento por uso.
- Observabilidade unificada e painel de impacto por feature.
- Evolucao de IA para treinos, nutricao e suporte ao instrutor.

## Licenca
Open source. A licenca final sera definida e publicada no repositorio.
