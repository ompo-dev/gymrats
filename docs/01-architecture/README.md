# 01-architecture

- Caminho: `docs/01-architecture`
- Finalidade: documentacao tecnica e funcional da arquitetura do GymRats.

## Arquivos

- `ANALISE_COMPLETA_PROJETO.md`: visao geral funcional e tecnica do produto.
- `ARQUITETURA_COMPLETA_SISTEMA.md`: documentacao ampla da arquitetura existente.
- `FILE_TREE_RUNTIME_MAP.md`: mapa da arvore de apps/pacotes e como os runtimes se conectam.
- `MONOREPO_VERCEL_ARQUITETURA_ALVO.md`: diagnostico do estado atual e arquitetura-alvo em monorepo compativel com a Vercel.
- `plan.md`: notas e planos de evolucao da camada de arquitetura.

## Guia de leitura

- Leia `MONOREPO_VERCEL_ARQUITETURA_ALVO.md` primeiro para entender o estado real atual, os riscos de producao e a direcao recomendada.
- Use `ARQUITETURA_COMPLETA_SISTEMA.md` como referencia historica e panoramica.
- Use `ANALISE_COMPLETA_PROJETO.md` para onboarding funcional do produto.
- Use `plan.md` como apoio para iniciativas em andamento.

## Observacoes

- O projeto ja esta em producao com clientes ativos.
- O deploy atual e um unico app Next.js na Vercel, com frontend e backend juntos.
- Qualquer migracao estrutural deve ser incremental e preservar esse runtime enquanto o monorepo e consolidado.
